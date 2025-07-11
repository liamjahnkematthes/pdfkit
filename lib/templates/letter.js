/**
 * Letter Template
 */

function letterTemplate(doc, data) {
  const {
    date = new Date().toLocaleDateString(),
    recipient = '',
    sender = '',
    subject = '',
    body = '',
    signature = ''
  } = data;

  let currentY = 50;

  // Date
  doc.fontSize(12)
     .font('Helvetica')
     .text(date, 400, currentY);

  currentY += 40;

  // Recipient
  if (recipient) {
    doc.text(recipient, 50, currentY);
    currentY += 40;
  }

  // Subject
  if (subject) {
    doc.font('Helvetica-Bold').text(`Subject: ${subject}`, 50, currentY);
    currentY += 30;
  }

  // Body
  doc.font('Helvetica').text(body, 50, currentY, { width: 500 });
  currentY += doc.heightOfString(body, { width: 500 }) + 30;

  // Signature
  if (signature) {
    doc.text(`Sincerely,\n\n${signature}`, 50, currentY);
  }

  doc.end();
  return doc;
}

module.exports = letterTemplate; 