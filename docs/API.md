# Proposed API contract

Send JSON over HTTP under `/api`. Supply the seeded actor ID in `X-Demo-User-Id`. Return ISO 8601 dates and UTC timestamps. Represent money as decimal strings paired with a currency code.

The claim endpoints are implemented. The dashboard and Kafka contracts describe planned milestones. Claim detail and mutation responses include history. List responses omit history entries.

| Method and path | Access and behavior |
| --- | --- |
| `POST /api/claims` | Claimant. Accept `type`, `market`, `incidentDate`, `description`, `requestedAmount`, `currency`. Return `201 Created` with the claim and a Location header. |
| `GET /api/claims` | Claimants see their own claims. Officers see the queue and can filter by status or assignee. |
| `GET /api/claims/{id}` | Owning claimant or officer. Return claim details and visible history. |
| `POST /api/claims/{id}/actions` | Accept `action` and action-specific fields. Perform an authorized transition and return the updated claim. |
| `GET /api/dashboard?from=…&to=…` | Officer. Return open counts by status and assignee, unassigned count, exposure by currency, and action counts within the inclusive-start, exclusive-end UTC interval. |

Actions are `PICK_UP`, `REQUEST_INFO`, `SUPPLY_INFO`, `RESUME_REVIEW`, `APPROVE`, `REJECT` and `SETTLE`. Require `message` for information requests, responses and decisions. Require `approvedAmount` on approval. Derive the next status and assignee on the server.

Return problem details with `400` for malformed or invalid inputs, `403` for disallowed roles or officer actions, `404` for missing claims or claims outside a claimant's visibility, and `409` for illegal transitions or concurrent updates.

## Kafka event contract

Publish JSON to `claimflow.claim-events.v1` with claim ID as the message key. Include `eventId`, `eventType`, `schemaVersion`, `claimId`, `claimVersion`, `occurredAt` and `status`. Event types reflect successful actions, such as `CLAIM_SUBMITTED`, `CLAIM_ASSIGNED`, `CLAIM_INFO_REQUESTED` and `CLAIM_SETTLED`. Keep incident descriptions, questions, answers and personal details in the database. Delivery is at least once when the local publisher and broker are available.
