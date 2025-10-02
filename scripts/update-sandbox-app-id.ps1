Write-Host "Update eBay Sandbox App ID" -ForegroundColor Green

Write-Host "Current stored credentials will be updated with new Sandbox App ID"
Write-Host ""

$newAppId = Read-Host "Enter your new eBay Sandbox App ID"

if ($newAppId) {
    # Update the App ID
    cmdkey /generic:"HiddenHavenThreads_EBAY_APP_ID" /user:"api" /pass:"$newAppId"
    
    # Set environment to sandbox
    cmdkey /generic:"HiddenHavenThreads_EBAY_ENVIRONMENT" /user:"api" /pass:"sandbox"
    
    Write-Host ""
    Write-Host "Updated successfully!" -ForegroundColor Green
    Write-Host "App ID: $newAppId" -ForegroundColor Cyan
    Write-Host "Environment: sandbox" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "Test the connection:" -ForegroundColor Yellow
    Write-Host ".\scripts\test-ebay-connection.ps1" -ForegroundColor Gray
} else {
    Write-Host "No App ID provided" -ForegroundColor Red
}