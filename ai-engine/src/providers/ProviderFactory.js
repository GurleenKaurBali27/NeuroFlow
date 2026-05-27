const logger = require('../utils/Logger');
const GeminiProvider = require('./GeminiProvider');
const OpenAIProvider = require('./OpenAIProvider');

class ProviderFactory {
  constructor() {
    this.providers = {};
  }

  getProvider(name) {
    const key = name.toLowerCase();
    
    if (this.providers[key]) {
      return this.providers[key];
    }

    if (key === 'gemini') {
      this.providers[key] = new GeminiProvider();
    } else if (key === 'openai') {
      this.providers[key] = new OpenAIProvider();
    } else {
      throw new Error(`Unsupported AI provider: ${name}`);
    }

    return this.providers[key];
  }

  /**
   * Resolves the primary active provider based on configuration
   */
  getActiveProviderName() {
    const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
    return provider === 'openai' ? 'openai' : 'gemini';
  }

  getActiveProvider() {
    const name = this.getActiveProviderName();
    return this.getProvider(name);
  }

  /**
   * Resolves the secondary backup provider in case of failover
   */
  getFallbackProvider() {
    const primaryName = this.getActiveProviderName();
    const fallbackName = primaryName === 'gemini' ? 'openai' : 'gemini';
    return this.getProvider(fallbackName);
  }
}

module.exports = new ProviderFactory();
