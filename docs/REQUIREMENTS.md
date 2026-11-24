# ClaimFlow Phase 1 proposal

The assessment brief defines the outcomes and deliverables. The handover provides the proposed scope and review milestones. The file structure is a layout reference. The job description informs the quality bar for testing, AI review and explaining trade-offs.

## MVP and acceptance criteria

| Capability | Acceptance criteria |
| --- | --- |
| Submit and track | A claimant can submit a motor or property claim with market, incident date, description, requested amount and currency. The API returns an ID and `SUBMITTED`. The claimant can list and read their own claims, including decisions and public history. |
| Pick up and assess | An officer can list the queue and claim an unassigned submission. Pickup assigns the officer and moves the claim to `UNDER_REVIEW` atomically. A second concurrent pickup receives a conflict. |
| Request and supply information | The assigned officer records a question. The owning claimant records an answer, and the officer can resume review. The history preserves each question and answer across repeated cycles. |
| Decide and settle | The assigned officer can approve with an approved amount, or reject with a reason. Settlement is allowed once after approval. Claimants see the decision and any later settlement through the tracking API. |
| Report workload and exposure | Staff can see queue size, open claims by officer and status, and counts of approvals, rejections and settlements over a date range. Exposure groups open amounts by currency. |
| Verify behavior | Backend tests cover submission, visibility, valid and invalid transitions, concurrent pickup, validation errors, currency grouping and event retry when implemented. |

## Workflow rules

| Current status | Action and actor | Next status |
| --- | --- | --- |
| SUBMITTED | Pick up, officer | UNDER_REVIEW |
| UNDER_REVIEW | Request information, assigned officer | INFO_REQUIRED |
| INFO_REQUIRED | Supply information, owning claimant | INFO_RECEIVED |
| INFO_RECEIVED | Resume review, assigned officer | UNDER_REVIEW |
| UNDER_REVIEW | Approve or reject, assigned officer | APPROVED or REJECTED |
| APPROVED | Record settlement, assigned officer | SETTLED |

Rejection and settlement are terminal. A settlement records the full approved amount and has no payment integration. Use positive decimal amounts with currency-specific scale and require an approved amount at or below the requested amount as an MVP rule. Validate required inputs, bounded text lengths and incident dates. Approvals and rejections require a claimant-visible reason. Seed fictional identities and market codes for the demo.

Open exposure is a demo measure. Use the requested amount for submitted and in-review claims, including both information statuses. Use the approved amount for approved claims. Exclude rejected and settled claims. Totals are grouped by currency. Count decision and settlement actions from history by UTC time, so settling a claim does not erase its earlier approval.

## Build order

1. Review Phase 1 and confirm the remaining sprint time.
2. Scaffold Spring Boot and Maven Wrapper. Implement persistence, submission, pickup, workflow, history and errors.
3. Verify the backend with tests and add workload and exposure queries.
4. Add Kafka publishing with a durable retry path if the remaining time supports it.
5. Add one Angular app with claimant and staff views, starting with submission, tracking and queue review.
6. Verify local startup and core flows, complete the setup guide, and review the journal and incremental commits.

Trim Angular breadth first if time is short. Document any incomplete item with its verification status. Use fictional data and keep the application local. Record real candidate feedback and verification in the journal as work proceeds.
