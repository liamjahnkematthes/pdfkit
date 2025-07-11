const invoiceTemplate = require('./invoice');
const reportTemplate = require('./report');
const resumeTemplate = require('./resume');
const letterTemplate = require('./letter');
const contractTemplate = require('./contract');

/**
 * Template registry and utilities
 */
class TemplateRegistry {
  constructor() {
    this.templates = new Map();
    this.loadDefaultTemplates();
  }

  /**
   * Register a template
   */
  register(name, template) {
    this.templates.set(name, template);
    return this;
  }

  /**
   * Get a template by name
   */
  get(name) {
    return this.templates.get(name);
  }

  /**
   * Check if template exists
   */
  has(name) {
    return this.templates.has(name);
  }

  /**
   * List all available templates
   */
  list() {
    return Array.from(this.templates.keys());
  }

  /**
   * Load default templates
   */
  loadDefaultTemplates() {
    this.register('invoice', invoiceTemplate);
    this.register('report', reportTemplate);
    this.register('resume', resumeTemplate);
    this.register('letter', letterTemplate);
    this.register('contract', contractTemplate);
  }

  /**
   * Create a template from a JSON structure
   */
  static fromJSON(json) {
    if (typeof json === 'string') {
      json = JSON.parse(json);
    }
    return json;
  }

  /**
   * Validate template structure
   */
  static validate(template) {
    const errors = [];

    if (!template) {
      errors.push('Template is required');
      return errors;
    }

    if (typeof template === 'function') {
      return errors; // Functions are valid templates
    }

    if (typeof template !== 'object') {
      errors.push('Template must be an object or function');
      return errors;
    }

    // Check for required sections
    if (!template.header && !template.content && !template.footer) {
      errors.push('Template must have at least one section (header, content, or footer)');
    }

    return errors;
  }
}

module.exports = TemplateRegistry; 