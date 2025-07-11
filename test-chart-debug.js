const axios = require('axios');

async function testChartGeneration() {
  console.log('🔍 Testing Chart Generation...');
  
  try {
    // Test simple chart
    const testChart = {
      type: 'line',
      data: {
        labels: ['A', 'B', 'C', 'D'],
        datasets: [{
          label: 'Test Data',
          data: [10, 20, 30, 40],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Test Chart'
          }
        }
      }
    };

    console.log('📊 Sending chart to QuickChart...');
    
    const response = await axios.post('https://quickchart.io/chart', {
      chart: testChart,
      width: 400,
      height: 300,
      format: 'png'
    }, {
      timeout: 10000
    });

    console.log('✅ Chart generated successfully!');
    console.log('📋 Response:', response.data);
    
    if (response.data.url) {
      console.log('🔗 Chart URL:', response.data.url);
      
      // Test downloading the chart
      const downloadResponse = await axios.get(response.data.url, { 
        responseType: 'arraybuffer',
        timeout: 10000 
      });
      
      console.log('✅ Chart download successful!');
      console.log('📏 Chart size:', downloadResponse.data.length, 'bytes');
    }
    
  } catch (error) {
    console.error('❌ Chart generation failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
  }
}

testChartGeneration(); 