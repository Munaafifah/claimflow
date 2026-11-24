# ClaimFlow

ClaimFlow is a local insurance claims demo for motor and property incidents. The current backend milestone covers submission, tracking, officer pickup, information requests, decisions and settlement.

## Run the backend locally

Install Java 21 and run these commands from the repository in PowerShell. The Maven Wrapper downloads build dependencies on its first run.

```powershell
cd backend
.\mvnw.cmd verify
.\mvnw.cmd spring-boot:run
```

The API listens on `http://127.0.0.1:8080`. The application writes data to `backend/data` when started as shown. Tests use an in-memory H2 database.

Open [claimflow.http](claimflow.http) in VS Code with the REST Client extension. Click **Send Request** in order within each scenario. The motor scenario covers information requests, approval and settlement. The property scenario covers rejection. Each example lists its expected response, and the two submit requests supply claim IDs automatically.

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

Workload and exposure reporting, Kafka, and Angular are planned milestones. See [the API contract](docs/API.md) and [the architecture proposal](docs/ARCHITECTURE.md).
