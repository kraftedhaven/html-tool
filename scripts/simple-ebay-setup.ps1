Write-Host "eBay Credential Setup" -ForegroundColor Green

Write-Host "Choose environment:"
Write-Host "1 = Production"
Write-Host "2 = Sandbox"

$env = Read-Host "Enter 1 or 2"

if ($env -eq "1") {
    $environment = "production"
    Write-Host "Setting up Production"
} else {
    $environment = "sandbox"
    Write-Host "Setting up Sandbox"
}

$appId = Read-Host "App ID"
$devId = Read-Host "Dev ID"
$certId = Read-Host "Cert ID"
$token = Read-Host "User Token"

cmdkey /generic:"HiddenHavenThreads_EBAY_APP_ID" /user:"api" /pass:"$appId"
cmdkey /generic:"HiddenHavenThreads_EBAY_DEV_ID" /user:"api" /pass:"$devId"
cmdkey /generic:"HiddenHavenThreads_EBAY_CERT_ID" /user:"api" /pass:"$certId"
cmdkey /generic:"HiddenHavenThreads_EBAY_ACCESS_TOKEN" /user:"api" /pass:"$token"
cmdkey /generic:"HiddenHavenThreads_EBAY_ENVIRONMENT" /user:"api" /pass:"$environment"

Write-Host "Setup complete for $environment" -ForegroundColor Green