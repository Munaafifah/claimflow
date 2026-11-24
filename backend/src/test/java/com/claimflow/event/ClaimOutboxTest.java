package com.claimflow.event;

import com.claimflow.dto.ClaimContracts.Create;
import com.claimflow.dto.ClaimContracts.Progress;
import com.claimflow.entity.Claim.Action;
import com.claimflow.entity.Claim.Type;
import com.claimflow.repository.ClaimRepository;
import com.claimflow.service.ClaimService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:outbox",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class ClaimOutboxTest {
    @Autowired private ClaimService claims;
    @Autowired private ClaimRepository claimRepository;
    @Autowired private OutboxRepository outbox;
    @Autowired private TransactionTemplate transaction;
    @Autowired private ObjectMapper json;
    @Autowired private JdbcTemplate database;

    @Test
    void retainsPendingEventsOnFailureAndRetriesInClaimOrder() throws Exception {
        outbox.deleteAll();
        long claimId = submit();
        progress(claimId, Action.PICK_UP, "officer-1", null, null);
        progress(claimId, Action.REQUEST_INFO, "officer-1", "Provide estimate", null);
        progress(claimId, Action.SUPPLY_INFO, "claimant-1", "Workshop estimate", null);
        progress(claimId, Action.RESUME_REVIEW, "officer-1", null, null);
        progress(claimId, Action.APPROVE, "officer-1", "Covered", "10");
        progress(claimId, Action.SETTLE, "officer-1", null, null);
        long rejectedId = submit();
        progress(rejectedId, Action.PICK_UP, "officer-1", null, null);
        progress(rejectedId, Action.REJECT, "officer-1", "Excluded", null);
        assertThat(outbox.count()).isEqualTo(9);

        @SuppressWarnings("unchecked")
        KafkaTemplate<String, String> kafka = mock(KafkaTemplate.class);
        var sent = new java.util.ArrayList<ClaimEvent>();
        when(kafka.send(eq(ClaimEvent.TOPIC), anyString(), anyString())).thenAnswer(call -> {
            String payload = call.getArgument(2);
            ClaimEvent event = json.readValue(payload, ClaimEvent.class);
            assertThat(payload).doesNotContain("Workshop estimate", "claimant-1", "Demo incident");
            assertThat((String) call.getArgument(1)).isEqualTo(Long.toString(event.claimId()));
            sent.add(event);
            if (sent.size() == 1) {
                return CompletableFuture.failedFuture(new IllegalStateException("Broker unavailable"));
            }
            return CompletableFuture.<SendResult<String, String>>completedFuture(null);
        });
        OutboxPublisher publisher = new OutboxPublisher(outbox, kafka, json);
        for (int i = 0; i < 8; i++) {
            publisher.publishPending();
        }
        assertThat(sent.get(0)).isEqualTo(sent.get(1));
        assertThat(sent.stream().skip(1).filter(event -> event.claimId() == claimId))
                .extracting(ClaimEvent::claimSequence).containsExactly(1, 2, 3, 4, 6, 7);
        assertThat(sent.stream().skip(1).map(ClaimEvent::eventType)).contains(
                "CLAIM_SUBMITTED", "CLAIM_ASSIGNED", "CLAIM_INFO_REQUESTED", "CLAIM_INFO_RECEIVED",
                "CLAIM_APPROVED", "CLAIM_SETTLED", "CLAIM_REJECTED");
        assertThat(sent).hasSize(10);
    }

    @Test
    void rollsBackEventWithClaimAndSkipsInvalidTransitions() {
        long claimCount = claimRepository.count();
        long eventCount = outbox.count();
        transaction.executeWithoutResult(status -> {
            submit();
            status.setRollbackOnly();
        });
        assertThat(claimRepository.count()).isEqualTo(claimCount);
        assertThat(outbox.count()).isEqualTo(eventCount);

        long claimId = submit();
        assertThatThrownBy(() -> progress(claimId, Action.PICK_UP, "claimant-1", null, null))
                .isInstanceOf(RuntimeException.class);
        progress(claimId, Action.PICK_UP, "officer-1", null, null);
        assertThatThrownBy(() -> progress(claimId, Action.SETTLE, "officer-1", null, null))
                .isInstanceOf(com.claimflow.entity.Claim.InvalidTransition.class);
        assertThat(outbox.count()).isEqualTo(eventCount + 2);
    }

    @Test
    void duplicateDeliveryCreatesOnlyOneNotification() throws Exception {
        long claimId = submit();
        ClaimEvent event = outbox.findAll().stream().map(OutboxEntry::event)
                .filter(candidate -> candidate.claimId() == claimId).findFirst().orElseThrow();
        String payload = json.writeValueAsString(event);
        var consumer = new ClaimNotificationConsumer(json, database);
        consumer.onEvent(payload);
        consumer.onEvent(payload);
        assertThat(database.queryForObject("select count(*) from claim_notification where event_id = ?",
                Long.class, event.eventId())).isEqualTo(1L);
    }

    private long submit() {
        return claims.submit("claimant-1", new Create(Type.MOTOR, "MY", LocalDate.of(2025, 1, 1),
                "Demo incident", "20", "MYR")).id();
    }

    private void progress(long id, Action action, String actor, String message, String amount) {
        claims.progress(actor, id, new Progress(action, message, amount));
    }
}
