/**
 * Professional Invoice Template
 * Supports company info, client info, itemized billing, and totals
 */

function invoiceTemplate(doc, data) {
  const {
    company = {},
    client = {},
    invoice = {},
    items = [],
    totals = {},
    notes = ''
  } = data;

  // Header with company info
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor('#1e2a45')
     .text('INVOICE', 50, 50);
  
  // Company info (top right)
  doc.fontSize(10);
  const rightX = doc.page.width - 200;
  let currentY = 50;
  
  if (company.name) {
    doc.font('Helvetica-Bold').text(company.name, rightX, currentY);
    currentY += 15;
  }
  
  doc.font('Helvetica');
  if (company.address) {
    doc.text(company.address, rightX, currentY);
    currentY += 12;
  }
  if (company.phone) {
    doc.text(`Phone: ${company.phone}`, rightX, currentY);
    currentY += 12;
  }
  if (company.email) {
    doc.text(`Email: ${company.email}`, rightX, currentY);
    currentY += 12;
  }

  // Invoice details
  currentY = 120;
  doc.font('Helvetica-Bold').fontSize(12);
  
  if (invoice.number) {
    doc.text(`Invoice #: ${invoice.number}`, 50, currentY);
    currentY += 15;
  }
  if (invoice.date) {
    doc.text(`Date: ${invoice.date}`, 50, currentY);
    currentY += 15;
  }
  if (invoice.dueDate) {
    doc.text(`Due Date: ${invoice.dueDate}`, 50, currentY);
    currentY += 15;
  }

  // Client info
  currentY += 20;
  doc.font('Helvetica-Bold').text('Bill To:', 50, currentY);
  currentY += 15;
  
  doc.font('Helvetica');
  if (client.name) {
    doc.text(client.name, 50, currentY);
    currentY += 12;
  }
  if (client.address) {
    doc.text(client.address, 50, currentY);
    currentY += 12;
  }
  if (client.email) {
    doc.text(client.email, 50, currentY);
    currentY += 12;
  }

  // Items table
  currentY += 30;
  const tableY = currentY;
  const tableHeaders = ['Description', 'Quantity', 'Rate', 'Amount'];
  const columnWidths = [250, 80, 80, 80];
  const startX = 50;
  
  // Table headers
  doc.font('Helvetica-Bold').fontSize(10);
  let x = startX;
  tableHeaders.forEach((header, i) => {
    doc.text(header, x, tableY, { width: columnWidths[i], align: 'left' });
    x += columnWidths[i];
  });
  
  // Header line
  currentY = tableY + 15;
  doc.moveTo(startX, currentY)
     .lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), currentY)
     .stroke();

  // Table rows
  currentY += 10;
  doc.font('Helvetica').fontSize(9);
  
  items.forEach(item => {
    const rowY = currentY;
    x = startX;
    
    doc.text(item.description || '', x, rowY, { width: columnWidths[0], align: 'left' });
    x += columnWidths[0];
    
    doc.text(String(item.quantity || ''), x, rowY, { width: columnWidths[1], align: 'center' });
    x += columnWidths[1];
    
    doc.text(item.rate ? `$${parseFloat(item.rate).toFixed(2)}` : '', x, rowY, { width: columnWidths[2], align: 'right' });
    x += columnWidths[2];
    
    doc.text(item.amount ? `$${parseFloat(item.amount).toFixed(2)}` : '', x, rowY, { width: columnWidths[3], align: 'right' });
    
    currentY += 20;
  });

  // Totals section
  currentY += 20;
  const totalsX = doc.page.width - 200;
  
  doc.font('Helvetica').fontSize(10);
  
  if (totals.subtotal) {
    doc.text('Subtotal:', totalsX, currentY, { width: 80, align: 'right' });
    doc.text(`$${parseFloat(totals.subtotal).toFixed(2)}`, totalsX + 90, currentY, { width: 80, align: 'right' });
    currentY += 15;
  }
  
  if (totals.tax) {
    doc.text('Tax:', totalsX, currentY, { width: 80, align: 'right' });
    doc.text(`$${parseFloat(totals.tax).toFixed(2)}`, totalsX + 90, currentY, { width: 80, align: 'right' });
    currentY += 15;
  }
  
  if (totals.total) {
    doc.font('Helvetica-Bold');
    doc.text('Total:', totalsX, currentY, { width: 80, align: 'right' });
    doc.text(`$${parseFloat(totals.total).toFixed(2)}`, totalsX + 90, currentY, { width: 80, align: 'right' });
    currentY += 20;
  }

  // Notes
  if (notes) {
    currentY += 20;
    doc.font('Helvetica-Bold').fontSize(10).text('Notes:', 50, currentY);
    currentY += 15;
    doc.font('Helvetica').text(notes, 50, currentY, { width: 400 });
  }

  // Footer
  const footerY = doc.page.height - 100;
  doc.fontSize(8)
     .font('Helvetica')
     .text('Thank you for your business!', 50, footerY, { align: 'center', width: doc.page.width - 100 });

  doc.end();
  return doc;
}

module.exports = invoiceTemplate; 