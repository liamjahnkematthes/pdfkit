const PDFDocument = require('./document');
const fs = require('fs');
const path = require('path');
const TemplateRegistry = require('./templates');

/**
 * AutoPDFGenerator - A high-level API for automatic PDF generation
 * Supports templates, data binding, and common document types
 */
class AutoPDFGenerator {
  constructor(options = {}) {
    this.options = {
      margin: 50,
      fontSize: 12,
      font: 'Helvetica',
      lineHeight: 1.4,
      pageSize: 'LETTER',
      ...options
    };
    
    this.templates = new TemplateRegistry();
    this.styles = new Map();
    this.loadDefaultStyles();
  }

  /**
   * Create a new PDF document
   */
  createDocument(templateName, data = {}, outputPath) {
    const doc = new PDFDocument({
      size: this.options.pageSize,
      margins: {
        top: this.options.margin,
        bottom: this.options.margin,
        left: this.options.margin,
        right: this.options.margin
      }
    });

    if (outputPath) {
      doc.pipe(fs.createWriteStream(outputPath));
    }

    if (templateName && this.templates.has(templateName)) {
      this.renderTemplate(doc, templateName, data);
    }

    return doc;
  }

  /**
   * Register a new template
   */
  registerTemplate(name, template) {
    this.templates.register(name, template);
    return this;
  }

  /**
   * Register a new style
   */
  registerStyle(name, style) {
    this.styles.set(name, style);
    return this;
  }

  /**
   * Get a registered style
   */
  getStyle(name) {
    return this.styles.get(name) || {};
  }

  /**
   * Apply a style to the document
   */
  applyStyle(doc, styleName) {
    const style = this.getStyle(styleName);
    
    if (style.font) doc.font(style.font);
    if (style.fontSize) doc.fontSize(style.fontSize);
    if (style.fillColor) doc.fillColor(style.fillColor);
    if (style.strokeColor) doc.strokeColor(style.strokeColor);
    
    return doc;
  }

  /**
   * Render a template with data
   */
  renderTemplate(doc, templateName, data) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    if (typeof template === 'function') {
      template.call(this, doc, data);
    } else {
      this.renderTemplateObject(doc, template, data);
    }

