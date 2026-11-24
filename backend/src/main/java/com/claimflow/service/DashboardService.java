package com.claimflow.service;

import com.claimflow.dto.DashboardContracts.*;
import com.claimflow.entity.Claim;
import com.claimflow.entity.Claim.History;
import com.claimflow.entity.Claim.Status;
import com.claimflow.entity.Claim.Type;
import com.claimflow.repository.ClaimRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;

@Service
@Transactional(readOnly = true)
public class DashboardService {
    private final ClaimRepository repository;

    public DashboardService(ClaimRepository repository) {
        this.repository = repository;
    }

    public Dashboard report(String actor, Instant from, Instant to) {
        if (!DemoActors.isOfficer(actor)) {
            throw DemoActors.forbidden();
        }
        if ((from == null) != (to == null) || (from != null && !from.isBefore(to))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Supply both from and to, with from before to");
        }

        var claims = repository.findAllWithHistory();
        var workload = new TreeMap<String, Map<Status, Long>>();
        var officerPerformance = new TreeMap<String, OutcomeCounts>();
        for (String officer : DemoActors.OFFICERS) {
            workload.put(officer, new EnumMap<>(Status.class));
            officerPerformance.put(officer, new OutcomeCounts());
        }
        var teamPerformance = new OutcomeCounts();
        var outstanding = new HashMap<OutstandingGroup, Long>();
        var exposure = new TreeMap<String, BigDecimal>();
        long completed = 0;
        long unassigned = 0;

        for (Claim claim : claims) {
            Status status = claim.getStatus();
            if (status == Status.SETTLED || status == Status.REJECTED) {
                completed++;
            } else {
                String officer = claim.getOfficerId();
                if (officer == null) {
                    unassigned++;
                } else {
                    workload.get(officer).merge(status, 1L, Long::sum);
                }
                outstanding.merge(new OutstandingGroup(claim.getMarket(), claim.getType(), status), 1L, Long::sum);
                BigDecimal amount = status == Status.APPROVED ? claim.getApprovedAmount() : claim.getRequestedAmount();
                exposure.merge(claim.getCurrency(), amount, BigDecimal::add);
            }
            for (History event : claim.getHistory()) {
                if (from == null || (!event.occurredAt().isBefore(from) && event.occurredAt().isBefore(to))) {
                    teamPerformance.record(event, claim.getCreatedAt());
                    OutcomeCounts individual = officerPerformance.get(event.actorId());
                    if (individual != null) {
                        individual.record(event, claim.getCreatedAt());
                    }
                }
            }
        }

        return new Dashboard(
                new Summary(claims.size(), unassigned, claims.size() - completed, completed),
                workload.entrySet().stream()
                        .map(entry -> new OfficerWorkload(entry.getKey(),
                                entry.getValue().values().stream().mapToLong(Long::longValue).sum(), entry.getValue()))
                        .toList(),
                outstanding.entrySet().stream()
                        .map(entry -> new OutstandingClaim(entry.getKey().market(), entry.getKey().type(),
                                entry.getKey().status(), entry.getValue()))
                        .sorted(Comparator.comparing(OutstandingClaim::market).thenComparing(OutstandingClaim::type)
                                .thenComparing(OutstandingClaim::status))
                        .toList(),
                exposure.entrySet().stream()
                        .map(entry -> new Exposure(entry.getKey(), entry.getValue().stripTrailingZeros().toPlainString()))
                        .toList(),
                new Performance(from, to, teamPerformance.approved, teamPerformance.settled, teamPerformance.rejected,
                        teamPerformance.averageResolutionSeconds(), officerPerformance.entrySet().stream()
                                .map(entry -> entry.getValue().forOfficer(entry.getKey())).toList()));
    }

    private record OutstandingGroup(String market, Type type, Status status) {}

    private static class OutcomeCounts {
        private long approved;
        private long settled;
        private long rejected;
        private Duration totalResolution = Duration.ZERO;

        void record(History event, Instant createdAt) {
            switch (event.action()) {
                case "APPROVE" -> approved++;
                case "SETTLE" -> {
                    settled++;
                    totalResolution = totalResolution.plus(Duration.between(createdAt, event.occurredAt()));
                }
                case "REJECT" -> {
                    rejected++;
                    totalResolution = totalResolution.plus(Duration.between(createdAt, event.occurredAt()));
                }
                default -> { }
            }
        }

        Double averageResolutionSeconds() {
            long resolved = settled + rejected;
            return resolved == 0 ? null : (totalResolution.getSeconds() + totalResolution.getNano() / 1e9) / resolved;
        }

        OfficerPerformance forOfficer(String officer) {
            return new OfficerPerformance(officer, approved, settled, rejected, averageResolutionSeconds());
        }
    }
}
