const PDFDocument = require('pdfkit');
const fs = require('fs');

/**
 * Simple Retirement PDF Generator
 * Designed to work with your HTML form and N8N automation
 */
class RetirementPDFGenerator {
  constructor() {
    this.options = {
      margin: 50,
      pageSize: 'LETTER'
    };
  }

  /**
   * Generate retirement analysis PDF from form data
   */
  generatePDF(formData, outputPath = null) {
    const doc = new PDFDocument({
      size: this.options.pageSize,
      margins: {
        top: this.options.margin,
        bottom: this.options.margin,
        left: this.options.margin,
        right: this.options.margin
      }
    });

    // If outputPath provided, save to file
    if (outputPath) {
      doc.pipe(fs.createWriteStream(outputPath));
    }

    // Process form data
    const data = this.processFormData(formData);
    
    // Generate the PDF content
    this.renderRetirementAnalysis(doc, data);

    return doc;
  }

  /**
   * Process and normalize form data
   */
  processFormData(formData) {
    return {
      name: formData.Name || formData.name || 'Client',
      age: parseInt(formData.Age || formData.age) || 30,
      income: parseInt(formData.Income || formData.income) || 50000,
      savings: parseInt(formData.Savings || formData.savings) || 100000,
      retireAge: parseInt(formData.RetireAge || formData.retireAge) || 65,
      lifestyle: formData.lifestyle || 'comfortable',
      email: formData.userEmail || formData.email || '',
      phone: formData.userPhone || formData.phone || '',
      summary: formData.summary || '',
      timestamp: formData.timestamp || new Date().toISOString()
    };
  }

  /**
   * Render the complete retirement analysis
   */
  renderRetirementAnalysis(doc, data) {
    // Calculate retirement projections
    const projections = this.calculateProjections(data);
    
    // Header
    this.renderHeader(doc, data);
    
    // Current situation
    this.renderCurrentSituation(doc, data, projections);
    
    // Visual chart
    this.renderIncomeChart(doc, projections);
    
    // Key numbers
    this.renderKeyNumbers(doc, projections);
    
    // Personalized summary
    if (data.summary) {
      this.renderSummary(doc, data.summary);
    }
    
    // New page for recommendations
    doc.addPage();
    this.renderRecommendations(doc, data, projections);
    
    // Footer
    this.renderFooter(doc);
    
    doc.end();
  }

