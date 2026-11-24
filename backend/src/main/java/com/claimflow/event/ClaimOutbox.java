package com.claimflow.event;

import com.claimflow.entity.Claim;
import com.claimflow.entity.Claim.Action;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional(propagation = Propagation.MANDATORY)
public class ClaimOutbox {
    private final OutboxRepository repository;

    ClaimOutbox(OutboxRepository repository) {
        this.repository = repository;
    }

    public void record(Claim claim, String eventType) {
        repository.save(new OutboxEntry(new ClaimEvent(UUID.randomUUID(), eventType, 1, claim.getId(),
                claim.getHistory().size(), claim.getUpdatedAt(), claim.getStatus())));
    }

    public void recordAction(Claim claim, Action action) {
        switch (action) {
            case PICK_UP -> record(claim, "CLAIM_ASSIGNED");
            case REQUEST_INFO -> record(claim, "CLAIM_INFO_REQUESTED");
            case SUPPLY_INFO -> record(claim, "CLAIM_INFO_RECEIVED");
            case APPROVE -> record(claim, "CLAIM_APPROVED");
            case REJECT -> record(claim, "CLAIM_REJECTED");
            case SETTLE -> record(claim, "CLAIM_SETTLED");
            case RESUME_REVIEW -> { }
        }
    }
}
