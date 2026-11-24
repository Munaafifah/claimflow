# AI working journal

## 24 November 2026, 15:39 MYT · Requirements and design

- **Actual request** — “please really understand the take home assesmnet, they are the descrition of the task, the planning and also the folder structure, do step by step”
- **AI proposal** — Read all four PDFs, inspect the repository, then write a backend-first Phase 1 proposal for review. Keep the planned Java/Spring Boot stack and make workflow permissions, concurrency, exposure and event delivery explicit.
- **AI review** — The proposed lifecycle needs ownership rules and a resubmission loop. Financial reporting needs a defined amount and currency grouping. Direct Kafka publication after a database commit creates a delivery gap if the broker is down.
- **Candidate decisions** — Acceptance, challenges and overrides are pending. The design records AI recommendations for review.
- **Verification and outcome** — Extracted and read all four PDFs. PowerShell showed an empty workspace apart from `.git`. Git reported an unborn `main` branch and a permission warning for the global ignore file. Application tests are pending implementation.

## 24 November 2026, 15:44 MYT · Backend claim workflow

- **Actual request** — “okay lets strat with the backend first right”
- **Candidate direction** — The candidate asked to start with the backend. No specific implementation choice, challenge or override was stated.
- **AI implementation choices** — Used fixed demo identities and an ordered history collection to keep this first slice small. Added optimistic locking so competing officer pickups cannot both succeed. Retained the proposed status transitions.
- **Verification and outcome** — Maven initially could not create its default repository under the sandbox. The build succeeded after using the existing Maven cache with permission. The wrapper's `verify` target passed three integration tests and built an executable JAR. A local HTTP smoke test used file-backed H2 and confirmed submission, pickup and two history entries.

## 24 November 2026, 15:50 MYT · Manual API examples

- **Actual request** — “create one http files so that i can test the endpoint for each, also provide me samples to actually test the system”
- **AI implementation choices** — Used one REST Client file with a motor claim that reaches settlement, a property claim that is rejected, and examples of rejected requests. Named submission requests supply IDs so the examples can be repeated with fresh claims.
- **Candidate decisions** — The candidate requested one file with runnable samples. No additional challenges or overrides were stated.
- **Verification and outcome** — Sent all 22 requests from the file to the packaged application on a temporary local port with in-memory H2. All expected HTTP status codes matched. Also checked the workflow states, list results, approved amount and final history lengths.

## 24 November 2026, 15:56 MYT · Business rules review

- **Actual request** — “just to double check care to check all the request if it performs the right business logic”
- **AI approach** — Compared the examples with the workflow rules and replayed the file against a separate instance with in-memory H2. Checked persisted claim details before and after each expected failure.
- **Verification and outcome** — All 22 examples matched their expected status codes. Verified ownership, officer filters and assignment, the decision amounts and reasons, and the ordered history entries. All five rejected requests left the affected claim unchanged. The screenshot showed an approved claim in the summary response, where history is empty by design.

## 24 November 2026, 16:07 MYT · Dashboard design review

- **Candidate proposal** — Finish the backend before Kafka and Angular. Report claim totals, officer workload and performance, average resolution time if supported, outstanding claims by market, type and status, and liability exposure. Use requested amounts before approval and approved amounts pending settlement. Exclude terminal claims, group by currency, and use `BigDecimal`. Put reporting in dedicated dashboard classes.
- **AI recommendation** — Keep the proposed exposure rules and identify the result as a demo estimate. Count performance from dated history actions, attribute actions to their recorded actor, and measure resolution from submission to settlement or rejection. Return an all-time snapshot with optional UTC bounds for performance only. Aggregate in a dedicated read-only service using one repository query that fetches claims and history together for the local demo.
- **Verification and decision status** — Inspected the claim entity, history mapping, repository and existing requirements and API proposal. The current model contains the needed amounts, classifications, ownership and timestamps. No schema changes are proposed. Design approval, implementation and reporting tests are pending.

## 24 November 2026 · Dashboard implementation

- **Candidate decision** — Approved the dashboard design and asked to proceed. No overrides were stated.
- **AI implementation choices** — Added the dedicated dashboard controller, service and response contracts. Shared the fixed actor IDs with the claim service so both endpoints apply the same demo roles. Used one read-only fetch query and preserved the existing database schema and lifecycle.
- **Verification and outcome** — All seven integration tests passed. Maven initially failed to repackage the workspace JAR because Windows reported it was in use. A fresh temporary build passed `verify` and produced an executable JAR. Replayed all 27 HTTP examples against that JAR over localhost with in-memory H2. The dashboard totals, currency exposure, date filter and expected error responses matched.

## 24 November 2026, 16:20 MYT · Dashboard recheck and Kafka design

- **Candidate proposal** — Recheck the reporting rules and rerun the tests. Keep synchronous operations on REST and the modular monolith. Use Docker Compose for Kafka and consider lifecycle events for asynchronous claimant notifications. Review the design before implementation.
- **AI recommendation** — Use one topic keyed by claim ID and publish the seven proposed milestones, with the notification consumer selecting claimant-relevant types. Use a small transactional outbox with a single publisher, per-claim sequence and stable event IDs. Treat delivery as at least once and deduplicate at the consumer.
- **Trade-off discussed** — An after-commit send avoids publishing rolled-back changes but can lose events during broker or application failure. An outbox adds a table, retry logic and cleanup. Assignment and information-received events are optional if the only consumer is claimant-facing.
- **Verification and outcome** — Reviewed the reporting implementation and reran Maven tests in a temporary copy. All seven passed, including four dashboard tests. Kafka implementation and design approval are pending.

## 24 November 2026, 16:33 MYT · Kafka implementation

