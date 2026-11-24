# ClaimFlow

ClaimFlow is a local insurance claims demo. Claimants submit motor and property incidents, track their claims and answer requests for information. Officers pick up and assess claims, record decisions, and view team workload, outcomes and estimated liability.

## Technology stack

- **Frontend** — Angular 21, TypeScript and SCSS
- **Backend** — Java 21, Spring Boot 3.5, Spring Data JPA and file-backed H2
- **Communication** — REST over HTTP, Apache Kafka and Docker Compose
- **Build and testing** — Maven Wrapper, npm, JUnit and Vitest

## Prerequisites

- Git, a Java 21 JDK, and Node.js 24 with npm 11. Put their commands on your PATH.
- Docker with the Compose plugin. Start Docker Desktop or the Docker engine for the Kafka demo.
- Internet access on the first run to download Maven, npm dependencies and the Kafka image.
- Local ports 4200 for Angular, 8080 for Spring Boot, and 9092 for Kafka. Maven and Angular CLI are supplied by the wrapper and project dependencies.

Clone the [ClaimFlow repository](https://github.com/Munaafifah/claimflow).

```sh
git clone https://github.com/Munaafifah/claimflow.git ClaimFlow
cd ClaimFlow
```

Run commands from the checkout root unless a command changes directory.

## Windows quick start

```powershell
.\start.ps1
```

The launcher installs frontend dependencies from the lockfile, packages the backend, starts Kafka and checks the Angular API proxy. It prints the URLs and keeps logs in `.claimflow-run/`. If PowerShell blocks local scripts, run `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\start.ps1` for this invocation.

```powershell
.\stop.ps1
```

Stop uses recorded process IDs and start times. It stops only the Kafka container the launcher started. Claims in `backend/data/` and the Docker volume are preserved. If local scripts are blocked, use `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\stop.ps1`. To avoid a port conflict in a separate checkout, use `.\start.ps1 -BackendPort 18084 -FrontendPort 4214 -KafkaPort 19094` and use the printed URLs. For Kafka console commands, use the selected Kafka port.

## Manual startup

Use three terminals. In the first, start Kafka from the checkout root.

```sh
docker compose up -d kafka
```

In the second terminal, start Spring Boot. In the third, start Angular.

| Terminal | Windows PowerShell | macOS or Linux |
| --- | --- | --- |
| Backend | `cd backend` then `.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=kafka"` | `cd backend` then `./mvnw spring-boot:run -Dspring-boot.run.profiles=kafka` |
| Frontend | `cd frontend` then `npm.cmd ci` and `npm.cmd start -- --host 127.0.0.1` | `cd frontend` then `npm ci` and `npm start -- --host 127.0.0.1` |

Wait for both servers to start. Use **Ctrl+C** in the Angular and Spring Boot terminals to stop them. From the root, run `docker compose stop kafka` to stop the broker while keeping its data. Stop Angular before reinstalling dependencies, since Windows can lock `esbuild.exe`.

For a REST-only demo, skip Docker and omit the Kafka profile when starting Spring Boot. The app still queues lifecycle events for later publication.

## Open the app

| Address | Use |
| --- | --- |
| [http://127.0.0.1:4200](http://127.0.0.1:4200) | Angular application |
| `http://127.0.0.1:8080/api` | Spring Boot API. Use a resource path such as `/api/claims` and send the demo actor header. |
| `localhost:9092` | Kafka broker for local verification |

Use the app's **Demo identity** selector. `claimant-1` and `claimant-2` can see their own claims. `officer-1` and `officer-2` can use the worklist and Management dashboard. HTTP examples pass the same IDs in `X-Demo-User-Id`. New databases start with an empty claims list.

## Review and verify

- [Demonstration guide](docs/DEMO.md) walks through the claimant, officer, management and Kafka flows.
- [Architecture](docs/ARCHITECTURE.md) explains the system boundaries and trade-offs.
- [API contract](docs/API.md), [HTTP examples](claimflow.http), and [Kafka guide](docs/KAFKA.md) show how to verify each interface.
- [AI working journal](AI_JOURNAL.md) records the decisions, manual reviews and verification results.

Run `./mvnw verify` from `backend` on macOS/Linux or `.\mvnw.cmd verify` in Windows PowerShell. From `frontend`, run `npm test -- --watch=false` and `npm run build` (use `npm.cmd` in Windows PowerShell). Automated backend tests use in-memory H2 and can run with Kafka stopped.

## Known limitations

The caller-controlled demo identity provides no real authentication. Use fictional data. The system records settlement decisions and local notification records, with no payment transfer, email, SMS or notification inbox. Information requests and replies are text only. The dashboard is designed for a small local dataset. The included Kafka setup uses a single broker, and Angular uses a local development proxy. Production load, security and cross-browser compatibility are outside the verified scope. The submission audit reported moderate advisories in the frontend development toolchain. The runtime-only npm audit reported zero advisories.
