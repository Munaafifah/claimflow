package com.claimflow.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Claim {
    public static class InvalidTransition extends RuntimeException {
        public InvalidTransition(String message) {
            super(message);
        }
    }

    public enum Type { MOTOR, PROPERTY }
    public enum Status { SUBMITTED, UNDER_REVIEW, INFO_REQUIRED, INFO_RECEIVED, APPROVED, REJECTED, SETTLED }
    public enum Action {
        PICK_UP(Status.SUBMITTED, Status.UNDER_REVIEW),
        REQUEST_INFO(Status.UNDER_REVIEW, Status.INFO_REQUIRED),
        SUPPLY_INFO(Status.INFO_REQUIRED, Status.INFO_RECEIVED),
        RESUME_REVIEW(Status.INFO_RECEIVED, Status.UNDER_REVIEW),
        APPROVE(Status.UNDER_REVIEW, Status.APPROVED),
        REJECT(Status.UNDER_REVIEW, Status.REJECTED),
        SETTLE(Status.APPROVED, Status.SETTLED);

        public final Status from;
        public final Status to;

        Action(Status from, Status to) {
            this.from = from;
            this.to = to;
        }
    }

    @Embeddable
    public record History(String actorId, String action, @Enumerated(EnumType.STRING) Status previousStatus,
                          @Enumerated(EnumType.STRING) Status status, @Column(length = 2000) String message,
                          Instant occurredAt) {}

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Version
    private long version;
    private String claimantId;
    private String officerId;
    @Enumerated(EnumType.STRING)
    private Type type;
    @Enumerated(EnumType.STRING)
    private Status status;
    private String market;
    private LocalDate incidentDate;
    @Column(length = 2000)
    private String description;
    private String currency;
    @Column(precision = 18, scale = 4)
    private BigDecimal requestedAmount;
    @Column(precision = 18, scale = 4)
    private BigDecimal approvedAmount;
    private Instant createdAt;
    private Instant updatedAt;
    @ElementCollection
    @OrderColumn(name = "sequence_number")
    private List<History> history = new ArrayList<>();

    protected Claim() {}

    public Claim(String claimantId, Type type, String market, LocalDate incidentDate, String description,
                 String currency, BigDecimal requestedAmount, Instant now) {
        this.claimantId = claimantId;
        this.type = type;
        this.market = market;
        this.incidentDate = incidentDate;
        this.description = description;
        this.currency = currency;
        this.requestedAmount = requestedAmount;
        status = Status.SUBMITTED;
        createdAt = now;
        updatedAt = now;
        history.add(new History(claimantId, "SUBMIT", null, status, null, now));
    }

    public void progress(Action action, String actorId, String message, BigDecimal amount, Instant now) {
        if (status != action.from) {
            throw new InvalidTransition("Action " + action + " is unavailable for " + status);
        }
        if (action == Action.PICK_UP) {
            officerId = actorId;
        }
        if (action == Action.APPROVE) {
            approvedAmount = amount;
        }
        history.add(new History(actorId, action.name(), status, action.to, message, now));
        status = action.to;
        updatedAt = now;
    }

    public Long getId() { return id; }
    public String getClaimantId() { return claimantId; }
    public String getOfficerId() { return officerId; }
    public Type getType() { return type; }
    public Status getStatus() { return status; }
    public String getMarket() { return market; }
    public LocalDate getIncidentDate() { return incidentDate; }
    public String getDescription() { return description; }
    public String getCurrency() { return currency; }
    public BigDecimal getRequestedAmount() { return requestedAmount; }
    public BigDecimal getApprovedAmount() { return approvedAmount; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public List<History> getHistory() { return List.copyOf(history); }
}
