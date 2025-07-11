/**
 * Test script for PDF service
 */

const axios = require('axios');
const fs = require('fs');

async function testPDFService() {
  console.log('🧪 Testing PDF Service...\n');

  // Test data (like what N8N would send)
  const testData = {
    name: 'John Smith',
    age: 45,
    income: 75000,
    savings: 150000,
    retireAge: 65,
    lifestyle: 'comfortable',
    summary: 'John is on a good path but could benefit from increasing his monthly contributions to reach his retirement goals more comfortably.'
  };

  try {
    console.log('📊 Generating PDF with test data...');
    console.log(`Client: ${testData.name}, Age: ${testData.age}, Income: $${testData.income.toLocaleString()}`);
    
    const response = await axios.post('http://localhost:3001/generate-retirement-pdf', testData);
    
    if (response.data.success) {
      console.log('✅ PDF generated successfully!');
      console.log(`📄 File: ${response.data.fileName}`);
      
      // Save PDF to file for testing
      const pdfBuffer = Buffer.from(response.data.pdf, 'base64');
      const outputFile = `test_${response.data.fileName}`;
      fs.writeFileSync(outputFile, pdfBuffer);
      
      console.log(`💾 Saved test PDF to: ${outputFile}`);
      console.log(`📊 PDF size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
      
    } else {
      console.error('❌ PDF generation failed:', response.data.error);
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Connection refused - Is the PDF service running?');
      console.log('💡 Start it with: node pdf-service.js');
    } else {
      console.error('❌ Test failed:', error.message);
    }
  }
}

// Health check first
async function healthCheck() {
  try {
    const response = await axios.get('http://localhost:3001/health');
    console.log('💚 Health check:', response.data);
    return true;
  } catch (error) {
    console.log('💔 Service not responding - starting service first...');
    return false;
  }
}

// Run tests
async function runTests() {
  const isHealthy = await healthCheck();
  
  if (isHealthy) {
    await testPDFService();
  } else {
    console.log('⚠️ PDF service is not running. Please start it first:');
    console.log('   node pdf-service.js');
  }
}

runTests(); 