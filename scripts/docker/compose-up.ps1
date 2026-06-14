param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$EnvName
)
. "$PSScriptRoot\_lib.ps1"
Assert-EnvName -Name $EnvName
Assert-EnvFiles -Stage $EnvName
Write-Host "docker: building and starting mycourse-fe-$EnvName..."
Invoke-DockerCompose -EnvName $EnvName -ComposeArgs @('up', '--build', '-d')
$port = Get-FePortForEnv -EnvName $EnvName
Write-Host "docker: stack started. curl http://127.0.0.1:$port/ or run: $PSScriptRoot\health-check.ps1 $EnvName"
