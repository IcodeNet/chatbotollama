# Configuration
$DOCS_DIR = "docs"
$MODEL_NAME = "flagstone-assistant"
$BASE_MODEL = "mistral"

# URLs to fetch
$URLS = @(
    "https://www.flagstoneim.com/personal/how-it-works",
    "https://www.flagstoneim.com/personal/help",
    "https://www.flagstoneim.com/business/help",
    "https://www.flagstoneim.com/about-us",
    "https://www.flagstoneim.com/personal/learn/savings-essentials/why-you-should-open-multiple-savings-accounts"
)

# Function to check if model exists
function Test-ModelExists {
    param($modelName)
    $models = ollama list
    return $models -match $modelName
}

# Create docs directory if it doesn't exist
New-Item -ItemType Directory -Force -Path $DOCS_DIR | Out-Null

# Function to sanitize filenames
function Get-SanitizedFilename {
    param($filename)
    return $filename -replace '[^a-zA-Z0-9]', '-' -replace '^-+|-+$', '' -replace '-+', '-'
}

# Function to fetch and save content
function Get-WebContent {
    param($url, $filename)
    Write-Host "Fetching: $url"
    try {
        Invoke-WebRequest -Uri $url -OutFile $filename
        Write-Host "✓ Saved to: $filename" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "✗ Failed to fetch: $url" -ForegroundColor Red
        return $false
    }
}

# Clear existing docs
Write-Host "Cleaning docs directory..."
Remove-Item "$DOCS_DIR\*.md" -Force -ErrorAction SilentlyContinue

# Fetch all URLs
Write-Host "Fetching documentation..."
foreach ($url in $URLS) {
    $filename = Join-Path $DOCS_DIR ((Get-SanitizedFilename ($url -split '/')[-1]) + ".md")
    Get-WebContent $url $filename
}

# Combine all documentation
Write-Host "Preparing training data..."
$COMBINED_FILE = Join-Path $DOCS_DIR "combined.md"
Get-Content "$DOCS_DIR\*.md" | Set-Content $COMBINED_FILE
Write-Host "✓ Combined documentation saved to: $COMBINED_FILE" -ForegroundColor Green

# Check if model exists
Write-Host "Checking for existing model..."
if (Test-ModelExists $MODEL_NAME) {
    Write-Host "Model exists, removing old version..." -ForegroundColor Yellow
    ollama rm $MODEL_NAME
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to remove old model" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Old model removed successfully" -ForegroundColor Green
}

# Create the model
Write-Host "Creating Ollama model..."
try {
    # Create a temporary Modelfile
    $tempModelfile = Join-Path $DOCS_DIR "temp_modelfile"

    @"
FROM mistral

# System prompt defining the assistant's role and knowledge base
SYSTEM """
You are an AI assistant that ONLY provides information about Flagstone's cash deposit platform based on the following documentation.
If you're not sure about something or if the information isn't in the provided documentation, say so.
DO NOT make assumptions or provide information from outside these documents.

# Core Documentation
$(Get-Content $COMBINED_FILE -Raw)
"""

# Model parameters for consistent responses
PARAMETER temperature 0.7
PARAMETER top_k 50
PARAMETER top_p 0.95

# Response template
TEMPLATE """
{{- if .First }}
I am a Flagstone platform specialist. I will only provide information from Flagstone's official documentation.
{{- end }}

USER: {{ .Prompt }}
ASSISTANT: Let me help you with information from Flagstone's documentation.
"""
"@ | Set-Content $tempModelfile

    # Create model using the temporary file
    ollama create $MODEL_NAME -f $tempModelfile --force

    # Clean up
    Remove-Item $tempModelfile -Force

    # Test the model
    Write-Host "Testing model..."
    $testResponse = ollama run $MODEL_NAME "What services does Flagstone offer?"
    Write-Host "✓ Model created and tested successfully!" -ForegroundColor Green
    Write-Host "Sample response:"
    Write-Host $testResponse

    # Test the introduction question specifically
    Write-Host "`nTesting introduction question..."
    ollama run $MODEL_NAME "What do you know about Flagstone?" --verbose
} catch {
    Write-Host "✗ Model creation or test failed. Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

Write-Host "Creating Model Done!" -ForegroundColor Green
