/**
 * Retirement Analysis Template
 * Generates personalized retirement reports with charts and projections
 */

function retirementTemplate(doc, data) {
  const {
    name = 'Client',
    age = 30,
    income = 50000,
    savings = 100000,
    retireAge = 65,
    lifestyle = 'comfortable',
    email = '',
    phone = '',
    summary = '',
    timestamp = new Date().toISOString()
  } = data;

  // Calculate retirement projections
  const yearsToRetirement = retireAge - age;
  const workingYears = Math.max(yearsToRetirement, 0);
  
  // Lifestyle multipliers for retirement income needs
  const lifestyleMultipliers = {
    modest: 0.7,
    comfortable: 0.8,
    luxury: 1.0
  };
  
  const targetIncomeReplacement = lifestyleMultipliers[lifestyle] || 0.8;
  const targetRetirementIncome = income * targetIncomeReplacement;
  const annualRetirementNeeds = targetRetirementIncome;
  
  // Simple retirement calculations (assuming 7% growth, 4% withdrawal)
  const growthRate = 0.07;
  const withdrawalRate = 0.04;
  const recommendedContribution = income * 0.15; // 15% savings rate
  
  // Project future savings with current trajectory (no additional contributions)
  const currentTrajectory = savings * Math.pow(1 + growthRate, workingYears);
  
  // Project with recommended contributions
  const futureValue = savings * Math.pow(1 + growthRate, workingYears) + 
    (recommendedContribution * ((Math.pow(1 + growthRate, workingYears) - 1) / growthRate));
  
  const projectedRetirementIncome = futureValue * withdrawalRate;
  const monthlyProjectedIncome = projectedRetirementIncome / 12;
  const monthlyTargetIncome = annualRetirementNeeds / 12;
  
  // Header with logo space and title
  doc.fontSize(28)
     .font('Helvetica-Bold')
     .fillColor('#1e2a45')
     .text('Retirement Analysis Report', 50, 50);
  
  doc.fontSize(14)
     .font('Helvetica')
     .fillColor('#666666')
     .text(`Prepared for ${name}`, 50, 85)
     .text(`Generated on ${new Date(timestamp).toLocaleDateString()}`, 50, 100);

  // Client info section
  let currentY = 140;
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor('#1e2a45')
     .text('Your Current Situation', 50, currentY);
  
  currentY += 25;
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor('#000000');
  
  const clientInfo = [
    `Current Age: ${age} years old`,
    `Annual Income: $${parseInt(income).toLocaleString()}`,
    `Current Savings: $${parseInt(savings).toLocaleString()}`,
    `Retirement Goal: Age ${retireAge} (${workingYears} years from now)`,
    `Lifestyle Target: ${lifestyle.charAt(0).toUpperCase() + lifestyle.slice(1)}`
  ];
  
  clientInfo.forEach(info => {
    doc.text(info, 70, currentY);
    currentY += 18;
  });

  // Retirement projections section
  currentY += 20;
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor('#1e2a45')
     .text('Retirement Projections', 50, currentY);
  
  currentY += 30;
  
  // Create a simple bar chart for income needs
  this.renderIncomeChart(doc, 50, currentY, {
    currentIncome: income,
    targetRetirementIncome: annualRetirementNeeds,
    projectedIncome: projectedRetirementIncome
  });
  
  currentY += 200; // Space for chart
  
  // Key numbers section
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor('#1e2a45')
     .text('Key Numbers for Your Retirement', 50, currentY);
  
  currentY += 25;
  doc.fontSize(11)
     .font('Helvetica')
     .fillColor('#000000');
  
  const keyNumbers = [
    `Monthly Income Needed: $${monthlyTargetIncome.toLocaleString(undefined, {maximumFractionDigits: 0})}`,
    `Projected Monthly Income: $${monthlyProjectedIncome.toLocaleString(undefined, {maximumFractionDigits: 0})}`,
    `Recommended Annual Contribution: $${recommendedContribution.toLocaleString(undefined, {maximumFractionDigits: 0})}`,
    `Total Projected Savings at ${retireAge}: $${futureValue.toLocaleString(undefined, {maximumFractionDigits: 0})}`
  ];
  
  keyNumbers.forEach(number => {
    doc.text(number, 70, currentY);
    currentY += 16;
  });

  // Summary section if provided
  if (summary) {
    currentY += 25;
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#1e2a45')
       .text('Your Personalized Analysis', 50, currentY);
    
    currentY += 25;
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#000000')
       .text(summary, 50, currentY, {
         width: 500,
         align: 'left'
       });
  }

  // Start new page for recommendations
  doc.addPage();
  
  // Recommendations section
  currentY = 50;
  doc.fontSize(20)
     .font('Helvetica-Bold')
     .fillColor('#1e2a45')
     .text('Recommendations & Next Steps', 50, currentY);
  
  currentY += 40;
  
  // Generate personalized recommendations
  const recommendations = this.generateRecommendations({
    age,
    income,
    savings,
    retireAge,
    lifestyle,
    projectedIncome: projectedRetirementIncome,
    targetIncome: annualRetirementNeeds,
    yearsToRetirement: workingYears
  });
  
  recommendations.forEach((rec, index) => {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2a73d2')
       .text(`${index + 1}. ${rec.title}`, 50, currentY);
    
    currentY += 20;
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#000000')
       .text(rec.description, 70, currentY, {
         width: 450,
         align: 'left'
       });
    
    currentY += doc.heightOfString(rec.description, {width: 450}) + 20;
  });

  // Contact footer
  const footerY = doc.page.height - 100;
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#666666')
     .text('This analysis is for educational purposes. Consult with a financial advisor for personalized advice.', 50, footerY, {
       align: 'center',
       width: doc.page.width - 100
     });

  doc.end();
  return doc;
}