- **Candidate decision** — Approved the modular monolith, one topic keyed by claim ID, all seven lifecycle events, a transactional outbox, a payload without sensitive claimant information, and stable event IDs for deduplication. The candidate initially considered publishing after a successful update, then chose durable retries to handle broker outages. Requested a simple implementation and manual review before committing or pushing.
- **AI implementation choices** — Used a single scheduled publisher behind the opt-in Kafka profile. The history position provides the per-claim sequence, so resume review leaves a gap. The local consumer records the five claimant-facing event types and uses the event ID as the notification table's primary key.
- **Verification** — Maven `verify` passed all ten tests in an isolated build. The three Kafka-related tests cover rollback and invalid transitions, ordered retry with a stable event ID, and a single database record after duplicate delivery.
- **Broker check** — Replayed all 27 HTTP examples with the Kafka profile, in-memory H2 and a separate Docker Compose project. The console consumer received ten expected records across all seven types. With Kafka stopped, submission and assignment still succeeded. Restarting Kafka published both pending events in order. Replaying the submission with the same event ID logged a duplicate and produced no second notification.

## 24 November 2026, 16:47 MYT · Angular design review

- **Candidate proposal** — Build one local Angular 21 app with claimant, officer and management views, a Soft Blue and Lavender theme and independent ClaimFlow branding. Use standalone components, Reactive Forms, Signals where useful, SCSS, existing demo identities, actual Spring Boot data and a development proxy. Present the plan before implementation.
- **AI recommendation** — Reuse one layout and timeline, treat management as a staff view, and use the dashboard response directly. Derive action visibility from identity, assignment and claim status, then reload on conflicts. Use a 30-second dashboard refresh with manual refresh and a local proxy bound to the existing backend address.
- **Verification and decision status** — Inspected controllers, DTOs, workflow rules, API documentation and HTTP examples. The core UI needs no backend changes. The API has no notification inbox, separate manager role or payment integration. These limits shape the proposed views. Implementation and approval are pending.

## 24 November 2026 · Angular Phase 1

- **Candidate decisions** — Approved one Angular workspace, a shared officer worklist, existing demo identities, route guards, an API interceptor and a development proxy. Confirmed the Soft Blue and Lavender theme and asked for lightweight dashboard visuals after data integration. Requested Phase 1 only and a browser review before committing.
- **AI implementation choices** — Used one reusable read-only preview component to check the claimant, officer and management routes without starting the full feature pages. Used a tab-local identity selection so two browser sessions can switch independently. Added shared layout, status badges, statistic cards and loading, empty and retry states. Management uses the backend's returned summary values.
- **Verification and outcome** — npm 11.3.0 initially failed to resolve the scaffold dependencies. A one-off npm 11.6.2 invocation generated the lockfile, and a clean install using the original npm version then passed. The Angular production build and all four tests passed after running the compiler with access to Windows parent directories. A headless Chrome run verified claimant route protection, switching to an officer, the live claim and dashboard requests with the selected identity header, four management summary cards and a 390 px layout without page overflow. No backend source changes were needed.
- **Local review follow-up** — The candidate reported a Windows file lock during `npm ci` while an Angular preview was still running. Ended the workspace preview processes, restored dependencies from the lockfile, and verified the production build. Updated the setup instructions to stop Angular before reinstalling dependencies.

## 24 November 2026, 17:15 MYT · Claimant portal

- **Candidate decisions** — Approved the frontend foundation after reviewing it in the browser and requested a separate foundation commit. Asked to keep the existing visual design and build only the claimant overview, submission, filtering, detail, history, information replies and outcomes.
- **AI implementation choices** — Reused the shell and backend API clients. Defined the overview counts as mutually exclusive categories apart from the total. Kept amounts as decimal strings, used the six demo market currencies, and loaded claim details and history under the current demo identity. Left the claimant portal changes open for review.
- **Verification** — Rebuilt the foundation, passed its four tests, and compared the live proxy and direct API responses for both demo claimants and one officer before committing it as `49f59bc`. The claimant browser test used a separate backend with in-memory H2. Its first run revealed a reply form submit binding issue. After correction, Chrome verified both claim types, invalid forms, information replies, approval, settlement, rejection, filters, identity isolation and a 390 px layout.
- **Final test result** — The production Angular build and all eight frontend tests passed after the reply form correction.

## 24 November 2026, 17:27 MYT · Claims officer portal

- **Candidate decisions** — Confirmed Claim #34 was submitted and displayed correctly. Approved the claimant milestone for a separate commit. Asked to build the officer workflow next, keep the shared visual design and leave Claim #34 available for a manual walkthrough between Claimant 1 and Officer 1.
- **AI implementation choices** — Used one worklist with incoming and assigned views, and a review page that gates actions by workflow status and assignment. Reused the history timeline and extracted the incident details and form styles for both portals. Used exact decimal comparison for approval amounts and reloaded stale claim details after conflicts.
- **Verification and outcome** — The claimant build and all eight tests passed before commit `856ebe9`. The officer build and all eleven tests passed. An isolated Chrome check exercised the complete question, reply and settlement flow, a separate rejection, another officer's access restrictions, a stale pickup conflict and the responsive layout. Confirmed the original Claim #34 still showed `SUBMITTED` with no officer assigned. Management remains a preview.
- **Candidate manual review** — Reported successful motor and property testing through both portals. Claim #34 was approved and settled for MYR 500. Claim #35 was rejected and its claimant saw the reason. On Claim #6, Officer 1 requested more information and Claimant 2 sent a reply. Property Claim #36 was approved and settled for MYR 3,000. The candidate approved the design and functionality and asked to prepare the officer milestone for commit.
