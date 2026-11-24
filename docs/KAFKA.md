# Run and verify Kafka locally

From the repository root, start the single local broker.

```powershell
docker compose up -d kafka
docker compose logs --tail 30 kafka
```

Stop any existing Spring Boot run with Ctrl+C. In a terminal at the repository root, start the backend with the Kafka profile. Spring Boot creates the topic.

```powershell
cd backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=kafka"
```

The broker is exposed on localhost port 9092. The default Spring profile runs the REST API and still records outbox rows. Activating the Kafka profile publishes pending rows, including any queued by this version of the application during a previous REST-only run. Claims created before the outbox was added have no backfilled events.

## Observe events and exercise the HTTP flow

From a separate terminal in the repository root, run the console consumer. It prints the claim key and JSON value separated by a tab. It reads existing records and waits for new ones. Press Ctrl+C to exit.

```powershell
docker compose exec kafka /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic claimflow.claim-events.v1 --from-beginning --property print.key=true
```

For a quick check, run **Kafka 1–3** at the end of `claimflow.http`. The first two requests publish submission and assignment with the same key. The third returns `409` and publishes no event.

For all seven event types, run the Motor then Property examples in `claimflow.http`. Match the keys against the claim IDs returned by the two submissions.

- Motor publishes `CLAIM_SUBMITTED`, `CLAIM_ASSIGNED`, `CLAIM_INFO_REQUESTED`, `CLAIM_INFO_RECEIVED`, `CLAIM_APPROVED`, and `CLAIM_SETTLED`, in that order. The sequence skips the resume-review history step.
- Property publishes `CLAIM_SUBMITTED`, `CLAIM_ASSIGNED`, and `CLAIM_REJECTED`, in that order.
- Rejected requests create no events. The backend logs a demo notification for each submission, information request, approval, rejection or settlement.

## Simulate an outage

1. From the root, run `docker compose stop kafka`. Keep the Kafka-profile backend running.
2. Run **Kafka 1** and **Kafka 2** in `claimflow.http` to submit and assign a fresh claim. Expect HTTP `201` and `200`. The backend may log that an outbox event remains pending.
3. Run `docker compose start kafka`. Launch the console consumer again and find the fresh claim ID. Expect its submission followed by its assignment, without repeating either HTTP request.
4. Use `docker compose stop kafka` when finished. `docker compose down` removes the container and retains the named Kafka data volume.

## Replay a duplicate

Copy the JSON portion of a **published `CLAIM_SUBMITTED`** record from the console consumer after the backend has logged its notification. Replace the placeholder below with the exact JSON, retaining the same `eventId` and other fields. Run from the root in PowerShell.

```powershell
$eventJson = '<paste the exact JSON value here>'
$claimId = ($eventJson | ConvertFrom-Json).claimId
$record = "$claimId`t$eventJson"
$record | docker compose exec -T kafka /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic claimflow.claim-events.v1 --property parse.key=true
```

The console consumer shows the replayed record. The backend logs `Ignored duplicate notification event` for that ID. The automated test also checks directly that the database contains exactly one notification row for the ID.

The local broker has one partition and no replica. The app uses a single polling publisher, retains published outbox rows for inspection, and records notifications locally without sending email or SMS. Delivery is at least once, and an event ID remains stable across retries.
