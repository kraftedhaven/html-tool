Write-Host "Switch eBay Environment" -ForegroundColor Green
Write-Host ""

Write-Host "Choose environment:" -ForegroundColor Cyan
Write-Host "1 = Production" -ForegroundColor Yellow
Write-Host "2 = Sandbox" -ForegroundColor Yellow

$choice = Read-Host "Enter 1 or 2"

if ($choice -eq "1") {
    Write-Host "Switching to Production..." -ForegroundColor Cyan
    
    # Get stored production credentials
    $prodList = cmdkey /list | findstr "PROD_EBAY"
    if ($prodList) {
        Write-Host "You'll need to re-enter production credentials:" -ForegroundColor Yellow
        
        $appId = Read-Host "Production App ID"
        $devId = Read-Host "Production Dev ID"
        $certId = Read-Host "Production Cert ID"
        $token = Read-Host "Production Token"
        
        cmdkey /generic:"HiddenHavenThreads_EBAY_APP_ID" /user:"api" /pass:"$appId"
        cmdkey /generic:"HiddenHavenThreads_EBAY_DEV_ID" /user:"api" /pass:"$devId"
        cmdkey /generic:"HiddenHavenThreads_EBAY_CERT_ID" /user:"api" /pass:"$certId"
        cmdkey /generic:"HiddenHavenThreads_EBAY_ACCESS_TOKEN" /user:"api" /pass:"$token"
        cmdkey /generic:"HiddenHavenThreads_EBAY_ENVIRONMENT" /user:"api" /pass:"production"
        
        Write-Host "Switched to PRODUCTION" -ForegroundColor Green
    }
    else {
        Write-Host "No production credentials found. Run setup first." -ForegroundColor Red
    }
}
elseif ($choice -eq "2") {
    Write-Host "Switching to Sandbox..." -ForegroundColor Yellow
    
    # Get stored sandbox credentials  
    $sandboxList = cmdkey /list | findstr "SANDBOX_EBAY"
    if ($sandboxList) {
        Write-Host "You'll need to re-enter sandbox credentials:" -ForegroundColor Yellow
        
        $appId = Read-Host "Sandbox App ID"
        $devId = Read-Host "Sandbox Dev ID"
        $certId = Read-Host "Sandbox Cert ID"
        $token = Read-Host "Sandbox Token"
        
        cmdkey /generic:"HiddenHavenThreads_EBAY_APP_ID" /user:"api" /pass:"$appId"
        cmdkey /generic:"HiddenHavenThreads_EBAY_DEV_ID" /user:"api" /pass:"$devId"
        cmdkey /generic:"HiddenHavenThreads_EBAY_CERT_ID" /user:"api" /pass:"$certId"
        cmdkey /generic:"HiddenHavenThreads_EBAY_ACCESS_TOKEN" /user:"api" /pass:"$token"
        cmdkey /generic:"HiddenHavenThreads_EBAY_ENVIRONMENT" /user:"api" /pass:"sandbox"
        
        Write-Host "Switched to SANDBOX" -ForegroundColor Green
    }
    else {
        Write-Host "No sandbox credentials found. Run setup first." -ForegroundColor Red
    }
}
else {
    Write-Host "Invalid choice" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test connection: .\scripts\test-ebay-simple.ps1" -ForegroundColor Gray