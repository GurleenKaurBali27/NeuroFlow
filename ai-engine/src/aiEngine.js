const logger = require('./utils/Logger');
const rateLimiter = require('./utils/RateLimiter');
const factory = require('./providers/ProviderFactory');
const templates = require('./prompts/templates');

class AiEngine {
  constructor() {
    this.name = 'NeuroFlow AI Orchestration Engine';
  }

  /**
   * Core orchestration entrypoint to analyze enterprise incidents.
   * Pipes prompt building, rate limiting, and automated failover.
   * 
   * @param {Object} incidentData - Raw incident details from operational logs
   * @param {Object} options - Override configurations (e.g. { provider: 'openai', bypassFailover: false })
   * @returns {Promise<Object>} Analyzed structured decisions
   */
  async analyzeIncident(incidentData, options = {}) {
    logger.info('AiEngine', 'Initializing operational incident analysis...', { incidentTitle: incidentData.title });

    // 1. Build prompt and load instructions
    const systemInstruction = templates.getIncidentSystemInstruction();
    const prompt = templates.buildIncidentPrompt(incidentData);

    // 2. Resolve target primary provider
    let providerName = options.provider || factory.getActiveProviderName();
    let provider = factory.getProvider(providerName);

    logger.info('AiEngine', `Resolved primary provider: ${provider.name}`, { model: provider.modelName });

    try {
      // 3. Execute inference wrapped in universal rate limiter
      const response = await rateLimiter.executeWithRetry(async () => {
        return await provider.generateCompletion(prompt, systemInstruction);
      }, `${provider.name}Limiter`);

      logger.info('AiEngine', `Incident analysis completed successfully using primary provider (${provider.name}).`);
      return response;

    } catch (err) {
      logger.warn('AiEngine', `Primary provider (${provider.name}) failed operational loop: ${err.message}`);

      // 4. Trigger automated provider failover
      if (options.bypassFailover) {
        logger.error('AiEngine', 'Failover bypassed per option parameters. Terminal execution failed.');
        throw err;
      }

      const fallbackProvider = factory.getFallbackProvider();
      logger.warn('AiEngine', `Initiating automated failover loop to secondary provider: ${fallbackProvider.name}...`, {
        model: fallbackProvider.modelName
      });

      try {
        // Execute fallback inference wrapped in rate limiter
        const fallbackResponse = await rateLimiter.executeWithRetry(async () => {
          return await fallbackProvider.generateCompletion(prompt, systemInstruction);
        }, `${fallbackProvider.name}Limiter`);

        logger.info('AiEngine', `Failover query completed successfully using fallback provider (${fallbackProvider.name}).`);
        return fallbackResponse;

      } catch (fallbackErr) {
        logger.error('AiEngine', `Terminal failover error: Secondary provider (${fallbackProvider.name}) also failed.`, {
          primaryError: err.message,
          secondaryError: fallbackErr.message
        });
        throw new Error(`AI Orchestration failure: Primary (${provider.name}) and Fallback (${fallbackProvider.name}) both failed. Cause: ${fallbackErr.message}`);
      }
    }
  }

  /**
   * Scaffold method for backward compatibility
   */
  analyzeSignals(signals) {
    return {
      summary: 'Analysis ready',
      signalCount: signals.length || 0,
      recommendations: []
    };
  }
}

module.exports = new AiEngine();
