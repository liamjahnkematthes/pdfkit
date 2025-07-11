/**
 * Resume Template
 */

function resumeTemplate(doc, data) {
  const {
    name = '',
    email = '',
    phone = '',
    summary = '',
    experience = [],
    education = []
  } = data;

  // Header
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .text(name, 50, 50);

  doc.fontSize(12)
     .font('Helvetica')
     .text(`${email} | ${phone}`, 50, 80);

  let currentY = 120;

  // Summary
  if (summary) {
    doc.fontSize(16).font('Helvetica-Bold').text('Summary', 50, currentY);
    currentY += 20;
    doc.fontSize(12).font('Helvetica').text(summary, 50, currentY, { width: 500 });
    currentY += doc.heightOfString(summary, { width: 500 }) + 20;
  }

  // Experience
  if (experience.length > 0) {
    doc.fontSize(16).font('Helvetica-Bold').text('Experience', 50, currentY);
    currentY += 20;
    
    experience.forEach(job => {
      doc.fontSize(14).font('Helvetica-Bold').text(job.title, 50, currentY);
      doc.fontSize(12).font('Helvetica').text(job.company, 300, currentY);
      currentY += 15;
      if (job.description) {
        doc.text(job.description, 50, currentY, { width: 500 });
        currentY += doc.heightOfString(job.description, { width: 500 }) + 15;
      }
    });
  }

  doc.end();
  return doc;
}

module.exports = resumeTemplate; 