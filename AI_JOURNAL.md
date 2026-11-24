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
