package com.claimflow.event;

import com.claimflow.entity.Claim.Status;

import java.time.Instant;
import java.util.UUID;

public record ClaimEvent(UUID eventId, String eventType, int schemaVersion, long claimId, int claimSequence,
                         Instant occurredAt, Status status) {
    public static final String TOPIC = "claimflow.claim-events.v1";
}
