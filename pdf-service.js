/**
 * Professional PDF Service for N8N - Enhanced Single Page Layout v2
 * Generates retirement analysis PDFs with lifecycle charts
 */

const express = require('express');
const PDFDocument = require('pdfkit');
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
    
    // Return PDF as base64 for N8N with cache-busting headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json({
      success: true,
      pdf: pdfBuffer.toString('base64'),
      fileName: `Retirement_Analyzer_${data.name.replace(/\s+/g, '_')}.pdf`,
      mimeType: 'application/pdf',
      timestamp: new Date().toISOString() // Add timestamp for debugging
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
    
    // 3-Layer Retirement Graph with Pre-tax, Roth, Brokerage
    const lifeStages = ['Accumulation', 'Retirement Planning', 'Distribution', 'Wealth Transfer'];
    const totalByStage = [
      projections.totalAtRetirement * 0.3,  // Accumulation
      projections.totalAtRetirement * 0.8,  // Retirement Planning  
      projections.totalAtRetirement * 1.0,  // Distribution
      projections.totalAtRetirement * 0.6   // Wealth Transfer
    ];
    
    // Dynamic scaling based on user's financial situation
    const maxPortfolioValue = Math.max(projections.totalAtRetirement, data.savings * 10);
    const scaleFactor = maxPortfolioValue / 100;
    
    // All accounts start from zero and grow proportionally
    const preTaxData = [0, 30 * scaleFactor, 60 * scaleFactor, 45 * scaleFactor];
    const rothData = [0, 20 * scaleFactor, 40 * scaleFactor, 30 * scaleFactor];  
    const brokerageData = [0, 10 * scaleFactor, 20 * scaleFactor, 15 * scaleFactor];
    
    const lifecycleChart = {
      type: 'line',
      data: {
        labels: lifeStages,
        datasets: [
          {
            label: 'Pre-Tax',
            data: preTaxData,
            backgroundColor: 'rgba(0, 191, 165, 0.6)',  // Teal (Pre-tax color from example)
            borderColor: 'rgba(0, 191, 165, 1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Roth', 
            data: rothData,
            backgroundColor: 'rgba(66, 133, 244, 0.6)',  // Blue (Roth color from example)
            borderColor: 'rgba(66, 133, 244, 1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Brokerage',
            data: brokerageData,
            backgroundColor: 'rgba(156, 39, 176, 0.6)',  // Purple (Brokerage color from example)
            borderColor: 'rgba(156, 39, 176, 1)', 
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: false
            },
            grid: {
              display: false
            },
            ticks: {
              display: false  // Remove numbers from x-axis
            }
          },
          y: {
            display: true,
            stacked: true,
            title: {
              display: false
            },
            ticks: {
              callback: function(value) {
                return '$' + (value/1000000).toFixed(1) + 'M';
              }
            }
          }
        },
        elements: {
          point: {
            radius: 0
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
    
    // Dynamic account values based on user's actual financial scale - Enhanced responsiveness
    const userIncome = parseInt(data.income) || 50000;
    const userSavings = parseInt(data.savings) || 100000;
    
    // More responsive scaling based on income brackets
    let scalingMultiplier;
    if (userIncome <= 50000) {
      scalingMultiplier = 1.5; // Conservative scaling for lower income
    } else if (userIncome <= 100000) {
      scalingMultiplier = 3.0; // Moderate scaling for middle income  
    } else if (userIncome <= 200000) {
      scalingMultiplier = 5.0; // Higher scaling for upper-middle income
    } else {
      scalingMultiplier = 8.0; // Aggressive scaling for high income
    }
    
    // Enhanced calculation for high net worth users
    const basePortfolio = Math.max(userSavings, userIncome * 3); // Base it more on income
    const peakPortfolio = Math.max(projections.totalAtRetirement, basePortfolio * scalingMultiplier);
    
    // For users with significant savings, ensure meaningful growth
    const enhancedPeak = userSavings > 500000 ? Math.max(peakPortfolio, userSavings * 4) : peakPortfolio;
    
    // Account values that grow from user's current savings across phases (in actual dollars)
    // Start all accounts from user's current savings, distributed across account types
    const startingSavings = userSavings;
    const startingPreTax = startingSavings * 0.4;   // 40% in pre-tax
    const startingRoth = startingSavings * 0.3;     // 30% in Roth
    const startingBrokerage = startingSavings * 0.3; // 30% in Brokerage
    
    const accountData = [
      // Accumulation: Starting from user's current savings
      { preTax: startingPreTax, roth: startingRoth, brokerage: startingBrokerage },
      // Retirement Planning: Growing significantly from current savings
      { preTax: startingPreTax + (enhancedPeak * 0.3), roth: startingRoth + (enhancedPeak * 0.5), brokerage: startingBrokerage + (enhancedPeak * 0.7) },
      // Distribution: Peak values
      { preTax: startingPreTax + (enhancedPeak * 0.4), roth: startingRoth + (enhancedPeak * 0.65), brokerage: startingBrokerage + (enhancedPeak * 0.85) },
      // Wealth Transfer: Drawing down but still above starting point
      { preTax: startingPreTax + (enhancedPeak * 0.25), roth: startingRoth + (enhancedPeak * 0.45), brokerage: startingBrokerage + (enhancedPeak * 0.6) }
    ];
    
    const threeLayerChart = {
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
            display: false  // Remove redundant title
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
              display: false  // Remove the title, just show labels
            },
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 24,  // Much bigger x-axis labels (was 18pt)
                weight: 'bold'
              },
              color: '#1e2a45'
            }
          },
          y: {
            title: {
              display: false
            },
            min: Math.min(startingPreTax, startingRoth, startingBrokerage) * 0.9, // Start from 90% of lowest starting value
            ticks: {
              font: {
                size: 20,  // Much bigger y-axis labels (was 14pt)
                weight: 'bold'
              },
              color: '#1e2a45',
              callback: function(value) {
                // Show actual dollar values based on user's scale
                if (value >= 1000000) {
                  return '$' + (value/1000000).toFixed(1) + 'M';
                } else if (value >= 1000) {
                  return '$' + Math.round(value/1000) + 'K';
                } else {
                  return '$' + Math.round(value);
                }
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

    // Generate chart URLs using GET method with encoded chart config + CACHE BUSTING
    const timestamp = Date.now(); // Add timestamp to prevent caching
    const lifecycleUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(lifecycleChart))}&w=600&h=300&f=png&t=${timestamp}`;
    const comparisonUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(comparisonChart))}&w=600&h=300&f=png&t=${timestamp}`;
    const retirementGraphUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(threeLayerChart))}&w=700&h=400&f=png&t=${timestamp}`;
    
    console.log('✅ All charts generated successfully with cache busting!');
    console.log('📊 Chart URLs with timestamp:', {
      lifecycle: lifecycleUrl,
      comparison: comparisonUrl,
      retirementGraph: retirementGraphUrl,
      timestamp: new Date(timestamp).toISOString()
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
          Author: 'E.H. Howard Wealth Management',
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
 * Render clean 2-page "Retirement Plan" PDF
 */
async function renderPDF(doc, data, projections, charts) {
  const pageWidth = doc.page.width;
  const margin = 72; // 1 inch margins
  const contentWidth = pageWidth - (margin * 2);
  
  // PAGE 1 - MAIN ANALYSIS
  
  // 1. TOP BRANDING - Logos on both sides + company name and title
  try {
    // Add E.H. Howard logo on LEFT side
    const logoResponse = await axios.get('https://media.licdn.com/dms/image/v2/D4E03AQHNi-MkmqCYNw/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1708364083911?e=2147483647&v=beta&t=kHRmVIEFKZKav5KHFRzOpnasZAVCV0isvaaPbGG2Qvs', { responseType: 'arraybuffer' });
    const logoBuffer = Buffer.from(logoResponse.data);
    const logoWidth = 70; // Increased from 50
    doc.image(logoBuffer, margin, 25, { width: logoWidth });
    
    // Add E.H. Howard logo on RIGHT side  
    doc.image(logoBuffer, pageWidth - margin - logoWidth, 25, { width: logoWidth });
  } catch (error) {
    console.log('Could not load logo');
  }
  
  // Center company name
  doc.fontSize(18).fillColor('#1e2a45').text('E.H. HOWARD WEALTH MANAGEMENT', margin, 40, { align: 'center', width: contentWidth });
  
  // Center title "Retirement Plan"
  doc.fontSize(24)
     .fillColor('#1e2a45')
     .text('Retirement Plan', margin, 90, { align: 'center', width: contentWidth });
  
  // Add back Personal Info Table (remove title, fix column headers)
  let yPos = 130;
  
  // Create table with full headers and taller rows to fit text properly
  const tableData = [
    ['Name', 'Age', 'Annual Income', 'Retirement Savings', 'Retirement Age', 'Lifestyle Goal'],
    [data.name || 'Client', data.age.toString(), `$${parseInt(data.income).toLocaleString()}`, `$${parseInt(data.savings).toLocaleString()}`, data.retireAge.toString(), data.lifestyle ? data.lifestyle.charAt(0).toUpperCase() + data.lifestyle.slice(1) : 'Modest']
  ];
  
  // Table styling with taller rows
  const tableWidth = contentWidth;
  const colWidth = tableWidth / 6; // 6 columns
  const rowHeight = 35; // Increased from 25 to 35 for better text fit
  
  // Draw table
  tableData.forEach((row, rowIndex) => {
    const currentY = yPos + (rowIndex * rowHeight);
    
    // Draw row background (alternating colors)
    if (rowIndex === 0) {
      // Header row - blue background
      doc.rect(margin, currentY, tableWidth, rowHeight).fillColor('#2a73d2').fill();
    } else {
      // Data row - light background
      doc.rect(margin, currentY, tableWidth, rowHeight).fillColor('#f8f9fa').fill();
    }
    
    // Draw cell borders
    doc.rect(margin, currentY, tableWidth, rowHeight).strokeColor('#dee2e6').lineWidth(1).stroke();
    
    // Draw vertical lines between columns
    for (let i = 1; i < 6; i++) {
      const x = margin + (i * colWidth);
      doc.moveTo(x, currentY).lineTo(x, currentY + rowHeight).strokeColor('#dee2e6').lineWidth(1).stroke();
    }
    
    // Add text to cells
    row.forEach((cell, colIndex) => {
      const cellX = margin + (colIndex * colWidth);
      const fontSize = rowIndex === 0 ? 11 : 10; // Header slightly bigger
      const fontColor = rowIndex === 0 ? '#ffffff' : '#1e2a45';
      const fontWeight = rowIndex === 0 ? 'Helvetica-Bold' : 'Helvetica';
      
      doc.fontSize(fontSize).font(fontWeight).fillColor(fontColor)
         .text(cell, cellX + 5, currentY + 7, { 
           width: colWidth - 10, 
           align: 'center',
           ellipsis: true
         });
    });
  });
  
  yPos += (tableData.length * rowHeight) + 25;
  
  // 2. RETIREMENT INSIGHT BOX (moved down after personal info)
  doc.fontSize(16).fillColor('#1e2a45').text('Retirement Insight', margin, yPos);
  yPos += 20;
  
  // Bordered insight box
  const insightHeight = 70;
  doc.rect(margin, yPos, contentWidth, insightHeight).strokeColor('#e0e7ff').lineWidth(1).stroke();
  doc.rect(margin, yPos, contentWidth, insightHeight).fillColor('#fdfdfd').fill();
  
  // Add the AI-generated summary text from data.summary
  doc.fontSize(10)
     .fillColor('#1e2a45')
     .text(data.summary || 'Your personalized retirement insight will appear here...', 
           margin + 15, yPos + 10, { 
             width: contentWidth - 30, 
             lineGap: 2 
           });
  yPos += insightHeight + 35; // More spacing before timeline
  
  // 3. RETIREMENT TIMELINE
  doc.fontSize(16).fillColor('#1e2a45').text('Retirement Timeline', margin, yPos);
  yPos += 40; // Increased spacing from 25px to 40px to prevent overlap
  
  // Draw timeline with 4 phases - Fixed spacing
  const timelineY = yPos;
  const timelineStart = margin + 20;
  const timelineEnd = pageWidth - margin - 20;
  const timelineWidth = timelineEnd - timelineStart;
  const phaseWidth = timelineWidth / 3; // Divide by 3 to get 4 points
  
  const phases = [
    { name: 'Accumulation\nPhase', desc: 'Building wealth through saving and investing' },
    { name: 'Retirement\nPlanning', desc: 'Optimizing strategy before retirement' },
    { name: 'Distribution\nPhase', desc: 'Managing withdrawals during retirement' },
    { name: 'Wealth\nTransfer', desc: 'Passing assets to beneficiaries' }
  ];
  
  // Draw main timeline line (stops at last phase)
  doc.moveTo(timelineStart, timelineY).lineTo(timelineEnd, timelineY).strokeColor('#2a73d2').lineWidth(3).stroke();
  
  phases.forEach((phase, i) => {
    const phaseX = timelineStart + (i * phaseWidth);
    
    // Draw phase milestone circles
    doc.circle(phaseX, timelineY, 6).fillColor('#2a73d2').fill();
    
    // Phase name (bold, 14pt - wider width to prevent wrapping)
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e2a45').text(phase.name, phaseX - 60, timelineY + 20, { width: 120, align: 'center' });
    
    // Phase description (12pt, gray - positioned lower with more space)
    doc.fontSize(12).font('Helvetica').fillColor('#666666').text(phase.desc, phaseX - 70, timelineY + 60, { width: 140, align: 'center' });
  });
  yPos += 140; // Increased spacing from 120px to 140px for better separation
  
  // 4. RETIREMENT GRAPH (3-layer area chart only)
  doc.fontSize(16).fillColor('#1e2a45').text('Retirement Graph', margin, yPos);
  yPos += 20;
  
  // Only add the 3-layer retirement graph
  if (charts.retirementGraph) {
    try {
      const graphResponse = await axios.get(charts.retirementGraph, { responseType: 'arraybuffer' });
      const graphBuffer = Buffer.from(graphResponse.data);
      doc.image(graphBuffer, margin, yPos, { width: contentWidth, height: 140 });
      yPos += 150;
    } catch (error) {
      console.log('Could not load retirement graph');
      yPos += 150;
    }
  }
  
  // 5. PROFESSIONAL TIPS SECTION (on same page)
  doc.fontSize(16).fillColor('#1e2a45').text('Professional Tips', margin, yPos);
  yPos += 20;
  
  const tips = [
    'Save early and often',
    'Utilize retirement savings through Pre-Tax, Roth and Brokerage Accounts',
    'Minimize market volatility in Retirement Planning and Distribution Phases',
    'Plan to withdraw 4-5% of total portfolio for retirement income',
    'Use a financial professional'
  ];
  
  doc.fontSize(9).fillColor('#1e2a45');
  tips.forEach(tip => {
    doc.text(`• ${tip}`, margin + 20, yPos, { width: contentWidth - 40, continued: false });
    yPos += 12;
  });
  
  yPos += 35; // More spacing before footer
  
  // Footer with clickable website link (removed More Resources section and buttons)
  doc.fontSize(14).fillColor('#2a73d2')
     .text('ehhowardwealth.com', margin, yPos, { align: 'center', width: contentWidth });
  doc.link(margin, yPos, contentWidth, 20, 'https://ehhowardwealth.com');
  
  // Company footer
  doc.fontSize(8)
     .fillColor('#666666')
     .text('E.H. HOWARD WEALTH MANAGEMENT | Professional Retirement Planning Services', 
           margin, doc.page.height - 50, { align: 'center', width: contentWidth });
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