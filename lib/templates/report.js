/**
 * Generic Report Template
 */

function reportTemplate(doc, data) {
  const {
    title = 'Report',
    author = '',
    date = new Date().toLocaleDateString(),
    content = []
  } = data;

  // Title
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .text(title, 50, 50);

  // Metadata
  let currentY = 90;
  if (author) {
    doc.fontSize(12).text(`By: ${author}`, 50, currentY);
    currentY += 15;
  }
  doc.text(`Date: ${date}`, 50, currentY);
  currentY += 30;

  // Content
  doc.fontSize(12).font('Helvetica');
  content.forEach(section => {
    if (section.heading) {
      doc.fontSize(16).font('Helvetica-Bold').text(section.heading, 50, currentY);
      currentY += 20;
    }
    if (section.text) {
      doc.fontSize(12).font('Helvetica').text(section.text, 50, currentY, { width: 500 });
      currentY += doc.heightOfString(section.text, { width: 500 }) + 15;
    }
  });

  doc.end();
  return doc;
}

module.exports = reportTemplate; 