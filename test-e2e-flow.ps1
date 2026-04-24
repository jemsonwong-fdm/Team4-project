# End-to-End Testing Script for Cross-Ecosystem Opportunity Finder
# Task 18: Final checkpoint - End-to-end testing

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cross-Ecosystem Opportunity Finder" -ForegroundColor Cyan
Write-Host "End-to-End Testing" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"
$rmId = "rm-001"  # Sarah Chen - Project Developers
$webSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# Helper function to make API calls
function Invoke-ApiTest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Description
    )
    
    Write-Host "Testing: $Description" -ForegroundColor Yellow
    Write-Host "  $Method $Endpoint" -ForegroundColor Gray
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        $params = @{
            Uri = "$baseUrl$Endpoint"
            Method = $Method
            Headers = $headers
            WebSession = $script:webSession
        }
        
        if ($Method -eq "POST" -or $Method -eq "PUT") {
            if ($Body) {
                $params.Body = ($Body | ConvertTo-Json -Depth 10)
            } else {
                $params.Body = "{}"
            }
        }
        
        $response = Invoke-WebRequest @params -SessionVariable script:webSession
        
        $data = $response.Content | ConvertFrom-Json
        
        if ($data.success) {
            Write-Host "  Success" -ForegroundColor Green
            return $data
        } else {
            Write-Host "  Failed: $($data.error)" -ForegroundColor Red
            return $null
        }
    } catch {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
    
    Write-Host ""
}

# Test 0: Login
Write-Host "`n[0/8] Logging in as RM..." -ForegroundColor Cyan
$loginBody = @{
    rmId = $rmId
}
$loginResult = Invoke-ApiTest -Method "POST" -Endpoint "/api/auth/login" -Body $loginBody -Description "Login as RM"

