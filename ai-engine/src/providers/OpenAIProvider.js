const BaseProvider = require('./BaseProvider');
const logger = require('../utils/Logger');

class OpenAIProvider extends BaseProvider {
  constructor() {
    super('OpenAI');
    this.modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  async generateCompletion(prompt, systemInstruction) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not defined');
    }

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    };

    const requestBody = {
      model: this.modelName,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    };

    logger.info('OpenAIProvider', `Dispatching query to ${this.modelName} (temperature: 0.2)...`);

    const result = await this._makeRequest(options, requestBody);
    
    // Parse response
    const resBody = JSON.parse(result.body);
    const textOutput = resBody.choices?.[0]?.message?.content;
    
    if (!textOutput) {
      throw new Error(`Invalid or empty response from OpenAI API: ${result.body}`);
    }

    // Capture token metadata
    const usage = resBody.usage || {};
    const tokens = {
      prompt: usage.prompt_tokens || 0,
      completion: usage.completion_tokens || 0,
      total: usage.total_tokens || 0
    };

    logger.telemetry('OpenAIProvider', 'Inference telemetry captured successfully', {
      latencyMs: result.latency,
      promptTokens: tokens.prompt,
      completionTokens: tokens.completion,
      totalTokens: tokens.total,
      model: this.modelName
    });

    // Parse the JSON result returned by OpenAI
    return JSON.parse(textOutput.trim());
  }
}

module.exports = OpenAIProvider;
