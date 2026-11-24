# ClaimFlow architecture

## Application boundaries

A Java 21 Spring Boot modular monolith contains claims, reporting and event handling. One service and one file-backed H2 database keep setup small and allow ownership checks, workflow changes and history to share a transaction. Spring Data JPA persists claims. Optimistic locking prevents two officers from both picking up the same claim. One Angular app provides claimant, officer and management routes.

## REST and Kafka

REST handles reads and commands that need an immediate answer, such as `POST /api/claims` and `GET /api/dashboard`. Spring Boot validates each command and returns the committed state or an error. The Angular development server proxies `/api/**` to Spring Boot. H2 is authoritative for claim details, history and reporting.

Kafka handles follow-up work after a lifecycle change commits. One topic, `claimflow.claim-events.v1`, carries seven lifecycle events. Each message is keyed by claim ID, and the publisher sends earlier pending events for that claim first. Event messages contain identifiers, status and timing, while incident details and claimant messages remain in H2.

## Transactional outbox and duplicate handling

The claim update, history entry and outbox row commit together. A rollback creates no publishable event. A background publisher retries pending rows and marks each published after broker acknowledgement. The claim API can continue writing while Kafka is offline.

A crash after Kafka acknowledges a message may cause that row to be sent again. Retries reuse the event ID, and the consumer uses that ID as the primary key of the local notification record. Replay can produce another Kafka record while keeping one notification. This is at-least-once delivery with an idempotent database effect.

## Reporting

The dashboard reads claims and history in one repository query and aggregates them in memory for the local dataset. Counts for approvals, rejections and settlements come from history and are attributed to the actor who took each action. Average resolution time measures submission to settlement or rejection and is weighted across those resolved claims. Date filters apply only to historical performance.

Estimated outstanding exposure uses the requested amount before approval and the approved amount while awaiting settlement. Rejected and settled claims contribute zero. The backend sums exact decimal amounts separately by currency, and the UI displays the returned values without conversion. This is a demo exposure estimate.

## Stored records

| Record | Purpose |
| --- | --- |
| Claim | Incident, market, type, claimant and assigned officer IDs, money, status and version |
| History | Ordered workflow entries with actor, status, time and any message |
| Outbox | Stable event ID, claim sequence, event type, resulting status and publication time |
| Notification | One durable local record per claimant-facing event ID |

The demo uses four fixed actor IDs. The backend checks the supplied role, ownership and assignment, and the caller chooses the demo identity. See the [README](../README.md) for the verified scope.