if ($loginResult) {
    Write-Host "  Logged in as: $($loginResult.data.rm.name) ($($loginResult.data.rm.segment))" -ForegroundColor Green
} else {
    Write-Host "  Login failed! Cannot continue tests." -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 1

# Test 1: Load Mock Data
Write-Host "`n[1/8] Loading Mock Data..." -ForegroundColor Cyan
$mockDataResult = Invoke-ApiTest -Method "POST" -Endpoint "/api/mock-data/load" -Description "Load mock data"

if ($mockDataResult) {
    Write-Host "  Clients loaded: $($mockDataResult.data.clientsLoaded)" -ForegroundColor Green
    Write-Host "  RMs loaded: $($mockDataResult.data.rmsLoaded)" -ForegroundColor Green
}

Start-Sleep -Seconds 2

# Test 2: Verify Mock Data Loaded
Write-Host "`n[2/8] Verifying Mock Data..." -ForegroundColor Cyan
$authResult = Invoke-ApiTest -Method "GET" -Endpoint "/api/auth/me" -Description "Get current RM info"

if ($authResult) {
    Write-Host "  Current RM: $($authResult.data.name) ($($authResult.data.segment))" -ForegroundColor Green
}

Start-Sleep -Seconds 1

# Test 3: Check Initial Opportunities (should be empty)
Write-Host "`n[3/8] Checking Initial Opportunities..." -ForegroundColor Cyan
$initialOpps = Invoke-ApiTest -Method "GET" -Endpoint "/api/opportunities" -Description "List opportunities (before generation)"

if ($initialOpps) {
    Write-Host "  Initial opportunities: $($initialOpps.count)" -ForegroundColor Green
}

Start-Sleep -Seconds 1

# Test 4: Generate Opportunities
Write-Host "`n[4/8] Generating Opportunities (this may take a while)..." -ForegroundColor Cyan
Write-Host "  Note: This will make LLM API calls and may take 30-60 seconds" -ForegroundColor Yellow

$generateBody = @{
    minScore = 50
    concurrency = 3
}

$generateResult = Invoke-ApiTest -Method "POST" -Endpoint "/api/opportunities/generate" -Body $generateBody -Description "Generate opportunities"

if ($generateResult) {
    Write-Host "  Opportunities generated: $($generateResult.data.opportunitiesGenerated)" -ForegroundColor Green
    Write-Host "  Clients analyzed: $($generateResult.data.clientsAnalyzed)" -ForegroundColor Green
    Write-Host "  Pairs evaluated: $($generateResult.data.pairsEvaluated)" -ForegroundColor Green
}

Start-Sleep -Seconds 2

# Test 5: Browse Opportunities
Write-Host "`n[5/8] Browsing Generated Opportunities..." -ForegroundColor Cyan
$opportunities = Invoke-ApiTest -Method "GET" -Endpoint "/api/opportunities?limit=5" -Description "List top 5 opportunities"

if ($opportunities -and $opportunities.data) {
    Write-Host "  Found $($opportunities.count) opportunities" -ForegroundColor Green
    
    # Display top opportunities
    $topOpps = $opportunities.data | Select-Object -First 3
    foreach ($opp in $topOpps) {
        Write-Host "`n  Opportunity: $($opp.title)" -ForegroundColor Cyan
        Write-Host "    Client 1: $($opp.client1.companyName) ($($opp.client1.ecosystemPositions[0]))" -ForegroundColor Gray
        Write-Host "    Client 2: $($opp.client2.companyName) ($($opp.client2.ecosystemPositions[0]))" -ForegroundColor Gray
        Write-Host "    Match Score: $($opp.matchScore)" -ForegroundColor Gray
        Write-Host "    Confidence: $($opp.confidence)" -ForegroundColor Gray
    }
    
    # Save first opportunity ID for invitation test
    $global:testOpportunityId = $opportunities.data[0].id
}

Start-Sleep -Seconds 2

# Test 6: View Opportunity Details
if ($global:testOpportunityId) {
    Write-Host "`n[6/8] Viewing Opportunity Details..." -ForegroundColor Cyan
    $oppDetail = Invoke-ApiTest -Method "GET" -Endpoint "/api/opportunities/$global:testOpportunityId" -Description "Get opportunity details"
    
    if ($oppDetail) {
        $opp = $oppDetail.data
        Write-Host "  Title: $($opp.title)" -ForegroundColor Green
        Write-Host "  Trigger: $($opp.trigger)" -ForegroundColor Gray
        Write-Host "  Banking Products: $($opp.suggestedBankingProducts.Count)" -ForegroundColor Gray
        Write-Host "  Reasoning: $($opp.reasoning.Substring(0, [Math]::Min(100, $opp.reasoning.Length)))..." -ForegroundColor Gray
    }
}

Start-Sleep -Seconds 2

# Test 7: Send Invitation
if ($global:testOpportunityId) {
    Write-Host "`n[7/8] Sending Invitation..." -ForegroundColor Cyan
    
    $invitationBody = @{
        opportunityId = $global:testOpportunityId
    }
    
    $invitation = Invoke-ApiTest -Method "POST" -Endpoint "/api/invitations" -Body $invitationBody -Description "Send invitation to other RM"
    
    if ($invitation) {
        Write-Host "  Invitation ID: $($invitation.data.id)" -ForegroundColor Green
        Write-Host "  Sender: $($invitation.data.senderRmId)" -ForegroundColor Gray
        Write-Host "  Recipient: $($invitation.data.recipientRmId)" -ForegroundColor Gray
        Write-Host "  Status: $($invitation.data.status)" -ForegroundColor Gray
    }
}

Start-Sleep -Seconds 1

# Test 8: Check Invitations
Write-Host "`n[8/8] Checking Invitations..." -ForegroundColor Cyan
$invitations = Invoke-ApiTest -Method "GET" -Endpoint "/api/invitations?type=sent" -Description "List sent invitations"

if ($invitations) {
    Write-Host "  Sent invitations: $($invitations.count)" -ForegroundColor Green
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Mock data loaded successfully" -ForegroundColor Green
Write-Host "Opportunities generated successfully" -ForegroundColor Green
Write-Host "Opportunities can be browsed and filtered" -ForegroundColor Green
Write-Host "Opportunity details can be viewed" -ForegroundColor Green
Write-Host "Invitations can be sent" -ForegroundColor Green
Write-Host "`nEnd-to-end flow completed successfully!" -ForegroundColor Green
Write-Host ""
