# ClaimFlow

ClaimFlow is a local insurance claims demo for motor and property incidents. The backend covers submission, tracking, officer pickup, information requests, decisions and settlement. Staff can also view team workload, claim outcomes and estimated outstanding exposure by currency.

## Run the backend locally

Install Java 21 and run these commands from the repository in PowerShell. The Maven Wrapper downloads build dependencies on its first run.

```powershell
cd backend
.\mvnw.cmd verify
.\mvnw.cmd spring-boot:run
```

The API listens on `http://127.0.0.1:8080`. The application writes data to `backend/data` when started as shown. Tests use an in-memory H2 database.

Open [claimflow.http](claimflow.http) in VS Code with the REST Client extension. Click **Send Request** in order within each scenario. The motor scenario covers information requests, approval and settlement. The property scenario covers rejection. The dashboard examples use data from both scenarios and add one outstanding claim. Each example lists its expected response. The motor and property submission requests supply claim IDs automatically.

You can also submit and pick up a claim from PowerShell.

```powershell
$body = @{
    type = 'MOTOR'
    market = 'MY'
    incidentDate = (Get-Date -Format 'yyyy-MM-dd')
    description = 'Demo incident'
    requestedAmount = '120.50'
    currency = 'MYR'
} | ConvertTo-Json
$claim = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8080/api/claims' `
    -Headers @{'X-Demo-User-Id' = 'claimant-1'} -ContentType 'application/json' -Body $body
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8080/api/claims/$($claim.id)/actions" `
    -Headers @{'X-Demo-User-Id' = 'officer-1'} -ContentType 'application/json' -Body '{"action":"PICK_UP"}'
```

Demo identities are `claimant-1`, `claimant-2`, `officer-1`, and `officer-2`. The header is caller-controlled and provides no authentication. Use fictional information.

The backend records claim events in a transactional outbox. Enable the `kafka` Spring profile to publish pending events and record local demo notifications. See [Kafka setup and manual verification](docs/KAFKA.md), [the API contract](docs/API.md) and [the architecture](docs/ARCHITECTURE.md).

## Run the Angular portal

Keep Spring Boot running on port 8080. Start Angular from the repository root in another PowerShell terminal.

```powershell
cd frontend
npm.cmd ci
npm.cmd start
```

Run `npm.cmd ci` for the first install or when dependencies change. Stop any running Angular dev server with **Ctrl+C** before reinstalling, since it can hold `esbuild.exe` open on Windows. For subsequent launches, use `npm.cmd start`.

Open `http://localhost:4200`. Use **Demo identity** to switch between claimant tracking and the officer worklist. Management shows a live summary preview. The development server forwards `/api/**` to Spring Boot.

See [frontend setup and scope](frontend/README.md) for tests and troubleshooting.
