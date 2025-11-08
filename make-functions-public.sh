#!/bin/bash

# Script to make Cloud Functions publicly accessible
# This fixes the 403 Forbidden errors

PROJECT_ID="servyard-de527"
REGION="us-central1"

echo "🔧 Making Cloud Functions publicly accessible..."
echo ""

# List of functions that need to be public
FUNCTIONS=(
  "sendTestNotification"
  "notifyNewBooking"
  "notifyBookingStatusChange"
  "dedupeServiceCategories"
)

for FUNCTION in "${FUNCTIONS[@]}"; do
  echo "📝 Processing: $FUNCTION"
  
  # Try to add IAM policy binding using gcloud (if installed)
  if command -v gcloud &> /dev/null; then
    gcloud functions add-iam-policy-binding $FUNCTION \
      --region=$REGION \
      --member=allUsers \
      --role=roles/cloudfunctions.invoker \
      --project=$PROJECT_ID \
      --quiet 2>&1 | grep -v "^WARNING" || true
  else
    echo "⚠️  gcloud not installed. Please install it or use Google Cloud Console."
    echo "   Install: brew install google-cloud-sdk"
    echo ""
    echo "📋 Or manually in Cloud Console:"
    echo "   https://console.cloud.google.com/functions/details/$REGION/$FUNCTION?project=$PROJECT_ID"
    echo "   1. Click 'PERMISSIONS' tab"
    echo "   2. Click 'ADD PRINCIPAL'"
    echo "   3. Enter: allUsers"
    echo "   4. Role: Cloud Functions Invoker"
    echo "   5. Save"
    echo ""
  fi
done

echo ""
echo "✅ Done! Now test with:"
echo "curl -X POST https://$REGION-$PROJECT_ID.cloudfunctions.net/sendTestNotification \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"userId\":\"test\"}'"
