// N8N Code Node - Replace "Generate PDF Payload", "PDF-Completer", and "Download-PDF" with this single node

const PDFDocument = require('pdfkit');

// Get form data from webhook
const formData = $input.all()[0].json.body;

// Process form data 
const data = {
  name: formData.name || 'Client',
  age: parseInt(formData.age) || 30,
  income: parseInt(formData.income) || 50000,
  savings: parseInt(formData.savings) || 100000,
  retireAge: parseInt(formData.retireAge) || 65,
  lifestyle: formData.lifestyle || 'comfortable',
  email: formData.email || '',
  phone: formData.phone || '',
  summary: formData.summary || '',
  timestamp: formData.timestamp || new Date().toISOString()
};

// Calculate retirement projections
function calculateProjections(data) {
  const { age, income, savings, retireAge, lifestyle } = data;
  
  const yearsToRetirement = Math.max(retireAge - age, 0);
  const growthRate = 0.07; // 7% annual growth
  const withdrawalRate = 0.04; // 4% withdrawal rule
  
  const lifestyleMultipliers = {
    modest: 0.7,
    comfortable: 0.8,
    luxury: 1.0
  };
  
  const targetIncomeReplacement = lifestyleMultipliers[lifestyle] || 0.8;
  const targetRetirementIncome = income * targetIncomeReplacement;
  const recommendedContribution = income * 0.15; // 15% savings rate
  
  const futureValue = savings * Math.pow(1 + growthRate, yearsToRetirement) + 
    (recommendedContribution * ((Math.pow(1 + growthRate, yearsToRetirement) - 1) / growthRate));
  
  const projectedRetirementIncome = futureValue * withdrawalRate;
  
  return {
    yearsToRetirement,
    targetRetirementIncome,
    projectedRetirementIncome,
    futureValue,
    recommendedContribution,
    monthlyTargetIncome: targetRetirementIncome / 12,
    monthlyProjectedIncome: projectedRetirementIncome / 12,
    shortfall: Math.max(targetRetirementIncome - projectedRetirementIncome, 0),
    surplus: Math.max(projectedRetirementIncome - targetRetirementIncome, 0)
  };
}

