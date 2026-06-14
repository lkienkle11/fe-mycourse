param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$EnvName
)
. "$PSScriptRoot\_lib.ps1"
Assert-EnvName -Name $EnvName
$port = Get-FePortForEnv -EnvName $EnvName
Wait-HttpEndpoint -Url "http://127.0.0.1:$port/" -TimeoutSec 90
