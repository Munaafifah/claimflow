package com.claimflow.event;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@Profile("kafka")
class ClaimNotificationConsumer {
    private static final Logger log = LoggerFactory.getLogger(ClaimNotificationConsumer.class);
    private static final Set<String> NOTIFICATION_TYPES = Set.of(
            "CLAIM_SUBMITTED", "CLAIM_INFO_REQUESTED", "CLAIM_APPROVED", "CLAIM_REJECTED", "CLAIM_SETTLED");
    private final ObjectMapper json;
    private final JdbcTemplate database;

    ClaimNotificationConsumer(ObjectMapper json, JdbcTemplate database) {
        this.json = json;
        this.database = database;
    }

    @KafkaListener(topics = ClaimEvent.TOPIC)
    void onEvent(String payload) throws JsonProcessingException {
        ClaimEvent event = json.readValue(payload, ClaimEvent.class);
        if (event.schemaVersion() != 1 || !NOTIFICATION_TYPES.contains(event.eventType())) {
            return;
        }
        try {
            database.update("insert into claim_notification (event_id, claim_id, event_type) values (?, ?, ?)",
                    event.eventId(), event.claimId(), event.eventType());
        } catch (DuplicateKeyException duplicate) {
            log.info("Ignored duplicate notification event {}", event.eventId());
            return;
        }
        log.info("Recorded demo notification {} for claim {} ({})",
                event.eventId(), event.claimId(), event.eventType());
    }
}
