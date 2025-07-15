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
    
    // Calculate "You are here" position based on age and retirement timeline
    const currentAge = parseInt(data.age);
    const retirementAge = parseInt(data.retireAge);
    const yearsToRetirement = retirementAge - currentAge;
    
    // Define phase age ranges dynamically based on user's retirement timeline
    const workingYears = retirementAge - 25; // Assume working starts at 25
    const accumulationEnd = 25 + (workingYears * 0.7); // 70% of working years
    const retirementPlanningEnd = retirementAge; // Ends at retirement
    const distributionEnd = retirementAge + 20; // 20 years of retirement
    const wealthTransferEnd = retirementAge + 35; // 35 years total retirement
    
    // Calculate which phase and position within that phase
    let phaseIndex = 0;
    let phasePosition = 0;
    
    if (currentAge < 25) {
      // User is very young - place them at the beginning of accumulation
      phaseIndex = 0;
      phasePosition = 0;
    } else if (currentAge <= accumulationEnd && accumulationEnd > 25) {
      phaseIndex = 0; // Accumulation Phase
      phasePosition = Math.max(0, (currentAge - 25) / (accumulationEnd - 25));
    } else if (currentAge <= retirementPlanningEnd) {
      phaseIndex = 1; // Retirement Planning Phase  
      phasePosition = (retirementPlanningEnd - accumulationEnd) > 0 ? (currentAge - accumulationEnd) / (retirementPlanningEnd - accumulationEnd) : 0;
    } else if (currentAge <= distributionEnd) {
      phaseIndex = 2; // Distribution Phase
      phasePosition = (distributionEnd - retirementPlanningEnd) > 0 ? (currentAge - retirementPlanningEnd) / (distributionEnd - retirementPlanningEnd) : 0;
    } else {
      phaseIndex = 3; // Wealth Transfer Phase
      phasePosition = (wealthTransferEnd - distributionEnd) > 0 ? Math.min(1, (currentAge - distributionEnd) / (wealthTransferEnd - distributionEnd)) : 0;
    }
    
    // Ensure phase position is between 0 and 1
    phasePosition = Math.max(0, Math.min(1, phasePosition));
    
    // Calculate exact position on timeline (0-3 scale)
    const timelinePosition = phaseIndex + phasePosition;
    
    // Calculate current account values based on position
    const currentPhaseIndex = Math.min(Math.floor(timelinePosition), accountData.length - 1);
    const nextPhaseIndex = Math.min(currentPhaseIndex + 1, accountData.length - 1);
    
    const currentPreTax = startingPreTax + ((accountData[currentPhaseIndex].preTax - startingPreTax) * phasePosition);
    const currentRoth = startingRoth + ((accountData[currentPhaseIndex].roth - startingRoth) * phasePosition);
    const currentBrokerage = startingBrokerage + ((accountData[currentPhaseIndex].brokerage - startingBrokerage) * phasePosition);
    
    console.log('🎯 "You Are Here" Calculation:', {
      currentAge,
      retirementAge,
      yearsToRetirement,
      phaseIndex,
      phasePosition: phasePosition.toFixed(2),
      timelinePosition: timelinePosition.toFixed(2),
      currentTotalValue: (currentPreTax + currentRoth + currentBrokerage).toLocaleString()
    });
    
    // Calculate current total value for "You Are Here" annotation
    const currentTotalValue = currentPreTax + currentRoth + currentBrokerage;
    
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
          },
          {
            label: 'You Are Here',
            data: [
              timelinePosition < 1 ? currentTotalValue : null,
              timelinePosition >= 1 && timelinePosition < 2 ? currentTotalValue : null,
              timelinePosition >= 2 && timelinePosition < 3 ? currentTotalValue : null,
              timelinePosition >= 3 ? currentTotalValue : null
            ],
            backgroundColor: '#FF6B6B',
            borderColor: '#FF6B6B',
            borderWidth: 4,
            pointRadius: 12,
            pointStyle: 'circle',
            showLine: false,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: false
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
                  { text: 'Brokerage', fillStyle: '#2C5282', strokeStyle: '#2C5282' },
                  { text: 'You Are Here', fillStyle: '#FF6B6B', strokeStyle: '#FF6B6B' }
                ];
              }
            }
          },
          // Add subtitle showing current savings amount
          subtitle: {
            display: true,
            text: `You've saved ${currentTotalValue >= 1000000 ? '$' + (currentTotalValue/1000000).toFixed(1) + 'M' : '$' + (currentTotalValue/1000).toFixed(0) + 'K'} today`,
            color: '#FF6B6B',
            font: {
              size: 14,
              weight: 'bold'
            },
            padding: {
              top: 5,
              bottom: 15
            }
          }
        },
        scales: {
          x: {
            title: {
              display: false
            },
            grid: {
              display: false,
              drawBorder: false,  // Remove left border line
              drawTicks: false    // Remove tick marks for cleaner look
            },
            ticks: {
              font: {
                size: 24,
                weight: 'bold'
              },
              color: '#1e2a45'
            },
            border: {
              display: false  // Remove bottom border line
            }
          },
          y: {
            title: {
              display: false
            },
            min: Math.min(startingPreTax, startingRoth, startingBrokerage) * 0.9,
            ticks: {
              font: {
                size: 20,
                weight: 'bold'
              },
              color: '#1e2a45',
              callback: function(value) {
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
              color: 'rgba(0,0,0,0.05)',  // Even lighter grid lines
              lineWidth: 1,
              drawBorder: false,  // Remove left border line
              drawTicks: false    // Remove tick marks for cleaner look
            },
            border: {
              display: false  // Remove left border line
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
        },
        // Clean up chart spines - remove right and top borders
        layout: {
          padding: {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10
          }
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
        margin: 30,
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
  const margin = 30; // Narrower margins - 0.42 inches
  const contentWidth = pageWidth - (margin * 2);
  
  // PAGE 1 - MAIN ANALYSIS
  
  // Add vertical blue banner on the right side
  const bannerWidth = 40;
  const bannerX = pageWidth - bannerWidth;
  doc.rect(bannerX, 0, bannerWidth, doc.page.height).fillColor('#1e2a45').fill();
  
  // Add rotated company name in the banner
  doc.save();
  doc.translate(bannerX + 20, doc.page.height / 2);
  doc.rotate(-90);
  doc.fontSize(14).fillColor('#ffffff').font('Helvetica-Bold')
     .text('E.H. HOWARD WEALTH MANAGEMENT', 0, 0, { align: 'center' });
  doc.restore();
  
  // Adjust content width to account for the banner
  const adjustedContentWidth = contentWidth - bannerWidth;
  
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
  doc.fontSize(18).fillColor('#1e2a45').text('E.H. HOWARD WEALTH MANAGEMENT', margin, 40, { align: 'center', width: adjustedContentWidth });
  
  // Center title "Retirement Plan"
  doc.fontSize(24)
     .fillColor('#1e2a45')
     .text('Retirement Plan', margin, 90, { align: 'center', width: adjustedContentWidth });
  
  // Add back Personal Info Table (remove title, fix column headers)
  let yPos = 130;
  
  // Create table with full headers and taller rows to fit text properly
  const tableData = [
    ['Name', 'Age', 'Annual Income', 'Retirement Savings', 'Retirement Age', 'Lifestyle Goal'],
    [data.name || 'Client', data.age.toString(), `$${parseInt(data.income).toLocaleString()}`, `$${parseInt(data.savings).toLocaleString()}`, data.retireAge.toString(), data.lifestyle ? data.lifestyle.charAt(0).toUpperCase() + data.lifestyle.slice(1) : 'Modest']
  ];
  
  // Table styling with taller rows
  const tableWidth = adjustedContentWidth;
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
  doc.rect(margin, yPos, adjustedContentWidth, insightHeight).strokeColor('#e0e7ff').lineWidth(1).stroke();
  doc.rect(margin, yPos, adjustedContentWidth, insightHeight).fillColor('#fdfdfd').fill();
  
  // Add the AI-generated summary text from data.summary
  doc.fontSize(10)
     .fillColor('#1e2a45')
     .text(data.summary || 'Your personalized retirement insight will appear here...', 
           margin + 15, yPos + 10, { 
             width: adjustedContentWidth - 30, 
             lineGap: 2 
           });
  yPos += insightHeight + 50; // Increased spacing before graph
  
  // 3. RETIREMENT GRAPH (moved up from timeline position)
  doc.fontSize(16).fillColor('#1e2a45').text('Retirement Graph', margin, yPos);
  yPos += 25;
  
  // Only add the 3-layer retirement graph
  if (charts.retirementGraph) {
    try {
      const graphResponse = await axios.get(charts.retirementGraph, { responseType: 'arraybuffer' });
      const graphBuffer = Buffer.from(graphResponse.data);
      
      // Maintain proper aspect ratio (700:400 = 1.75:1)
      const chartWidth = adjustedContentWidth;
      const chartHeight = chartWidth / 1.75; // Maintain original aspect ratio
      
      doc.image(graphBuffer, margin, yPos, { width: chartWidth, height: chartHeight });
      yPos += chartHeight + 15;
    } catch (error) {
      console.log('Could not load retirement graph');
      yPos += 150;
    }
  }
  
  // 4. PROFESSIONAL TIPS SECTION (on same page, more space now)
  doc.fontSize(16).fillColor('#1e2a45').text('Professional Tips', margin, yPos);
  yPos += 25;
  
  const tips = [
    'Save early and often',
    'Utilize retirement savings through Pre-Tax, Roth and Brokerage Accounts',
    'Minimize market volatility in Retirement Planning and Distribution Phases',
    'Plan to withdraw 4-5% of total portfolio for retirement income',
    'Use a financial professional'
  ];
  
  doc.fontSize(9).fillColor('#1e2a45');
  tips.forEach(tip => {
    doc.text(`• ${tip}`, margin + 20, yPos, { width: adjustedContentWidth - 40, continued: false });
    yPos += 12;
  });
  
  yPos += 25; // Reduced spacing before footer to keep it on page 1
  
  // Footer with embedded link (moved up to first page)
  const footerText = 'E.H. HOWARD WEALTH MANAGEMENT | Professional Retirement Planning Services';
  doc.fontSize(8)
     .fillColor('#666666')
     .text(footerText, margin, yPos, { align: 'center', width: adjustedContentWidth });
  doc.link(margin, yPos, adjustedContentWidth, 15, 'https://ehhowardwealth.com');
  
  // PAGE 2 - RETIREMENT TIMELINE (moved from page 1)
  doc.addPage();
  
  // Add vertical blue banner on page 2 as well
  doc.rect(bannerX, 0, bannerWidth, doc.page.height).fillColor('#1e2a45').fill();
  
  // Add rotated company name in the banner on page 2
  doc.save();
  doc.translate(bannerX + 20, doc.page.height / 2);
  doc.rotate(-90);
  doc.fontSize(14).fillColor('#ffffff').font('Helvetica-Bold')
     .text('E.H. HOWARD WEALTH MANAGEMENT', 0, 0, { align: 'center' });
  doc.restore();
  
  yPos = margin;
  
  // 5. RETIREMENT TIMELINE (now on page 2)
  doc.fontSize(16).fillColor('#1e2a45').text('Retirement Timeline', margin, yPos);
  yPos += 40; // Increased spacing from 25px to 40px to prevent overlap
  
  // Draw timeline with 4 phases - Fixed spacing
  const timelineY = yPos;
  const timelineStart = margin + 15;
  const timelineEnd = pageWidth - margin - bannerWidth - 15; // Account for banner
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