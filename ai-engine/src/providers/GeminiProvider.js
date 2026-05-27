const BaseProvider = require('./BaseProvider');
const logger = require('../utils/Logger');

class GeminiProvider extends BaseProvider {
  constructor() {
    super('Gemini');
    this.modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  }

  async generateCompletion(prompt, systemInstruction) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not defined');
    }

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/${this.modelName}:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const requestBody = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    };

    logger.info('GeminiProvider', `Dispatching query to ${this.modelName} (temperature: 0.2)...`);

    const result = await this._makeRequest(options, requestBody);
    
    // Parse response
    const resBody = JSON.parse(result.body);
    const textOutput = resBody.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textOutput) {
      throw new Error(`Invalid or empty response from Gemini API: ${result.body}`);
    }

    // Capture token metadata if present
    const usage = resBody.usageMetadata || {};
    const tokens = {
      prompt: usage.promptTokenCount || 0,
      completion: usage.candidatesTokenCount || 0,
      total: usage.totalTokenCount || 0
    };

    logger.telemetry('GeminiProvider', 'Inference telemetry captured successfully', {
      latencyMs: result.latency,
      promptTokens: tokens.prompt,
      completionTokens: tokens.completion,
      totalTokens: tokens.total,
      model: this.modelName
    });

    // Parse the JSON result returned by Gemini
    return JSON.parse(textOutput.trim());
  }
}

module.exports = GeminiProvider;
