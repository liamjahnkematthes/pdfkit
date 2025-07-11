// N8N Code Node - Call Professional PDF Service
// IMPORTANT: This code goes in an N8N Code node, not HTTP Request node

// First, you need to set this environment variable in your N8N instance:
// NODE_FUNCTION_ALLOW_EXTERNAL=axios

// Get the form data from previous node
const formData = $input.all()[0].json.body;

// Use axios which is available in N8N after setting the environment variable
const axios = require('axios');

try {
  // Call your PDF service
  const response = await axios.post('http://localhost:3001/generate-retirement-pdf', formData, {
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 30000 // 30 second timeout
  });

  // Check if we got a successful response
  if (!response.data || !response.data.success) {
    throw new Error(`PDF generation failed: ${response.data?.error || 'Unknown error'}`);
  }

  // Return the PDF data in N8N's expected format
  return [{
    json: { 
      success: true,
      message: `Professional PDF generated for ${formData.name || 'client'}`
    },
    binary: {
      data: {
        data: response.data.pdf,
        mimeType: response.data.mimeType || 'application/pdf',
        fileName: response.data.fileName || `Retirement_Analysis_${formData.name || 'Client'}.pdf`
      }
    }
  }];

} catch (error) {
  // Handle any errors
  throw new Error(`Failed to generate PDF: ${error.message}`);
} 