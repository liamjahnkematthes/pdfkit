const axios = require('axios');
const fs = require('fs');

async function testChartGeneration() {
  console.log('🔍 Testing Chart Generation...');
  
  try {
    // Simple test chart
    const testChart = {
      type: 'bar',
      data: {
        labels: ['January', 'February', 'March', 'April'],
        datasets: [{
          label: 'Test Data',
          data: [10, 20, 30, 40],
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
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
      width: 600,
      height: 400,
      format: 'png'
    });

    console.log('📦 Full response:', response.data);
    const chartUrl = response.data.url || response.data;
    console.log('✅ Chart URL:', chartUrl);
    
    // Download the chart
    const chartResponse = await axios.get(chartUrl, { 
      responseType: 'arraybuffer' 
    });
    
    // Save to file
    fs.writeFileSync('test-chart.png', Buffer.from(chartResponse.data));
    console.log('💾 Chart saved to test-chart.png');
    
    return true;
  } catch (error) {
    console.error('❌ Chart generation failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Run the test
testChartGeneration(); 