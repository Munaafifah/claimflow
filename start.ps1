[CmdletBinding()]
param(
    [ValidateRange(1024, 65535)][int]$BackendPort = 8080,
    [ValidateRange(1024, 65535)][int]$FrontendPort = 4200,
    [ValidateRange(1024, 65535)][int]$KafkaPort = 9092
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$runtime = Join-Path $root '.claimflow-run'
$stateFile = Join-Path $runtime 'services.json'
$backend = Join-Path $root 'backend'
$frontend = Join-Path $root 'frontend'
$composeFile = Join-Path $root 'docker-compose.yml'
$demoHeaders = @{ 'X-Demo-User-Id' = 'claimant-1' }

function Invoke-Checked([scriptblock]$Command) {
    & $Command
    if ($LASTEXITCODE -ne 0) { throw "Command failed (exit $LASTEXITCODE): $Command" }
}

function Test-Port([int]$Port) {
    $client = [Net.Sockets.TcpClient]::new()
    try { $client.Connect('127.0.0.1', $Port); return $true }
    catch [Net.Sockets.SocketException] { return $false }
    finally { $client.Dispose() }
}

function Wait-Service($Process, [string]$Url, [string]$Name) {
    $deadline = (Get-Date).AddSeconds(90)
    while ((Get-Date) -lt $deadline -and !$Process.HasExited) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -Headers $demoHeaders -TimeoutSec 2
            if ($response.StatusCode -eq 200 -and $response.Headers['Content-Type'] -like 'application/json*') { return }
        } catch {
            # Startup can briefly refuse connections.
        }
        Start-Sleep -Seconds 1
    }
    throw "$Name did not start. Check $runtime for logs."
}

function Save-State {
    $state | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $stateFile -Encoding UTF8
}

function Start-ServiceProcess([string]$Name, [string]$Executable, [string[]]$Arguments, [string]$Directory) {
    $options = @{
        FilePath = $Executable; ArgumentList = $Arguments; WorkingDirectory = $Directory
        WindowStyle = 'Hidden'; PassThru = $true
        RedirectStandardOutput = Join-Path $runtime "$Name.log"
        RedirectStandardError = Join-Path $runtime "$Name-error.log"
    }
    $process = Start-Process @options
    $state[$Name] = @{ id = $process.Id; started = $process.StartTime.ToUniversalTime().Ticks.ToString() }
    Save-State
    return $process
}

if (@($BackendPort, $FrontendPort, $KafkaPort | Select-Object -Unique).Count -ne 3 -or $KafkaPort -eq 9093) {
    throw 'Use three distinct ports. Kafka port 9093 is reserved for its controller.'
}
foreach ($command in 'java.exe', 'node.exe', 'npm.cmd', 'docker.exe') { Get-Command $command | Out-Null }
New-Item -ItemType Directory -Force -Path $runtime | Out-Null
$lock = [IO.File]::Open((Join-Path $runtime 'services.lock'), 'OpenOrCreate', 'ReadWrite', 'None')
$ownsRun = $false
$oldKafkaPort = $env:CLAIMFLOW_KAFKA_PORT
try {
    if (Test-Path -LiteralPath $stateFile) { throw 'A launcher state file exists. Run stop.ps1 first.' }
    foreach ($port in $BackendPort, $FrontendPort) {
        if (Test-Port $port) { throw "Port $port is occupied. Stop its application yourself or choose a different port." }
    }
    $env:CLAIMFLOW_KAFKA_PORT = "$KafkaPort"
    $runningKafka = @(& docker.exe compose --file $composeFile ps --status running --quiet kafka)
    if ($LASTEXITCODE -ne 0) { throw 'Docker Compose could not reach Docker. Start Docker Desktop and try again.' }
    if ($runningKafka.Count) {
        $publishedPort = & docker.exe compose --file $composeFile port kafka $KafkaPort
        if ($LASTEXITCODE -ne 0 -or $publishedPort -ne "127.0.0.1:$KafkaPort") {
            throw 'The existing Kafka service is using a different port. Use its port or stop it manually first.'
        }
    } elseif (Test-Port $KafkaPort) {
        throw "Kafka port $KafkaPort is occupied by another service."
    }

    $state = @{ backend = $null; frontend = $null; kafkaId = $null }
    $ownsRun = $true
    Save-State
    Push-Location $frontend
    try { Invoke-Checked { npm.cmd ci } } finally { Pop-Location }
    Push-Location $backend
    try { Invoke-Checked { .\mvnw.cmd -B -ntp package -DskipTests } } finally { Pop-Location }

    if (!$runningKafka.Count) {
        Invoke-Checked { docker.exe compose --file $composeFile up -d kafka }
        $state.kafkaId = & docker.exe compose --file $composeFile ps --all --quiet kafka
        if ($LASTEXITCODE -ne 0 -or !$state.kafkaId) { throw 'Could not identify the Kafka container.' }
        Save-State
    }

    $api = "http://127.0.0.1:$BackendPort"
    $ui = "http://127.0.0.1:$FrontendPort"
    $server = Start-ServiceProcess backend java.exe @(
        '-jar', 'target/claimflow-0.1.0-SNAPSHOT.jar', '--spring.profiles.active=kafka',
        "--server.port=$BackendPort", "--spring.kafka.bootstrap-servers=localhost:$KafkaPort"
    ) $backend
    Wait-Service $server "$api/api/claims" 'Spring Boot'

    $proxyFile = Join-Path $runtime 'proxy.json'
    @{ '/api/**' = @{ target = $api } } | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath $proxyFile -Encoding Ascii
    $web = Start-ServiceProcess frontend node.exe @(
        'node_modules/@angular/cli/bin/ng.js', 'serve', '--host', '127.0.0.1',
        '--port', "$FrontendPort", '--proxy-config', ('"' + $proxyFile + '"')
    ) $frontend
    Wait-Service $web "$ui/api/claims" 'Angular and its API proxy'
    Write-Host "ClaimFlow: $ui | API: $api | Kafka: localhost:$KafkaPort"
    Write-Host "Logs: $runtime"
} catch {
    $lock.Dispose()
    if ($ownsRun) {
        try { & (Join-Path $root 'stop.ps1') }
        catch { Write-Warning "Cleanup could not finish. Run stop.ps1 again: $_" }
    }
    throw
} finally {
    $env:CLAIMFLOW_KAFKA_PORT = $oldKafkaPort
    $lock.Dispose()
}
