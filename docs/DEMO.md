# ClaimFlow demonstration

Start the app using the [README](../README.md). Use fictional data and note the IDs returned for new claims. On a fresh checkout, create demo claims before reviewing the dashboard.

| Scenario | Steps and expected result |
| --- | --- |
| Motor settlement | As **Claimant 1**, submit a motor claim in MY for MYR 500. As **Officer 1**, pick it up in **Incoming Claims**, approve MYR 450 with a reason, and confirm settlement. Return to **Claimant 1** to see the amount, decision and history. |
| Property and information | As **Claimant 2**, submit a property claim in SG for SGD 850.50. As **Officer 1**, pick it up and request a repair estimate. Switch to **Claimant 2** to reply, then switch back to **Officer 1** and resume review from **Assigned to Me**. Leave this claim under review to demonstrate outstanding exposure. |
| Rejection | Submit another property claim and pick it up as either officer. Reject it with a reason. Switch to its claimant and check the reason and terminal status in the timeline. |
| Management | As an officer, open **Management**. Inspect current workload, outstanding groups and exposure. Add a separate outstanding MYR claim to compare currencies. Apply a UTC range with no activity to see zero performance outcomes while the current snapshot stays the same. **Refresh** and the 30-second timer update the timestamp on success. |

For REST verification, use the named scenarios in [claimflow.http](../claimflow.http). Each starts with a new claim and uses the ID returned by the submission.

## Kafka

With Kafka running and the backend's `kafka` profile active, open a terminal at the checkout root.

```sh
docker compose exec kafka /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic claimflow.claim-events.v1 --from-beginning --property print.key=true
```

Run **Kafka 1–3** in the HTTP file. For the new claim ID, expect `CLAIM_SUBMITTED` and `CLAIM_ASSIGNED` in order. The rejected settlement returns `409` and creates no event. The [Kafka guide](KAFKA.md) covers broker outage recovery and duplicate replay.
