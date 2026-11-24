package com.claimflow.event;

import com.claimflow.entity.Claim.Status;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "claim_outbox", uniqueConstraints = @UniqueConstraint(columnNames = {"claim_id", "claim_sequence"}))
class OutboxEntry {
    @Id
    private UUID eventId;
    private String eventType;
    @Column(name = "claim_id")
    private long claimId;
    @Column(name = "claim_sequence")
    private int claimSequence;
    private Instant occurredAt;
    @Enumerated(EnumType.STRING)
    private Status status;
    private Instant publishedAt;

    protected OutboxEntry() {}

    OutboxEntry(ClaimEvent event) {
        eventId = event.eventId();
        eventType = event.eventType();
        claimId = event.claimId();
        claimSequence = event.claimSequence();
        occurredAt = event.occurredAt();
        status = event.status();
    }

    ClaimEvent event() {
        return new ClaimEvent(eventId, eventType, 1, claimId, claimSequence, occurredAt, status);
    }

    void markPublished() {
        publishedAt = Instant.now();
    }
}
