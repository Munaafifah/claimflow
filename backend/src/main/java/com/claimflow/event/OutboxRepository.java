package com.claimflow.event;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

interface OutboxRepository extends JpaRepository<OutboxEntry, UUID> {
    @Query("""
            select e from OutboxEntry e
            where e.publishedAt is null and not exists (
                select older.eventId from OutboxEntry older
                where older.claimId = e.claimId and older.claimSequence < e.claimSequence
                  and older.publishedAt is null
            )
            order by e.occurredAt, e.claimId
            """)
    List<OutboxEntry> findPendingHeads(Pageable page);
}
