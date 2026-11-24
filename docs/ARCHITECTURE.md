# Proposed architecture

Use a Java 21 Spring Boot modular monolith with Spring Data JPA and file-backed H2. One process and one database transaction can enforce ownership, update claim state and append history. H2 keeps local setup small and preserves claims across restarts. Use the Maven Wrapper and add one Angular app with role-specific routes after the API is verified. The handover's layered backend and feature-based frontend directories are the starting layout. Use OpenAPI if time permits and keep the written API contract current either way.

REST handles queries and commands because the caller needs the committed state or a clear validation error. Kafka carries asynchronous workflow events for downstream consumers. The database remains authoritative for claim tracking and dashboards. A notification adapter could later subscribe independently. The MVP displays decisions in the claimant view.

The dashboard uses one read-only repository query to fetch claims and their history together. The service calculates the current snapshot and historical outcomes in memory, which keeps the business rules visible and avoids a query per claim. This works for the local demo dataset. Larger datasets would benefit from database-side aggregation and a query restricted to outcome events in the selected period.

The claim transaction saves an outbox row alongside the claim and history for each published milestone. A single publisher in the Kafka profile retries the oldest pending event per claim and marks it published after broker acknowledgement. A crash between acknowledgement and marking can produce a duplicate. The demo notification consumer inserts a durable record keyed by event ID, so replay cannot create a second notification. The claim API remains usable during a Kafka outage.

Use seeded demo actors. Every backend operation checks the applicable role, claimant ownership and staff assignment. The actor selector represents an identity supplied by the caller and provides no authentication. Keep this local and use fictional data.

## Data model

The first backend milestone uses fixed demo actor IDs in the service and maps history as an ordered JPA collection stored in a separate table. The proposed user and outbox entities describe possible later persistence work.

| Entity | Fields and relationships |
| --- | --- |
| User | ID, display name, role. One claimant can submit many claims and one officer can hold many assignments. |
| Claim | ID, claimant ID, nullable assigned officer ID, type, market, incident date, description, currency, requested amount, nullable approved amount, status, UTC creation and update times, version. Use optimistic locking to turn concurrent stale writes into a conflict. |
| Claim history | ID, claim ID, actor ID, action, optional previous status, new status, claimant-visible message, UTC timestamp. Multiple append-only rows per claim, written with the state change. |
| Event outbox | Event ID, claim ID, history sequence, event type, resulting status, occurrence time, nullable publication time. |
| Demo notification | Event ID as primary key, claim ID and event type. Stores one record per claimant-facing event. |
