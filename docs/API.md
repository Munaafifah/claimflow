# Proposed API contract

Send JSON over HTTP under `/api`. Supply the seeded actor ID in `X-Demo-User-Id`. Return ISO 8601 dates and UTC timestamps. Represent money as decimal strings paired with a currency code.

Claim detail and mutation responses include history. List responses omit history entries.

| Method and path | Access and behavior |
| --- | --- |
| `POST /api/claims` | Claimant. Accept `type`, `market`, `incidentDate`, `description`, `requestedAmount`, `currency`. Return `201 Created` with the claim and a Location header. |
| `GET /api/claims` | Claimants see their own claims. Officers see the queue and can filter by status or assignee. |
| `GET /api/claims/{id}` | Owning claimant or officer. Return claim details and visible history. |
| `POST /api/claims/{id}/actions` | Accept `action` and action-specific fields. Perform an authorized transition and return the updated claim. |
| `GET /api/dashboard?from=…&to=…` | Officer. Return open counts by status and assignee, unassigned count, exposure by currency, and action counts within the inclusive-start, exclusive-end UTC interval. |

Actions are `PICK_UP`, `REQUEST_INFO`, `SUPPLY_INFO`, `RESUME_REVIEW`, `APPROVE`, `REJECT` and `SETTLE`. Require `message` for information requests, responses and decisions. Require `approvedAmount` on approval. Derive the next status and assignee on the server.

Return problem details with `400` for malformed or invalid inputs, `403` for disallowed roles or officer actions, `404` for missing claims or claims outside a claimant's visibility, and `409` for illegal transitions or concurrent updates.

## Dashboard response

Officers can supply both `from` and `to` as ISO 8601 instants, with `from` before `to`. The range includes `from`, excludes `to`, and applies only to performance. Omit both for all-time performance. Missing one boundary, malformed dates and invalid ranges return `400`.

| Field | Contents |
| --- | --- |
| `summary` | `total`, `unassigned`, `active`, `completed`. Completed means settled or rejected. Unassigned is a subset of active. |
| `officerWorkload` | Entries with `officerId`, `active` and `byStatus`. Both demo officers appear, including officers with zero active claims. |
| `outstandingClaims` | Entries with `market`, `type`, `status` and `count` for active claims. |
| `exposureByCurrency` | Entries with `currency` and decimal string `amount`. Use the requested amount before approval and the approved amount pending settlement. Completed claims contribute zero. |
| `performance` | `from`, `to`, `approved`, `settled`, `rejected`, `averageResolutionSeconds` and `byOfficer`. The latter contains the same outcome counts and average for each `officerId`. |

Performance counts use history timestamps and actor IDs. Each settlement or rejection contributes elapsed time from claim creation to that event. The team average uses all qualifying resolutions, and the average is `null` when there are none.

## Kafka event contract

The publisher sends JSON to `claimflow.claim-events.v1` with the claim ID as the message key. Fields are `eventId`, `eventType`, `schemaVersion`, `claimId`, `claimSequence`, `occurredAt` and `status`. The sequence is the one-based history position. Gaps can occur when an action, such as resuming review, only writes history. The seven event types and manual tests are in [the Kafka guide](KAFKA.md).
