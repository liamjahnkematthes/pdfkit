/**
 * Contract Template
 */

function contractTemplate(doc, data) {
  const {
    title = 'Contract',
    parties = [],
    terms = [],
    date = new Date().toLocaleDateString()
  } = data;

  // Title
  doc.fontSize(20)
     .font('Helvetica-Bold')
     .text(title, 50, 50, { align: 'center', width: 500 });

  let currentY = 100;

  // Parties
  doc.fontSize(16).font('Helvetica-Bold').text('Parties', 50, currentY);
  currentY += 20;
  
  parties.forEach(party => {
    doc.fontSize(12).font('Helvetica').text(party, 50, currentY);
    currentY += 15;
  });

  currentY += 20;

  // Terms
  doc.fontSize(16).font('Helvetica-Bold').text('Terms and Conditions', 50, currentY);
  currentY += 20;

  terms.forEach((term, index) => {
    doc.fontSize(12).font('Helvetica').text(`${index + 1}. ${term}`, 50, currentY, { width: 500 });
    currentY += doc.heightOfString(`${index + 1}. ${term}`, { width: 500 }) + 10;
  });

  // Signature lines
  currentY += 40;
  doc.moveTo(50, currentY).lineTo(200, currentY).stroke();
  doc.text('Date', 50, currentY + 10);
  doc.moveTo(300, currentY).lineTo(450, currentY).stroke();
  doc.text('Signature', 300, currentY + 10);

  doc.end();
  return doc;
}

module.exports = contractTemplate; 