# N8N PDF Service Setup Guide

## Prerequisites

1. **PDF Service Running**: Make sure your PDF service is running on `http://localhost:3001`
   ```bash
   node pdf-service.js
   ```

2. **N8N Environment Variable**: You MUST set this environment variable in your N8N instance:
   ```
   NODE_FUNCTION_ALLOW_EXTERNAL=axios
   ```
   
   - For N8N Desktop: Add this to your environment settings
   - For Docker: Add `-e NODE_FUNCTION_ALLOW_EXTERNAL=axios` to your docker run command
   - For PM2: Add it to your ecosystem file

## N8N Workflow Setup

### Step 1: Create Your Workflow

1. Open N8N and create a new workflow
2. Add your trigger node (e.g., Webhook, Form Trigger, etc.)

### Step 2: Add Code Node

1. Add a **Code** node (NOT HTTP Request node)
2. Set the language to **JavaScript**
3. Copy the entire contents of `simple-n8n-pdf-node.js` into the code editor

### Step 3: Configure Email Node

1. Add a **Gmail** node (or your preferred email service)
2. Set the operation to **Send**
3. Configure:
   - **To**: `{{ $json.email }}` (or wherever the recipient email is stored)
   - **Subject**: `Your Retirement Analysis Report`
   - **Message**: Your email body text
   - **Attachments**: Toggle ON
   - **Attachments Field Name**: `data` (this matches the binary output from the Code node)

### Step 4: Connect the Nodes

```
[Trigger/Form] → [Code Node] → [Gmail]
```

## Expected Form Data Structure

The Code node expects the previous node to provide data in this format:

```json
{
  "body": {
    "name": "John Smith",
    "age": 45,
    "income": 85000,
    "savings": 250000,
    "retireAge": 65,
    "lifestyle": "comfortable",
    "email": "john.smith@email.com"
  }
}
```

## Troubleshooting

### Error: "Cannot find module 'axios'"
- Make sure you've set the `NODE_FUNCTION_ALLOW_EXTERNAL=axios` environment variable
- Restart N8N after setting the variable

### Error: "Connection refused"
- Ensure your PDF service is running on port 3001
- Check if localhost is accessible from your N8N instance

### Error: "PDF generation failed"
- Check the PDF service console for error messages
- Verify the form data structure matches what the service expects

### N8N Cloud Users
If you're using N8N Cloud, you won't be able to access localhost. You'll need to:
1. Deploy your PDF service to a public URL (e.g., using Render, Railway, or Heroku)
2. Update the URL in the Code node from `http://localhost:3001` to your public URL

## Testing

1. Execute the workflow manually with test data
2. Check that:
   - The PDF service receives the request
   - The Code node returns successfully
   - The email is sent with the PDF attachment

## Alternative: Using HTTP Request Node

If you can't set environment variables, use an HTTP Request node instead:

1. Add **HTTP Request** node
2. Configure:
   - **Method**: POST
   - **URL**: `http://localhost:3001/generate-retirement-pdf`
   - **Body Content Type**: JSON
   - **Body**: Use expression `{{ $json.body }}`
   - **Options** → **Response Format**: File
   - **Options** → **Binary Property**: data

Then connect it to your email node the same way. 