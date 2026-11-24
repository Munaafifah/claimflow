[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$runtime = Join-Path $PSScriptRoot '.claimflow-run'
$stateFile = Join-Path $runtime 'services.json'
if (!(Test-Path -LiteralPath $runtime)) { Write-Host 'No services started by this launcher.'; return }
$lock = [IO.File]::Open((Join-Path $runtime 'services.lock'), 'OpenOrCreate', 'ReadWrite', 'None')
try {
    if (!(Test-Path -LiteralPath $stateFile)) { Write-Host 'No services started by this launcher.'; return }
    $state = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
    foreach ($name in 'frontend', 'backend') {
        $entry = $state.$name
        if (!$entry) { continue }
        $process = Get-Process -Id $entry.id -ErrorAction SilentlyContinue
        if ($process -and $process.StartTime.ToUniversalTime().Ticks.ToString() -eq $entry.started) {
            & taskkill.exe /PID $process.Id /T /F
            if ($LASTEXITCODE -ne 0 -and !$process.HasExited) { throw "Could not stop $name." }
        }
    }
    if ($state.kafkaId) {
        $composeFile = Join-Path $PSScriptRoot 'docker-compose.yml'
        $ids = @(& docker.exe compose --file $composeFile ps --status running --quiet kafka)
        if ($LASTEXITCODE -ne 0) { throw 'Could not check Kafka. Start Docker and rerun stop.ps1.' }
        if ($ids -contains $state.kafkaId) {
            & docker.exe stop $state.kafkaId
            if ($LASTEXITCODE -ne 0) { throw 'Could not stop the Kafka container.' }
        }
    }
    Remove-Item -LiteralPath $stateFile
    Write-Host 'Launcher services stopped. Local claims, Kafka data and logs were preserved.'
} finally {
    $lock.Dispose()
}
