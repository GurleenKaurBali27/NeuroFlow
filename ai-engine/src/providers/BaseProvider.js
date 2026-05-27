const https = require('https');
const logger = require('../utils/Logger');

class BaseProvider {
  constructor(name) {
    this.name = name;
  }

  /**
   * Abstract completion method - must be implemented by subclasses
   */
  async generateCompletion(prompt, systemInstruction) {
    throw new Error(`Method 'generateCompletion' must be implemented by provider '${this.name}'`);
  }

  /**
   * Helper to perform raw HTTPS requests centrally
   */
  _makeRequest(options, requestBody) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          const latency = Date.now() - startTime;
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: responseData,
              latency
            });
          } else {
            // Include status code and headers in error for RateLimiter extraction
            const error = new Error(`API returned HTTP ${res.statusCode}: ${responseData}`);
            error.statusCode = res.statusCode;
            error.headers = res.headers;
            reject(error);
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('API request timed out'));
      });

      // Set timeout (15 seconds standard)
      req.setTimeout(15000);

      if (requestBody) {
        req.write(JSON.stringify(requestBody));
      }
      
      req.end();
    });
  }
}

module.exports = BaseProvider;