/**
 * Render a simple income comparison chart
 */
function renderIncomeChart(doc, x, y, data) {
  const { currentIncome, targetRetirementIncome, projectedIncome } = data;
  
  const chartWidth = 400;
  const chartHeight = 150;
  const maxIncome = Math.max(currentIncome, targetRetirementIncome, projectedIncome);
  
  const bars = [
    { label: 'Current Income', value: currentIncome, color: '#e1e4e8' },
    { label: 'Retirement Target', value: targetRetirementIncome, color: '#f39c12' },
    { label: 'Projected Income', value: projectedIncome, color: projectedIncome >= targetRetirementIncome ? '#27ae60' : '#e74c3c' }
  ];
  
  const barWidth = chartWidth / bars.length - 20;
  let currentX = x + 10;
  
  bars.forEach(bar => {
    const barHeight = (bar.value / maxIncome) * chartHeight;
    const barY = y + chartHeight - barHeight;
    
    // Draw bar
    doc.rect(currentX, barY, barWidth, barHeight)
       .fillColor(bar.color)
       .fill();
    
    // Add value label on top of bar
    doc.fontSize(10)
       .fillColor('#000000')
       .text(`$${(bar.value / 1000).toFixed(0)}k`, currentX, barY - 15, {
         width: barWidth,
         align: 'center'
       });
    
    // Add label below bar
    doc.fontSize(9)
       .text(bar.label, currentX, y + chartHeight + 10, {
         width: barWidth,
         align: 'center'
       });
    
    currentX += barWidth + 20;
  });
  
  // Chart title
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor('#1e2a45')
     .text('Annual Income Comparison', x, y - 20);
}

/**
 * Generate personalized recommendations based on user data
 */
function generateRecommendations(data) {
  const { age, income, savings, projectedIncome, targetIncome, yearsToRetirement } = data;
  const recommendations = [];
  
  // Income replacement adequacy
  if (projectedIncome < targetIncome) {
    const shortfall = targetIncome - projectedIncome;
    const additionalNeeded = shortfall / 0.04; // 4% rule
    const monthlyIncrease = (additionalNeeded / yearsToRetirement) / 12;
    
    recommendations.push({
      title: 'Increase Your Savings Rate',
      description: `You're projected to have a retirement income shortfall of $${shortfall.toLocaleString(undefined, {maximumFractionDigits: 0})} annually. Consider increasing your monthly savings by $${monthlyIncrease.toLocaleString(undefined, {maximumFractionDigits: 0})} to bridge this gap.`
    });
  }
  
  // Age-specific advice
  if (age < 35) {
    recommendations.push({
      title: 'Take Advantage of Time',
      description: 'You have time on your side! Even small increases in savings now will compound significantly. Consider maxing out your 401(k) employer match and opening a Roth IRA for tax-free growth.'
    });
  } else if (age >= 50) {
    recommendations.push({
      title: 'Utilize Catch-Up Contributions',
      description: 'At age 50+, you can make additional "catch-up" contributions to your 401(k) and IRA. This allows you to save more and potentially reduce your current tax burden.'
    });
  }
  
  // Savings rate advice
  const currentSavingsRate = (savings / income) * 100;
  if (currentSavingsRate < 10) {
    recommendations.push({
      title: 'Build Your Emergency Fund First',
      description: 'Before increasing retirement savings, ensure you have 3-6 months of expenses in an emergency fund. This prevents you from having to tap retirement accounts during financial emergencies.'
    });
  }
  
  // Investment diversification
  recommendations.push({
    title: 'Review Your Investment Mix',
    description: 'Ensure your portfolio is properly diversified across stocks, bonds, and international investments based on your age and risk tolerance. Consider low-cost index funds for broad market exposure.'
  });
  
  // Social Security optimization
  if (age >= 55) {
    recommendations.push({
      title: 'Plan Your Social Security Strategy',
      description: 'Delaying Social Security beyond full retirement age increases your benefit by approximately 8% per year until age 70. This can significantly boost your retirement income.'
    });
  }
  
  return recommendations.slice(0, 4); // Limit to top 4 recommendations
}

// Bind the chart rendering function to the template context
retirementTemplate.renderIncomeChart = renderIncomeChart;
retirementTemplate.generateRecommendations = generateRecommendations;

module.exports = retirementTemplate; 