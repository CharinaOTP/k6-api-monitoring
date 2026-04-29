$timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
$folder = $PSScriptRoot
$reportFolder = Join-Path $folder "reports"

if (!(Test-Path $reportFolder)) {
    New-Item -ItemType Directory -Path $reportFolder | Out-Null
}

$reportFile = Join-Path $reportFolder "api-report-$timestamp.csv"

$header = "DateTime,API Name,Method,URL,Status Code,Response Time(ms),Result,Speed Status,Error"
$rows = @($header)

$output = & k6 run --quiet --log-format raw "$folder\bulkapi.js" 2>&1

foreach ($line in $output) {
    if ($line -like "*CSVROW:*") {
        $cleanLine = $line -replace '^.*CSVROW:', ''
        $rows += $cleanLine
    }
}

$rows | Set-Content -Path $reportFile -Encoding UTF8

Write-Host "Clean CSV created:"
Write-Host $reportFile

Invoke-Item $reportFile