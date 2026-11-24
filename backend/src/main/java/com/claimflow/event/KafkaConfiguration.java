package com.claimflow.event;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@Profile("kafka")
@EnableScheduling
class KafkaConfiguration {
    @Bean
    NewTopic claimEventsTopic() {
        return TopicBuilder.name(ClaimEvent.TOPIC).partitions(1).replicas(1).build();
    }
}
