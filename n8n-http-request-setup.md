# N8N Cloud Setup Guide - HTTP Request Method

## Why Use HTTP Request Node?
N8N Cloud may not allow custom environment variables or external modules in Code nodes. The HTTP Request node is a built-in node that works in all N8N environments.

## Setup Steps

### Step 1: Make Sure Your PDF Service is Running
```bash
node pdf-service.js
```
You should see: `✅ PDF Service running on http://localhost:3001`

### Step 2: Create N8N Workflow

1. **Add your trigger** (Webhook, Form, etc.)
2. **Add HTTP Request node** (not Code node)
3. **Configure the HTTP Request node:**

#### HTTP Request Node Configuration:
- **Method**: POST
- **URL**: `http://localhost:3001/generate-retirement-pdf`
- **Headers**: 
  - `Content-Type`: `application/json`
- **Body**: 
  - **Body Type**: JSON
  - **JSON Body**: `{{ $json.body }}` (or your form data)

### Step 3: Add Code Node (Data Processing)
- **Add Code node** after the HTTP Request
- **Purpose**: Convert base64 PDF data to binary format for Gmail
- **Code**:
```javascript
// Convert base64 PDF to binary data for Gmail attachment
const pdfData = $input.all()[0].json.pdf;
const fileName = $input.all()[0].json.fileName;
const mimeType = $input.all()[0].json.mimeType;

// Convert base64 to binary
const binaryData = Buffer.from(pdfData, 'base64');

return [{
  json: {
    success: true,
    message: "PDF ready for email"
  },
  binary: {
    data: {
      data: binaryData,
      mimeType: mimeType,
      fileName: fileName
    }
  }
}];
```

### Step 4: Add Gmail Node
- **Add Gmail node** after the Code node
- **Configure attachment:**
  - **Attachment Property**: `data`
  - **File Name**: Will be automatically set from binary data
  - **Mime Type**: Will be automatically set from binary data

## Complete Workflow Structure:
```
Form Trigger → HTTP Request → Code Node → Gmail → Response
```

## Testing
1. Submit a form with these fields:
   - `name`: Client name
   - `age`: Current age
   - `income`: Annual income
   - `savings`: Current savings
   - `retireAge`: Target retirement age
   - `lifestyle`: "comfortable" or "luxurious"

2. The PDF will be generated and emailed automatically

## Troubleshooting
- **Connection Error**: Make sure PDF service is running on localhost:3001
- **Missing Data**: Check that form fields match expected names
- **Email Issues**: Verify Gmail node authentication and recipient

## Current PDF Features
Your PDF includes:
- ✅ Professional E.H. Howard branding
- ✅ 3 sophisticated charts (lifecycle, comparison, 3-account strategy)
- ✅ Client summary table
- ✅ Projected retirement calculations
- ✅ Professional styling and layout 