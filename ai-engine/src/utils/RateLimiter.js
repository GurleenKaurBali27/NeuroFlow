const logger = require('./Logger');

class RateLimiter {
  constructor() {
    this.initialDelayMs = 1500;
    this.maxAttempts = 3;
  }

  async executeWithRetry(apiCallFn, component = 'RateLimiter') {
    let attempt = 0;

    while (attempt < this.maxAttempts) {
      try {
        return await apiCallFn();
      } catch (err) {
        attempt++;
        const isRateLimit = this.checkIfRateLimited(err);

        if (!isRateLimit || attempt >= this.maxAttempts) {
          throw err;
        }

        // Calculate backoff delay
        const retryAfterSec = this.extractRetryAfterHeader(err);
        let backoffDelay = retryAfterSec ? retryAfterSec * 1000 : this.initialDelayMs * Math.pow(2, attempt);
        // Add random jitter between 0 and 1000ms
        const jitter = Math.random() * 1000;
        backoffDelay += jitter;

        logger.warn(component, `Rate limit hit (Attempt ${attempt}/${this.maxAttempts}). Retrying in ${Math.round(backoffDelay)}ms...`, {
          error: err.message,
          retryAfterHeader: retryAfterSec || 'none'
        });

        await this.sleep(backoffDelay);
      }
    }
  }

  checkIfRateLimited(err) {
    if (!err) return false;
    
    // Check status code or message strings
    const message = (err.message || '').toLowerCase();
    const status = err.statusCode || err.status || 0;

    return (
      status === 429 ||
      message.includes('429') ||
      message.includes('rate limit') ||
      message.includes('too many requests')
    );
  }

  extractRetryAfterHeader(err) {
    if (!err || !err.headers) return null;
    
    // Check standard case-insensitive headers
    const retryAfter = err.headers['retry-after'] || err.headers['Retry-After'];
    if (retryAfter) {
      const parsed = parseInt(retryAfter, 10);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new RateLimiter();
