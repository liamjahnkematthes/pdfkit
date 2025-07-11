/**
 * Professional PDF Service for N8N - Enhanced Single Page Layout v2
 * Generates retirement analysis PDFs with lifecycle charts
 */

const express = require('express');
const PDFDocument = require('./lib/document');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3001;

app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  next();
});

/**
 * Generate Professional Retirement PDF - Enhanced Single Page
 */
app.post('/generate-retirement-pdf', async (req, res) => {
  try {
    const formData = req.body;
    
    // Process form data
    const data = {
      name: formData.name || 'Client',
      age: parseInt(formData.age) || 30,
      income: parseInt(formData.income) || 50000,
      savings: parseInt(formData.savings) || 100000,
      retireAge: parseInt(formData.retireAge) || 65,
      lifestyle: formData.lifestyle || 'comfortable',
      summary: formData.summary || ''
    };

    // Calculate projections
    const projections = calculateProjections(data);
    
    // Generate charts
    const charts = await generateCharts(projections, data);
    
    // Create PDF
    const pdfBuffer = await createPDF(data, projections, charts);
    
    // Return PDF as base64 for N8N
    res.json({
      success: true,
      pdf: pdfBuffer.toString('base64'),
      fileName: `Retirement_Analyzer_${data.name.replace(/\s+/g, '_')}.pdf`,
      mimeType: 'application/pdf'
    });

  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Calculate retirement projections
 */
function calculateProjections(data) {
  const { age, income, savings, retireAge } = data;
  const yearsToRetire = Math.max(retireAge - age, 0);
  const growthRate = 0.07; // 7% annual growth
  const withdrawalRate = 0.04; // 4% withdrawal rate
  const targetIncome = income * 0.8; // 80% replacement
  
  // Simple lifecycle phases
  const lifecycleData = [];
  const currentAge = age;
  
  // Accumulation phase (growing money)
  for (let i = 0; i <= yearsToRetire; i++) {
    const ageAtYear = currentAge + i;
    const annualContribution = income * 0.15; // 15% savings rate
    const futureValue = savings * Math.pow(1 + growthRate, i) + 
      annualContribution * ((Math.pow(1 + growthRate, i) - 1) / growthRate);
    
    lifecycleData.push({
      age: ageAtYear,
      phase: i < yearsToRetire - 5 ? 'accumulation' : 'planning',
      total: futureValue
    });
  }
  
  // Distribution phase (spending money)
  const totalAtRetirement = lifecycleData[lifecycleData.length - 1].total;
  const projectedIncome = totalAtRetirement * withdrawalRate;
  let remainingBalance = totalAtRetirement;
  
  for (let i = 1; i <= 30; i++) { // 30 years in retirement
    const ageAtYear = retireAge + i;
    remainingBalance = (remainingBalance - projectedIncome) * (1 + growthRate * 0.6); // Conservative growth
    remainingBalance = Math.max(0, remainingBalance);
    
    lifecycleData.push({
      age: ageAtYear,
      phase: i > 25 ? 'wealth_transfer' : 'distribution',
      total: remainingBalance
    });
  }
  
  return {
    yearsToRetire,
    targetIncome,
    projectedIncome,
    totalAtRetirement,
    lifecycleData,
    status: totalAtRetirement > targetIncome * 25 ? 'on_track' : 'needs_attention'
  };
}

/**
 * Generate charts using QuickChart
 */
async function generateCharts(projections, data) {
  try {
    // Prepare lifecycle chart data
    const ages = projections.lifecycleData.map(d => d.age);
    const values = projections.lifecycleData.map(d => d.total);
    const phases = projections.lifecycleData.map(d => d.phase);
    
    // Create phase-colored background
    const backgroundColors = phases.map(phase => {
      switch(phase) {
        case 'accumulation': return 'rgba(52, 168, 83, 0.1)';
        case 'planning': return 'rgba(255, 193, 7, 0.1)';
        case 'distribution': return 'rgba(66, 133, 244, 0.1)';
        case 'wealth_transfer': return 'rgba(156, 39, 176, 0.1)';
        default: return 'rgba(128, 128, 128, 0.1)';
      }
    });
    
    // Lifecycle Portfolio Chart
    const lifecycleChart = {
      type: 'line',
      data: {
        labels: ages,
        datasets: [{
          label: 'Portfolio Value',
          data: values,
          borderColor: 'rgb(66, 133, 244)',
          backgroundColor: 'rgba(66, 133, 244, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Retirement Lifecycle Portfolio',
            font: { size: 16, weight: 'bold' }
          },
          legend: { display: false }
        },
        scales: {
          x: {
            title: { display: true, text: 'Age' }
          },
          y: {
            title: { display: true, text: 'Portfolio Value ($)' },
            ticks: {
              callback: function(value) {
                return '$' + (value/1000000).toFixed(1) + 'M';
              }
            }
          }
        }
      }
    };
    
    // Current vs Target Bar Chart
    const comparisonChart = {
      type: 'bar',
      data: {
        labels: ['Current Savings', 'Target at Retirement', 'Projected Income'],
        datasets: [{
          data: [data.savings, projections.totalAtRetirement, projections.projectedIncome * 25],
          backgroundColor: [
            'rgba(255, 193, 7, 0.8)',
            'rgba(52, 168, 83, 0.8)',
            'rgba(66, 133, 244, 0.8)'
          ],
          borderColor: [
            'rgb(255, 193, 7)',
            'rgb(52, 168, 83)',
            'rgb(66, 133, 244)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Retirement Readiness Comparison',
            font: { size: 16, weight: 'bold' }
          },
          legend: { display: false }
        },
        scales: {
          y: {
            title: { display: true, text: 'Value ($)' },
            ticks: {
              callback: function(value) {
                if (value >= 1000000) return '$' + (value/1000000).toFixed(1) + 'M';
                if (value >= 1000) return '$' + (value/1000).toFixed(0) + 'K';
                return '$' + value.toLocaleString();
              }
            }
          }
        }
      }
    };
    
    // Sophisticated 3-Layer Retirement Graph
    const initialValue = projections.totalAtRetirement || data.savings;
    
    // Calculate 3-account allocation across lifecycle phases
    const lifecyclePhases = ['Accumulation', 'Retirement Planning', 'Distribution', 'Wealth Transfer'];
    
    // Account allocation strategy that changes by phase
    const accountData = lifecyclePhases.map((phase, index) => {
      let preTaxPct, rothPct, brokeragePct;
      
      switch(phase) {
        case 'Accumulation':
          preTaxPct = 50; rothPct = 30; brokeragePct = 20; // Building phase
          break;
        case 'Retirement Planning':
          preTaxPct = 60; rothPct = 25; brokeragePct = 15; // Optimization phase
          break;
        case 'Distribution':
          preTaxPct = 45; rothPct = 35; brokeragePct = 20; // Withdrawal phase
          break;
        case 'Wealth Transfer':
          preTaxPct = 30; rothPct = 50; brokeragePct = 20; // Legacy phase
          break;
        default:
          preTaxPct = 50; rothPct = 30; brokeragePct = 20;
      }
      
      return {
        preTax: preTaxPct,
        roth: preTaxPct + rothPct, // Stacked values
        brokerage: preTaxPct + rothPct + brokeragePct // Total stack
      };
    });
    
    const retirementGraph = {
      type: 'line',
      data: {
        labels: lifecyclePhases,
        datasets: [
          {
            label: 'Pre-Tax',
            data: accountData.map(d => d.preTax),
            backgroundColor: '#7EF1F6',
            borderColor: '#7EF1F6',
            borderWidth: 2,
            fill: 'origin',
            tension: 0.4,
            pointRadius: 0
          },
          {
            label: 'Roth',
            data: accountData.map(d => d.roth),
            backgroundColor: '#4ECDC4',
            borderColor: '#4ECDC4',
            borderWidth: 2,
            fill: '-1',
            tension: 0.4,
            pointRadius: 0
          },
          {
            label: 'Brokerage',
            data: accountData.map(d => d.brokerage),
            backgroundColor: '#2C5282',
            borderColor: '#2C5282',
            borderWidth: 2,
            fill: '-1',
            tension: 0.4,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Retirement Graph',
            font: { 
              size: 20, 
              weight: 'bold',
              family: 'Arial'
            },
            color: '#001f54',
            padding: 20
          },
          legend: {
            display: true,
            position: 'top',
            align: 'center',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              font: { size: 12 },
              padding: 15,
              generateLabels: function(chart) {
                return [
                  { text: 'Pre-Tax', fillStyle: '#7EF1F6', strokeStyle: '#7EF1F6' },
                  { text: 'Roth', fillStyle: '#4ECDC4', strokeStyle: '#4ECDC4' },
                  { text: 'Brokerage', fillStyle: '#2C5282', strokeStyle: '#2C5282' }
                ];
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Financial Lifetime Stages',
              font: { weight: 'bold', size: 12 }
            },
            grid: {
              display: false
            }
          },
          y: {
            min: 0,
            max: 100,
            title: {
              display: true,
              text: 'Relative Dollar Value',
              font: { weight: 'bold', size: 12 }
            },
            ticks: {
              stepSize: 20,
              callback: function(value) {
                return value;
              }
            },
            grid: {
              color: 'rgba(0,0,0,0.1)',
              lineWidth: 1
            }
          }
        },
        elements: {
          line: {
            tension: 0.4
          },
          point: {
            radius: 0
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    };

    // Generate chart URLs using GET method with encoded chart config
    const lifecycleUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(lifecycleChart))}&w=600&h=300&f=png`;
    const comparisonUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(comparisonChart))}&w=600&h=300&f=png`;
    const retirementGraphUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(retirementGraph))}&w=700&h=400&f=png`;
    
    console.log('✅ All charts generated successfully!');
    console.log('📊 Chart URLs:', {
      lifecycle: lifecycleUrl,
      comparison: comparisonUrl,
      retirementGraph: retirementGraphUrl
    });
    
    return {
      lifecycle: lifecycleUrl,
      comparison: comparisonUrl,
      retirementGraph: retirementGraphUrl
    };
    
  } catch (error) {
    console.error('Chart generation error:', error);
    return { lifecycle: null, comparison: null };
  }
}

/**
 * Create enhanced PDF document
 */
async function createPDF(data, projections, charts) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 40,
        info: {
          Title: `Retirement Analysis - ${data.name}`,
          Author: 'E.H. Howard & Associates',
          Subject: 'Professional Retirement Planning Analysis'
        }
      });
      
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      await renderPDF(doc, data, projections, charts);
      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Render PDF content with professional styling
 */
async function renderPDF(doc, data, projections, charts) {
  const pageWidth = doc.page.width - 80; // Account for margins
  
  // Professional Header with company branding
  doc.fontSize(26)
     .fillColor('#1a365d')
     .text('E.H. HOWARD & ASSOCIATES', 40, 40, { align: 'center' });
  
  doc.fontSize(14)
     .fillColor('#4a5568')
     .text('Professional Retirement Analysis Report', 40, 75, { align: 'center' });
  
  // Add subtle line under header
  doc.moveTo(40, 95).lineTo(pageWidth + 40, 95).strokeColor('#e2e8f0').lineWidth(2).stroke();
  
  // Client info section with professional styling
  doc.fontSize(20)
     .fillColor('#2d3748')
     .text(`Retirement Analysis for ${data.name}`, 40, 115);
  
  // Status badge with better styling
  const statusColor = projections.status === 'on_track' ? '#38a169' : '#e53e3e';
  const statusText = projections.status === 'on_track' ? 'ON TRACK ✓' : 'NEEDS ATTENTION ⚠';
  const statusBgColor = projections.status === 'on_track' ? '#f0fff4' : '#fef5e7';
  
  // Status badge background
  doc.roundedRect(40, 145, 150, 25, 5).fillColor(statusBgColor).fill();
  doc.roundedRect(40, 145, 150, 25, 5).strokeColor(statusColor).lineWidth(2).stroke();
  
  doc.fontSize(12)
     .fillColor(statusColor)
     .text(`STATUS: ${statusText}`, 50, 154);
  
  // Summary metrics in organized table format
  let yPos = 190;
  doc.fontSize(16).fillColor('#1a365d').text('Client Summary', 40, yPos);
  yPos += 25;
  
  // Create a neat table layout
  const tableData = [
    ['Current Age:', data.age.toString()],
    ['Target Retirement Age:', data.retireAge.toString()],
    ['Current Annual Income:', `$${data.income.toLocaleString()}`],
    ['Current Savings:', `$${data.savings.toLocaleString()}`],
    ['Years to Retirement:', projections.yearsToRetire.toString()],
    ['Target Retirement Income:', `$${Math.round(projections.targetIncome).toLocaleString()}`]
  ];
  
  doc.fontSize(12).fillColor('#2d3748');
  tableData.forEach((row, index) => {
    const rowY = yPos + (index * 20);
    // Alternating row colors
    if (index % 2 === 0) {
      doc.rect(40, rowY - 2, pageWidth, 18).fillColor('#f7fafc').fill();
    }
    doc.text(row[0], 50, rowY, { width: 200 });
    doc.text(row[1], 300, rowY, { width: 200 });
  });
  
  yPos += tableData.length * 20 + 30;
  
  // Key projections section with emphasis
  doc.fontSize(16)
     .fillColor('#1a365d')
     .text('Retirement Projections', 40, yPos);
  yPos += 30;
  
  // Highlight boxes for key metrics
  const metrics = [
    { label: 'Portfolio at Retirement', value: `$${Math.round(projections.totalAtRetirement).toLocaleString()}`, color: '#38a169' },
    { label: 'Annual Retirement Income', value: `$${Math.round(projections.projectedIncome).toLocaleString()}`, color: '#3182ce' }
  ];
  
  metrics.forEach((metric, index) => {
    const boxX = 40 + (index * (pageWidth / 2 + 10));
    const boxWidth = pageWidth / 2 - 20;
    
    // Metric box with border
    doc.roundedRect(boxX, yPos, boxWidth, 50, 8).fillColor('#f7fafc').fill();
    doc.roundedRect(boxX, yPos, boxWidth, 50, 8).strokeColor(metric.color).lineWidth(2).stroke();
    
    doc.fontSize(10).fillColor('#4a5568').text(metric.label, boxX + 10, yPos + 10);
    doc.fontSize(16).fillColor(metric.color).text(metric.value, boxX + 10, yPos + 25);
  });
  
  yPos += 70;
  
  // Add charts with proper spacing and titles
  console.log('📊 Charts available:', { 
    lifecycle: !!charts.lifecycle, 
    comparison: !!charts.comparison,
    retirementGraph: !!charts.retirementGraph 
  });
  
  if (charts.lifecycle) {
    try {
      console.log('📈 Adding lifecycle chart:', charts.lifecycle);
      doc.fontSize(14).fillColor('#1a365d').text('Portfolio Growth Over Time', 40, yPos);
      yPos += 20;
      
      const lifecycleResponse = await axios.get(charts.lifecycle, { responseType: 'arraybuffer' });
      const lifecycleBuffer = Buffer.from(lifecycleResponse.data);
      console.log('✅ Lifecycle chart loaded, size:', lifecycleBuffer.length);
      doc.image(lifecycleBuffer, 40, yPos, { width: pageWidth * 0.95 });
      yPos += 220;
    } catch (error) {
      console.error('❌ Could not load lifecycle chart:', error.message);
      yPos += 20;
    }
  }
  
  if (charts.comparison) {
    try {
      doc.fontSize(14).fillColor('#1a365d').text('Retirement Readiness Analysis', 40, yPos);
      yPos += 20;
      
      const comparisonResponse = await axios.get(charts.comparison, { responseType: 'arraybuffer' });
      const comparisonBuffer = Buffer.from(comparisonResponse.data);
      doc.image(comparisonBuffer, 40, yPos, { width: pageWidth * 0.95 });
      yPos += 220;
    } catch (error) {
      console.log('Could not load comparison chart');
      yPos += 20;
    }
  }
  
  // Add the sophisticated 3-layer retirement graph
  if (charts.retirementGraph) {
    try {
      doc.fontSize(14).fillColor('#1a365d').text('Three-Account Retirement Strategy', 40, yPos);
      yPos += 20;
      
      const retirementGraphResponse = await axios.get(charts.retirementGraph, { responseType: 'arraybuffer' });
      const retirementGraphBuffer = Buffer.from(retirementGraphResponse.data);
      doc.image(retirementGraphBuffer, 40, yPos, { width: pageWidth * 0.95 });
      yPos += 250;
    } catch (error) {
      console.log('Could not load retirement graph');
      yPos += 20;
    }
  }
  
  // Professional advice section
  doc.fontSize(14).fillColor('#1a365d').text('Professional Recommendations', 40, yPos);
  yPos += 25;
  
  const recommendations = [
    '• Maintain a diversified portfolio across multiple account types',
    '• Consider maximizing contributions to tax-advantaged accounts',
    '• Review and adjust your retirement plan annually',
    '• Plan for healthcare costs in retirement',
    '• Consider working with a financial advisor for personalized guidance'
  ];
  
  doc.fontSize(11).fillColor('#2d3748');
  recommendations.forEach(rec => {
    doc.text(rec, 50, yPos, { width: pageWidth - 20 });
    yPos += 18;
  });
  
  yPos += 20;
  
  // Call-to-action section
  doc.fontSize(16).fillColor('#1a365d').text('Next Steps', 40, yPos);
  yPos += 25;
  
  // Professional contact buttons/links
  const buttonWidth = 160;
  const buttonHeight = 35;
  const buttonSpacing = 20;
  
  // Schedule consultation button
  doc.roundedRect(40, yPos, buttonWidth, buttonHeight, 8).fillColor('#3182ce').fill();
  doc.fontSize(12).fillColor('#ffffff').text('Schedule Consultation', 50, yPos + 12);
  doc.link(40, yPos, buttonWidth, buttonHeight, 'https://ehhowardwealth.com/consultation');
  
  // Website link button
  doc.roundedRect(40 + buttonWidth + buttonSpacing, yPos, buttonWidth, buttonHeight, 8).fillColor('#38a169').fill();
  doc.fontSize(12).fillColor('#ffffff').text('Visit Our Website', 50 + buttonWidth + buttonSpacing, yPos + 12);
  doc.link(40 + buttonWidth + buttonSpacing, yPos, buttonWidth, buttonHeight, 'https://ehhowardwealth.com');
  
  // Educational webinar button  
  doc.roundedRect(40 + (buttonWidth + buttonSpacing) * 2, yPos, buttonWidth, buttonHeight, 8).fillColor('#805ad5').fill();
  doc.fontSize(12).fillColor('#ffffff').text('Retirement Webinar', 50 + (buttonWidth + buttonSpacing) * 2, yPos + 12);
  doc.link(40 + (buttonWidth + buttonSpacing) * 2, yPos, buttonWidth, buttonHeight, 'https://ehhowardwealth.com/webinar');
  
  // Professional footer
  doc.fontSize(10)
     .fillColor('#718096')
     .text('E.H. Howard & Associates | Professional Financial Planning Services', 
           40, doc.page.height - 80, { align: 'center' });
  
  doc.fontSize(9)
     .fillColor('#a0aec0')
     .text('This analysis is for planning purposes only. Past performance does not guarantee future results. Consult a financial advisor for personalized advice.', 
           40, doc.page.height - 60, { align: 'center', width: pageWidth });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server - Listen on all interfaces for N8N compatibility
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ PDF Service running on http://0.0.0.0:${PORT}`);
  console.log(`✅ Also accessible via http://localhost:${PORT}`);
  console.log(`✅ Also accessible via http://127.0.0.1:${PORT}`);
  console.log(`📊 Ready to generate retirement analysis PDFs`);
}); 