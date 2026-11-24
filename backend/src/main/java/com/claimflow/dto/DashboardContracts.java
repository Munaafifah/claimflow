package com.claimflow.dto;

import com.claimflow.entity.Claim.Status;
import com.claimflow.entity.Claim.Type;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class DashboardContracts {
    private DashboardContracts() {}

    public record Summary(long total, long unassigned, long active, long completed) {}

    public record OfficerWorkload(String officerId, long active, Map<Status, Long> byStatus) {}

    public record OutstandingClaim(String market, Type type, Status status, long count) {}

    public record Exposure(String currency, String amount) {}

    public record OfficerPerformance(String officerId, long approved, long settled, long rejected,
                                     Double averageResolutionSeconds) {}

    public record Performance(Instant from, Instant to, long approved, long settled, long rejected,
                              Double averageResolutionSeconds, List<OfficerPerformance> byOfficer) {}

    public record Dashboard(Summary summary, List<OfficerWorkload> officerWorkload,
                            List<OutstandingClaim> outstandingClaims, List<Exposure> exposureByCurrency,
                            Performance performance) {}
}
