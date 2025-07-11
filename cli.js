#!/usr/bin/env node

const AutoPDFGenerator = require('./lib/auto-pdf-generator');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  showHelp();
  process.exit(1);
}

const command = args[0];

switch (command) {
  case 'retirement':
    generateRetirement(args.slice(1));
    break;
  case 'invoice':
    generateInvoice(args.slice(1));
    break;
  case 'report':
    generateReport(args.slice(1));
    break;
  case 'resume':
    generateResume(args.slice(1));
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}

function generateRetirement(args) {
  const dataFile = args[0];
  const outputFile = args[1] || 'retirement-analysis.pdf';

  if (!dataFile) {
    console.error('Please provide a JSON data file');
    console.log('Usage: node cli.js retirement <data.json> [output.pdf]');
    process.exit(1);
  }

  try {
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    
    console.log('Generating retirement analysis PDF...');
    const doc = AutoPDFGenerator.retirement(data, outputFile);
    
    doc.on('end', () => {
      console.log(`✅ Retirement analysis saved to: ${outputFile}`);
    });

    doc.on('error', (err) => {
      console.error('❌ Error generating PDF:', err.message);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

function generateInvoice(args) {
  const dataFile = args[0];
  const outputFile = args[1] || 'invoice.pdf';

  if (!dataFile) {
    console.error('Please provide a JSON data file');
    console.log('Usage: node cli.js invoice <data.json> [output.pdf]');
    process.exit(1);
  }

  try {
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    
    console.log('Generating invoice PDF...');
    const doc = AutoPDFGenerator.invoice(data, outputFile);
    
    doc.on('end', () => {
      console.log(`✅ Invoice saved to: ${outputFile}`);
    });

    doc.on('error', (err) => {
      console.error('❌ Error generating PDF:', err.message);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

function generateReport(args) {
  const dataFile = args[0];
  const outputFile = args[1] || 'report.pdf';

  if (!dataFile) {
    console.error('Please provide a JSON data file');
    console.log('Usage: node cli.js report <data.json> [output.pdf]');
    process.exit(1);
  }

  try {
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    
    console.log('Generating report PDF...');
    const doc = AutoPDFGenerator.report(data, outputFile);
    
    doc.on('end', () => {
      console.log(`✅ Report saved to: ${outputFile}`);
    });

    doc.on('error', (err) => {
      console.error('❌ Error generating PDF:', err.message);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

function generateResume(args) {
  const dataFile = args[0];
  const outputFile = args[1] || 'resume.pdf';

  if (!dataFile) {
    console.error('Please provide a JSON data file');
    console.log('Usage: node cli.js resume <data.json> [output.pdf]');
    process.exit(1);
  }

  try {
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    
    console.log('Generating resume PDF...');
    const doc = AutoPDFGenerator.resume(data, outputFile);
    
    doc.on('end', () => {
      console.log(`✅ Resume saved to: ${outputFile}`);
    });

    doc.on('error', (err) => {
      console.error('❌ Error generating PDF:', err.message);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
Auto PDF Generator CLI

Usage: node cli.js <command> <data.json> [output.pdf]

Commands:
  retirement <data.json> [output.pdf]  Generate retirement analysis PDF
  invoice <data.json> [output.pdf]     Generate invoice PDF
  report <data.json> [output.pdf]      Generate report PDF
  resume <data.json> [output.pdf]      Generate resume PDF
  help                                 Show this help message

Examples:
  node cli.js retirement client-data.json retirement-report.pdf
  node cli.js invoice invoice-data.json invoice.pdf

Data file format for retirement analysis:
{
  "name": "John Doe",
  "age": 35,
  "income": 75000,
  "savings": 150000,
  "retireAge": 65,
  "lifestyle": "comfortable",
  "email": "john@example.com",
  "phone": "+1-555-123-4567",
  "summary": "Custom analysis summary...",
  "timestamp": "2023-12-01T00:00:00Z"
}
  `);
} 