param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$EnvName
)
. "$PSScriptRoot\_lib.ps1"
Assert-EnvName -Name $EnvName
Assert-EnvFiles -Stage $EnvName
$info = docker info 2>$null
if ($info -notmatch 'Swarm: active') {
    throw "swarm-deploy: Swarm is not active. Run 'docker swarm init' first."
}
$stackName = "mycourse-fe-$EnvName"
$stackFile = Get-StackFilePath -EnvName $EnvName
Write-Host "swarm-deploy: deploying stack $stackName..."
& docker stack deploy -c $stackFile $stackName
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "swarm-deploy: done."