// Generate PDF
return new Promise((resolve, reject) => {
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  });

  const chunks = [];
  
  doc.on('data', chunk => chunks.push(chunk));
  doc.on('end', () => {
    const pdfBuffer = Buffer.concat(chunks);
    resolve([{
      json: { success: true, fileName: `Retirement_Analysis_${data.name.replace(/\s+/g, '_')}.pdf` },
      binary: {
        data: {
          data: pdfBuffer.toString('base64'),
          mimeType: 'application/pdf',
          fileName: `Retirement_Analysis_${data.name.replace(/\s+/g, '_')}.pdf`
        }
      }
    }]);
  });
  
  doc.on('error', (err) => {
    reject(err);
  });

  // Calculate projections
  const projections = calculateProjections(data);

  // PAGE 1 - Analysis
  
  // Header
  doc.fontSize(28)
     .font('Helvetica-Bold')
     .fillColor('#1e2a45')
     .text('Retirement Analysis Report', 50, 50);
  
  doc.fontSize(14)
     .font('Helvetica')
     .fillColor('#666666')
     .text(`Prepared for ${data.name}`, 50, 85)
     .text(`Generated on ${new Date(data.timestamp).toLocaleDateString()}`, 50, 100);

  // Current situation
  let currentY = 140;
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor('#1e2a45')
     .text('Your Current Situation', 50, currentY);
  
  currentY += 30;
  doc.fontSize(12).font('Helvetica').fillColor('#000000');
  
  const clientInfo = [
    `Current Age: ${data.age} years old`,
    `Annual Income: $${data.income.toLocaleString()}`,
    `Current Savings: $${data.savings.toLocaleString()}`,
    `Retirement Goal: Age ${data.retireAge} (${projections.yearsToRetirement} years from now)`,
    `Lifestyle Target: ${data.lifestyle.charAt(0).toUpperCase() + data.lifestyle.slice(1)}`
  ];
  
  clientInfo.forEach(info => {
    doc.text(`• ${info}`, 70, currentY);
    currentY += 18;
  });

  // Visual Chart
  currentY = 300;
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor('#1e2a45')
     .text('Annual Income Comparison', 50, currentY - 30);
  
  const chartWidth = 400;
  const chartHeight = 150;
  const maxIncome = Math.max(projections.targetRetirementIncome, projections.projectedRetirementIncome);
  
  const bars = [
    { 
      label: 'Retirement Target', 
      value: projections.targetRetirementIncome, 
      color: '#f39c12' 
    },
    { 
      label: 'Projected Income', 
      value: projections.projectedRetirementIncome, 
      color: projections.projectedRetirementIncome >= projections.targetRetirementIncome ? '#27ae60' : '#e74c3c' 
    }
  ];
  
  const barWidth = chartWidth / bars.length - 40;
  let currentX = 70;
  
  bars.forEach(bar => {
    const barHeight = (bar.value / maxIncome) * chartHeight;
    const barY = currentY + chartHeight - barHeight;
    
    // Draw bar
    doc.rect(currentX, barY, barWidth, barHeight)
       .fillColor(bar.color)
       .fill();
    
    // Value label
    doc.fontSize(12)
       .fillColor('#000000')
       .text(`$${(bar.value / 1000).toFixed(0)}k`, currentX, barY - 20, {
         width: barWidth,
         align: 'center'
       });
    
    // Bar label
    doc.fontSize(10)
       .text(bar.label, currentX, currentY + chartHeight + 10, {
         width: barWidth,
         align: 'center'
       });
    
    currentX += barWidth + 40;
  });

  // Key Numbers
  currentY = 500;
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor('#1e2a45')
     .text('Key Numbers for Your Retirement', 50, currentY);
  
  let y = currentY + 30;
  doc.fontSize(12).font('Helvetica').fillColor('#000000');
  
  const keyNumbers = [
    `Monthly Income Needed: $${projections.monthlyTargetIncome.toLocaleString(undefined, {maximumFractionDigits: 0})}`,
    `Projected Monthly Income: $${projections.monthlyProjectedIncome.toLocaleString(undefined, {maximumFractionDigits: 0})}`,
    `Recommended Annual Contribution: $${projections.recommendedContribution.toLocaleString(undefined, {maximumFractionDigits: 0})}`,
    `Total Projected Savings: $${projections.futureValue.toLocaleString(undefined, {maximumFractionDigits: 0})}`
  ];
  
  keyNumbers.forEach(number => {
    doc.text(`• ${number}`, 70, y);
    y += 18;
  });
  
  // Gap analysis
  y += 20;
  if (projections.shortfall > 0) {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#e74c3c')
       .text(`Income Gap: $${projections.shortfall.toLocaleString(undefined, {maximumFractionDigits: 0})} annually`, 70, y);
  } else if (projections.surplus > 0) {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#27ae60')
       .text(`Income Surplus: $${projections.surplus.toLocaleString(undefined, {maximumFractionDigits: 0})} annually`, 70, y);
  }

  // Summary if provided
  if (data.summary) {
    currentY = 620;
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#1e2a45')
       .text('Your Personalized Analysis', 50, currentY);
    
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#000000')
       .text(data.summary, 50, currentY + 25, { width: 500 });
  }

  // PAGE 2 - Recommendations
  doc.addPage();
  
  doc.fontSize(20)
     .font('Helvetica-Bold')
     .fillColor('#1e2a45')
     .text('Recommendations & Next Steps', 50, 50);
  
  currentY = 100;
  
  // Generate recommendations
  const recommendations = [];
  
  if (projections.shortfall > 0) {
    const additionalNeeded = projections.shortfall / 0.04;
    const monthlyIncrease = (additionalNeeded / projections.yearsToRetirement) / 12;
    
    recommendations.push({
      title: 'Close Your Income Gap',
      description: `You have a projected retirement income shortfall of $${projections.shortfall.toLocaleString()} annually. Consider increasing your monthly savings by $${monthlyIncrease.toLocaleString(undefined, {maximumFractionDigits: 0})} to bridge this gap.`
    });
  }
  
  if (data.age < 35) {
    recommendations.push({
      title: 'Maximize Your Time Advantage',
      description: 'You have decades for compound growth! Focus on maximizing your 401(k) employer match first, then consider a Roth IRA. Even small increases now will have massive impact over time.'
    });
  } else if (data.age >= 50) {
    recommendations.push({
      title: 'Use Catch-Up Contributions',
      description: 'At 50+, you can make additional catch-up contributions to 401(k) and IRA accounts. This allows extra savings while potentially reducing your current tax burden.'
    });
  }
  
  recommendations.push({
    title: 'Review Your Investment Strategy',
    description: 'Ensure your portfolio matches your risk tolerance and timeline. Consider low-cost index funds for diversification and regular rebalancing to stay on track.'
  });
  
  if ((data.savings / data.income) * 100 < 15) {
    recommendations.push({
      title: 'Build Your Financial Foundation',
      description: 'Before aggressive retirement savings, ensure you have 3-6 months of expenses in an emergency fund. This prevents early withdrawal from retirement accounts.'
    });
  }
  
  // Render recommendations
  recommendations.slice(0, 4).forEach((rec, index) => {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2a73d2')
       .text(`${index + 1}. ${rec.title}`, 50, currentY);
    
    currentY += 20;
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#000000')
       .text(rec.description, 70, currentY, { width: 450 });
    
    currentY += doc.heightOfString(rec.description, {width: 450}) + 25;
  });

  // Footer
  const footerY = doc.page.height - 60;
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#666666')
     .text('This analysis is for educational purposes. Consult with a financial advisor for personalized advice.', 50, footerY, {
       align: 'center',
       width: doc.page.width - 100
     });

  doc.end();
}); 