  /**
   * Calculate retirement projections
   */
  calculateProjections(data) {
    const { age, income, savings, retireAge, lifestyle } = data;
    
    const yearsToRetirement = Math.max(retireAge - age, 0);
    const growthRate = 0.07; // 7% annual growth
    const withdrawalRate = 0.04; // 4% withdrawal rule
    
    // Lifestyle multipliers
    const lifestyleMultipliers = {
      modest: 0.7,
      comfortable: 0.8,
      luxury: 1.0
    };
    
    const targetIncomeReplacement = lifestyleMultipliers[lifestyle] || 0.8;
    const targetRetirementIncome = income * targetIncomeReplacement;
    const recommendedContribution = income * 0.15; // 15% savings rate
    
    // Project future value with recommended contributions
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

  /**
   * Render PDF header
   */
  renderHeader(doc, data) {
    // Title
    doc.fontSize(28)
       .font('Helvetica-Bold')
       .fillColor('#1e2a45')
       .text('Retirement Analysis Report', 50, 50);
    
    // Subtitle
    doc.fontSize(14)
       .font('Helvetica')
       .fillColor('#666666')
       .text(`Prepared for ${data.name}`, 50, 85)
       .text(`Generated on ${new Date(data.timestamp).toLocaleDateString()}`, 50, 100);
  }

  /**
   * Render current situation section
   */
  renderCurrentSituation(doc, data, projections) {
    let currentY = 140;
    
    // Section title
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#1e2a45')
       .text('Your Current Situation', 50, currentY);
    
    currentY += 30;
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#000000');
    
    // Client info
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

    return currentY + 20;
  }

  /**
   * Render income comparison chart
   */
  renderIncomeChart(doc, projections) {
    const chartY = 300;
    const chartX = 50;
    const chartWidth = 400;
    const chartHeight = 150;
    
    // Chart title
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#1e2a45')
       .text('Annual Income Comparison', chartX, chartY - 30);
    
    const maxIncome = Math.max(
      projections.targetRetirementIncome,
      projections.projectedRetirementIncome
    );
    
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
    let currentX = chartX + 20;
    
    bars.forEach(bar => {
      const barHeight = (bar.value / maxIncome) * chartHeight;
      const barY = chartY + chartHeight - barHeight;
      
      // Draw bar
      doc.rect(currentX, barY, barWidth, barHeight)
         .fillColor(bar.color)
         .fill();
      
      // Value label on top
      doc.fontSize(12)
         .fillColor('#000000')
         .text(`$${(bar.value / 1000).toFixed(0)}k`, currentX, barY - 20, {
           width: barWidth,
           align: 'center'
         });
      
      // Label below
      doc.fontSize(10)
         .text(bar.label, currentX, chartY + chartHeight + 10, {
           width: barWidth,
           align: 'center'
         });
      
      currentX += barWidth + 40;
    });
  }

  /**
   * Render key numbers section
   */
  renderKeyNumbers(doc, projections) {
    const currentY = 500;
    
    // Section title
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#1e2a45')
       .text('Key Numbers for Your Retirement', 50, currentY);
    
    let y = currentY + 30;
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#000000');
    
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
    
    // Add gap analysis
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
  }

  /**
   * Render personalized summary
   */
  renderSummary(doc, summary) {
    const currentY = 620;
    
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#1e2a45')
       .text('Your Personalized Analysis', 50, currentY);
    
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#000000')
       .text(summary, 50, currentY + 25, {
         width: 500,
         align: 'left'
       });
  }

  /**
   * Render recommendations page
   */
  renderRecommendations(doc, data, projections) {
    // Title
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#1e2a45')
       .text('Recommendations & Next Steps', 50, 50);
    
    let currentY = 100;
    
    // Generate personalized recommendations
    const recommendations = this.generateRecommendations(data, projections);
    
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
      
      currentY += doc.heightOfString(rec.description, {width: 450}) + 25;
    });
  }

  /**
   * Generate personalized recommendations
   */
  generateRecommendations(data, projections) {
    const recommendations = [];
    const { age, income, savings } = data;
    
    // Income gap recommendation
    if (projections.shortfall > 0) {
      const additionalNeeded = projections.shortfall / 0.04; // 4% rule
      const monthlyIncrease = (additionalNeeded / projections.yearsToRetirement) / 12;
      
      recommendations.push({
        title: 'Close Your Income Gap',
        description: `You have a projected retirement income shortfall of $${projections.shortfall.toLocaleString()} annually. Consider increasing your monthly savings by $${monthlyIncrease.toLocaleString(undefined, {maximumFractionDigits: 0})} to bridge this gap.`
      });
    }
    
    // Age-specific advice
    if (age < 35) {
      recommendations.push({
        title: 'Maximize Your Time Advantage',
        description: 'You have decades for compound growth! Focus on maximizing your 401(k) employer match first, then consider a Roth IRA. Even small increases now will have massive impact over time.'
      });
    } else if (age >= 50) {
      recommendations.push({
        title: 'Use Catch-Up Contributions',
        description: 'At 50+, you can make additional catch-up contributions to 401(k) and IRA accounts. This allows extra savings while potentially reducing your current tax burden.'
      });
    }
    
    // Investment strategy
    recommendations.push({
      title: 'Review Your Investment Strategy',
      description: 'Ensure your portfolio matches your risk tolerance and timeline. Consider low-cost index funds for diversification and regular rebalancing to stay on track.'
    });
    
    // Emergency fund check
    const savingsRate = (savings / income) * 100;
    if (savingsRate < 15) {
      recommendations.push({
        title: 'Build Your Financial Foundation',
        description: 'Before aggressive retirement savings, ensure you have 3-6 months of expenses in an emergency fund. This prevents early withdrawal from retirement accounts.'
      });
    }
    
    return recommendations.slice(0, 4);
  }

  /**
   * Render footer
   */
  renderFooter(doc) {
    const footerY = doc.page.height - 60;
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#666666')
       .text('This analysis is for educational purposes. Consult with a financial advisor for personalized advice.', 50, footerY, {
         align: 'center',
         width: doc.page.width - 100
       });
  }
}

// Export for use in N8N or other automation
module.exports = RetirementPDFGenerator;

// For testing/standalone use
if (require.main === module) {
  // Sample form data for testing
  const sampleData = {
    Name: 'Sarah Johnson',
    Age: 42,
    Income: 85000,
    Savings: 250000,
    RetireAge: 62,
    lifestyle: 'comfortable',
    userEmail: 'sarah@example.com',
    userPhone: '+1-555-987-6543',
    summary: 'Based on your current savings trajectory, you are on track for a comfortable retirement. However, increasing your annual contributions by $3,000 would ensure you maintain your desired lifestyle throughout retirement.'
  };

  const generator = new RetirementPDFGenerator();
  const doc = generator.generatePDF(sampleData, 'retirement-analysis.pdf');
  
  doc.on('end', () => {
    console.log('✅ Retirement analysis PDF generated: retirement-analysis.pdf');
  });

  doc.on('error', (err) => {
    console.error('❌ Error:', err);
  });
} 