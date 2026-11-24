package com.claimflow.service;

import com.claimflow.dto.ClaimContracts.*;
import com.claimflow.entity.Claim;
import com.claimflow.entity.Claim.Action;
import com.claimflow.entity.Claim.Status;
import com.claimflow.event.ClaimOutbox;
import com.claimflow.repository.ClaimRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Currency;
import java.util.List;

import static com.claimflow.service.DemoActors.forbidden;
import static com.claimflow.service.DemoActors.isOfficer;

@Service
@Transactional(readOnly = true)
public class ClaimService {
    private final ClaimRepository claims;
    private final ClaimOutbox outbox;

    public ClaimService(ClaimRepository claims, ClaimOutbox outbox) {
        this.claims = claims;
        this.outbox = outbox;
    }

    @Transactional
    public View submit(String actor, Create request) {
        if (isOfficer(actor)) {
            throw forbidden();
        }
        BigDecimal requested = money(request.requestedAmount(), request.currency());
        Claim claim = new Claim(actor, request.type(), request.market(), request.incidentDate(),
                request.description().strip(), request.currency(), requested, Instant.now());
        claims.save(claim);
        outbox.record(claim, "CLAIM_SUBMITTED");
        return View.from(claim, true);
    }

    public List<View> list(String actor, Status status, String officerId) {
        List<Claim> visible = isOfficer(actor)
                ? claims.findAllByOrderByIdDesc()
                : claims.findByClaimantIdOrderByIdDesc(actor);
        return visible.stream()
                .filter(claim -> status == null || claim.getStatus() == status)
                .filter(claim -> officerId == null || officerId.equals(claim.getOfficerId()))
                .map(claim -> View.from(claim, false))
                .toList();
    }

    public View detail(String actor, long id) {
        return View.from(visibleClaim(actor, id, isOfficer(actor)), true);
    }

    @Transactional
    public View progress(String actor, long id, Progress request) {
        boolean officer = isOfficer(actor);
        Claim claim = visibleClaim(actor, id, officer);
        Action action = request.action();
        if (officer == (action == Action.SUPPLY_INFO)) {
            throw forbidden();
        }
        if (officer && action != Action.PICK_UP && !actor.equals(claim.getOfficerId())) {
            throw forbidden();
        }
        String message = request.message();
        BigDecimal approved = null;
        switch (action) {
            case REQUEST_INFO, SUPPLY_INFO, APPROVE, REJECT -> {
                if (message == null || message.isBlank()) {
                    throw badRequest("A message is required for " + action);
                }
            }
            default -> { }
        }
        if (action == Action.APPROVE) {
            approved = money(request.approvedAmount(), claim.getCurrency());
            if (approved.compareTo(claim.getRequestedAmount()) > 0) {
                throw badRequest("Approved amount must be at most the requested amount");
            }
        } else if (request.approvedAmount() != null) {
            throw badRequest("Approved amount is only valid for APPROVE");
        }
        claim.progress(action, actor, message == null ? null : message.strip(), approved, Instant.now());
        claims.flush();
        outbox.recordAction(claim, action);
        return View.from(claim, true);
    }

    private Claim visibleClaim(String actor, long id, boolean officer) {
        return claims.findById(id)
                .filter(claim -> officer || actor.equals(claim.getClaimantId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));
    }

    private static BigDecimal money(String value, String code) {
        Currency currency;
        try {
            currency = Currency.getInstance(code);
        } catch (IllegalArgumentException invalidCode) {
            throw badRequest("Currency must be a valid ISO 4217 code");
        }
        if (value == null) {
            throw badRequest("Amount is required");
        }
        BigDecimal amount = new BigDecimal(value);
        if (amount.signum() <= 0 || amount.scale() > currency.getDefaultFractionDigits()) {
            throw badRequest("Amount must be positive and use the currency's decimal scale");
        }
        return amount;
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
