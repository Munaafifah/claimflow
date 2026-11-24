package com.claimflow.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
@Profile("kafka")
class OutboxPublisher {
    private static final Logger log = LoggerFactory.getLogger(OutboxPublisher.class);
    private final OutboxRepository repository;
    private final KafkaTemplate<String, String> kafka;
    private final ObjectMapper json;

    OutboxPublisher(OutboxRepository repository, KafkaTemplate<String, String> kafka, ObjectMapper json) {
        this.repository = repository;
        this.kafka = kafka;
        this.json = json;
    }

    @Scheduled(fixedDelayString = "${claimflow.outbox.delay-ms:2000}")
    void publishPending() {
        for (OutboxEntry row : repository.findPendingHeads(PageRequest.of(0, 25))) {
            ClaimEvent event = row.event();
            try {
                kafka.send(ClaimEvent.TOPIC, Long.toString(event.claimId()), json.writeValueAsString(event))
                        .get(6, TimeUnit.SECONDS);
                row.markPublished();
                repository.save(row);
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
                return;
            } catch (Exception failure) {
                log.warn("Outbox event {} remains pending: {}", event.eventId(), failure.toString());
                return;
            }
        }
    }
}