    return doc;
  }

  /**
   * Render a template object structure
   */
  renderTemplateObject(doc, template, data) {
    if (template.header) {
      this.renderSection(doc, template.header, data);
    }

    if (template.content) {
      this.renderSection(doc, template.content, data);
    }

    if (template.footer) {
      this.renderSection(doc, template.footer, data);
    }

    return doc;
  }

  /**
   * Render a section of content
   */
  renderSection(doc, section, data) {
    if (Array.isArray(section)) {
      section.forEach(item => this.renderElement(doc, item, data));
    } else {
      this.renderElement(doc, section, data);
    }
  }

  /**
   * Render an individual element
   */
  renderElement(doc, element, data) {
    const { type, style, content, ...props } = element;

    // Apply style if specified
    if (style) {
      this.applyStyle(doc, style);
    }

    switch (type) {
      case 'text':
        this.renderText(doc, content, data, props);
        break;
      case 'heading':
        this.renderHeading(doc, content, data, props);
        break;
      case 'image':
        this.renderImage(doc, content, props);
        break;
      case 'table':
        this.renderTable(doc, content, data, props);
        break;
      case 'list':
        this.renderList(doc, content, data, props);
        break;
      case 'line':
        this.renderLine(doc, props);
        break;
      case 'spacer':
        this.renderSpacer(doc, props);
        break;
      default:
        console.warn(`Unknown element type: ${type}`);
    }
  }

  /**
   * Render text with data interpolation
   */
  renderText(doc, content, data, options = {}) {
    const text = this.interpolateText(content, data);
    doc.text(text, options);
    return doc;
  }

  /**
   * Render heading text
   */
  renderHeading(doc, content, data, options = {}) {
    const level = options.level || 1;
    const fontSize = this.options.fontSize + (6 - level) * 2;
    
    doc.fontSize(fontSize)
       .font('Helvetica-Bold')
       .text(this.interpolateText(content, data), options)
       .font(this.options.font)
       .fontSize(this.options.fontSize);
    
    return doc;
  }

  /**
   * Render an image
   */
  renderImage(doc, imagePath, options = {}) {
    if (fs.existsSync(imagePath)) {
      doc.image(imagePath, options);
    } else {
      console.warn(`Image not found: ${imagePath}`);
    }
    return doc;
  }

  /**
   * Render a simple table
   */
  renderTable(doc, tableData, data, options = {}) {
    const processedData = this.interpolateData(tableData, data);
    
    if (!processedData.headers || !processedData.rows) {
      console.warn('Table data must have headers and rows');
      return doc;
    }

    // Simple table rendering - can be enhanced with table mixin
    const startY = doc.y;
    const startX = options.x || doc.page.margins.left;
    const columnWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / processedData.headers.length;

    // Render headers
    doc.font('Helvetica-Bold');
    processedData.headers.forEach((header, i) => {
      doc.text(header, startX + i * columnWidth, startY, {
        width: columnWidth,
        align: 'left'
      });
    });

    let currentY = startY + 20;
    doc.font(this.options.font);

    // Render rows
    processedData.rows.forEach(row => {
      row.forEach((cell, i) => {
        doc.text(String(cell), startX + i * columnWidth, currentY, {
          width: columnWidth,
          align: 'left'
        });
      });
      currentY += 20;
    });

    doc.y = currentY;
    return doc;
  }

  /**
   * Render a list
   */
  renderList(doc, items, data, options = {}) {
    const processedItems = this.interpolateData(items, data);
    const listType = options.type || 'bullet';
    
    doc.list(processedItems, options.x, options.y, {
      bulletRadius: 2,
      listType: listType,
      ...options
    });
    
    return doc;
  }

  /**
   * Render a horizontal line
   */
  renderLine(doc, options = {}) {
    const y = options.y || doc.y;
    const startX = options.startX || doc.page.margins.left;
    const endX = options.endX || (doc.page.width - doc.page.margins.right);
    
    doc.moveTo(startX, y)
       .lineTo(endX, y)
       .stroke();
    
    return doc;
  }

  /**
   * Render vertical spacing
   */
  renderSpacer(doc, options = {}) {
    const height = options.height || 20;
    doc.moveDown(height / doc.currentLineHeight());
    return doc;
  }

  /**
   * Interpolate text with data placeholders
   */
  interpolateText(text, data) {
    if (typeof text !== 'string') return text;
    
    return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const value = this.getNestedValue(data, key.trim());
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Interpolate data structures recursively
   */
  interpolateData(obj, data) {
    if (typeof obj === 'string') {
      return this.interpolateText(obj, data);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.interpolateData(item, data));
    }
    
    if (obj && typeof obj === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.interpolateData(value, data);
      }
      return result;
    }
    
    return obj;
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Load default styles
   */
  loadDefaultStyles() {
    this.registerStyle('title', {
      font: 'Helvetica-Bold',
      fontSize: 24,
      fillColor: '#333333'
    });

    this.registerStyle('subtitle', {
      font: 'Helvetica-Bold',
      fontSize: 18,
      fillColor: '#666666'
    });

    this.registerStyle('heading', {
      font: 'Helvetica-Bold',
      fontSize: 16,
      fillColor: '#333333'
    });

    this.registerStyle('body', {
      font: 'Helvetica',
      fontSize: 12,
      fillColor: '#000000'
    });

    this.registerStyle('caption', {
      font: 'Helvetica',
      fontSize: 10,
      fillColor: '#666666'
    });

    this.registerStyle('highlight', {
      font: 'Helvetica-Bold',
      fontSize: 12,
      fillColor: '#0066cc'
    });
  }

  /**
   * Quick method to generate common document types
   */
  static invoice(data, outputPath) {
    const generator = new AutoPDFGenerator();
    return generator.createDocument('invoice', data, outputPath);
  }

  static report(data, outputPath) {
    const generator = new AutoPDFGenerator();
    return generator.createDocument('report', data, outputPath);
  }

  static resume(data, outputPath) {
    const generator = new AutoPDFGenerator();
    return generator.createDocument('resume', data, outputPath);
  }

  static retirement(data, outputPath) {
    const generator = new AutoPDFGenerator();
    return generator.createDocument('retirement', data, outputPath);
  }

  /**
   * Generate an invoice
   */
  createInvoice(data, outputPath) {
    const doc = this.createDocument('invoice', data, outputPath);
    return doc;
  }

  /**
   * Generate a report
   */
  createReport(data, outputPath) {
    const doc = this.createDocument('report', data, outputPath);
    return doc;
  }

  /**
   * Generate a resume
   */
  createResume(data, outputPath) {
    const doc = this.createDocument('resume', data, outputPath);
    return doc;
  }

  /**
   * Generate a retirement analysis
   */
  createRetirement(data, outputPath) {
    const doc = this.createDocument('retirement', data, outputPath);
    return doc;
  }
}

module.exports = AutoPDFGenerator; 