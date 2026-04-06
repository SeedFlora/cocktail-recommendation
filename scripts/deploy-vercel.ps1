param(
  [switch]$Preview
)

if (-not $env:VERCEL_TOKEN) {
  throw "Set environment variable VERCEL_TOKEN terlebih dahulu."
}

$scope = if ($env:VERCEL_SCOPE) {
  $env:VERCEL_SCOPE
} else {
  "rascend-1119s-projects"
}

$vercelArgs = @("vercel", "deploy", "--yes", "--token", $env:VERCEL_TOKEN, "--scope", $scope)

if (-not $Preview) {
  $vercelArgs += "--prod"
}

if ($env:VERCEL_PROJECT_NAME) {
  $vercelArgs += @("--project", $env:VERCEL_PROJECT_NAME)
}

$dockerArgs = @(
  "run",
  "--rm",
  "-v",
  "${PWD}:/app",
  "-w",
  "/app",
  "node:22-alpine",
  "npx"
) + $vercelArgs

& docker @dockerArgs
