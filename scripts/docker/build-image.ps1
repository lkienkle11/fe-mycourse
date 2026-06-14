param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$EnvName
)
. "$PSScriptRoot\_lib.ps1"
Assert-EnvName -Name $EnvName
Assert-EnvFiles -Stage $EnvName
Import-ComposeEnv -Stage $EnvName
$apiUrl = if ($env:NEXT_PUBLIC_API_URL) { $env:NEXT_PUBLIC_API_URL } else { 'http://localhost:8080' }
$sse = if ($env:NEXT_PUBLIC_STREAM_SSE_URL) { $env:NEXT_PUBLIC_STREAM_SSE_URL } else { '' }
$ws = if ($env:NEXT_PUBLIC_STREAM_WS_URL) { $env:NEXT_PUBLIC_STREAM_WS_URL } else { '' }
$grpc = if ($env:NEXT_PUBLIC_STREAM_GRPC_BASE_URL) { $env:NEXT_PUBLIC_STREAM_GRPC_BASE_URL } else { '' }
$imageTag = "mycourse-fe:$EnvName"
Write-Host "docker: building image $imageTag..."
& docker build `
    --build-arg "NEXT_PUBLIC_API_URL=$apiUrl" `
    --build-arg "NEXT_PUBLIC_STREAM_SSE_URL=$sse" `
    --build-arg "NEXT_PUBLIC_STREAM_WS_URL=$ws" `
    --build-arg "NEXT_PUBLIC_STREAM_GRPC_BASE_URL=$grpc" `
    -t $imageTag `
    -f (Join-Path $script:RepoRoot 'Dockerfile') `
    $script:RepoRoot
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "docker: built $imageTag"
