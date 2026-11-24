package com.claimflow.event;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "claim_notification")
class ClaimNotification {
    @Id
    @Column(name = "event_id")
    private UUID eventId;
    @Column(name = "claim_id", nullable = false)
    private long claimId;
    @Column(name = "event_type", nullable = false)
    private String eventType;

    protected ClaimNotification() {}
}
