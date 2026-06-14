# Shared helpers for fe-mycourse docker/ scripts (Windows PowerShell 5.1+ / 7+).
$ErrorActionPreference = 'Stop'

$script:RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$script:ValidEnvs = @('local', 'dev', 'staging', 'prod')

function Assert-EnvName {
    param([Parameter(Mandatory)][string]$Name)
    if ($script:ValidEnvs -notcontains $Name) {
        $list = $script:ValidEnvs -join ' '
        throw "docker: invalid environment '$Name'. Expected one of: $list"
    }
}

function Get-EnvFilePath {
    param([Parameter(Mandatory)][string]$Stage)
    Join-Path $script:RepoRoot ".env.$Stage"
}

function Assert-EnvFiles {
    param([Parameter(Mandatory)][string]$Stage)
    $path = Get-EnvFilePath -Stage $Stage
    if (-not (Test-Path -LiteralPath $path)) {
        throw "docker: missing $path — copy from .env.$Stage.example"
    }
}

function Get-FePortForEnv {
    param([Parameter(Mandatory)][string]$EnvName)
    switch ($EnvName) {
        'staging' { return 3001 }
        'prod' { return 3002 }
        default { return 3000 }
    }
}

function Get-ComposeFilePath {
    param([Parameter(Mandatory)][string]$EnvName)
    Join-Path $script:RepoRoot "docker\compose.$EnvName.yml"
}

function Get-StackFilePath {
    param([Parameter(Mandatory)][string]$EnvName)
    Join-Path $script:RepoRoot "docker\stack.$EnvName.yml"
}

function Get-ComposeProjectName {
    param([Parameter(Mandatory)][string]$EnvName)
    "mycourse-fe-$EnvName"
}

function Import-DotEnvFile {
    param([Parameter(Mandatory)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return }
    Get-Content -LiteralPath $Path | ForEach-Object {
        $line = $_ -replace '#.*$', ''
        $line = $line.Trim()
        if ([string]::IsNullOrWhiteSpace($line)) { return }
        if ($line -notmatch '=') { return }
        $eq = $line.IndexOf('=')
        $key = $line.Substring(0, $eq).Trim()
        $val = $line.Substring($eq + 1).Trim()
        Set-Item -Path "Env:$key" -Value $val
    }
}

function Import-ComposeEnv {
    param([Parameter(Mandatory)][string]$Stage)
    Import-DotEnvFile -Path (Join-Path $script:RepoRoot '.env')
    Import-DotEnvFile -Path (Get-EnvFilePath -Stage $Stage)
}

function Invoke-DockerCompose {
    param(
        [Parameter(Mandatory)][string]$EnvName,
        [Parameter(ValueFromRemainingArguments = $true)][string[]]$ComposeArgs
    )
    Import-ComposeEnv -Stage $EnvName
    $file = Get-ComposeFilePath -EnvName $EnvName
    $project = Get-ComposeProjectName -EnvName $EnvName
    & docker compose -f $file -p $project @ComposeArgs
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

function Test-HttpOk {
    param([Parameter(Mandatory)][string]$Url)
    if (Get-Command curl.exe -ErrorAction SilentlyContinue) {
        $code = (& curl.exe -sS -o NUL -w '%{http_code}' --connect-timeout 2 --max-time 5 $Url 2>$null)
        return ($code -in @('200', '307', '308'))
    }
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
        return ($response.StatusCode -in @(200, 307, 308))
    }
    catch {
        return $false
    }
}

function Wait-HttpEndpoint {
    param(
        [Parameter(Mandatory)][string]$Url,
        [int]$TimeoutSec = 90
    )
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    Write-Host "docker: polling $Url (timeout ${TimeoutSec}s)..."
    while ((Get-Date) -lt $deadline) {
        if (Test-HttpOk -Url $Url) {
            Write-Host 'docker: HTTP OK'
            return
        }
        Start-Sleep -Seconds 2
    }
    throw "docker: HTTP check failed ($Url)"
}
