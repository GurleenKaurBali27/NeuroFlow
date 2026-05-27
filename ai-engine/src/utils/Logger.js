const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '..', '..', 'logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (e) {
      // Fallback silently if disk is read-only
    }
  }

  log(level, component, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(metadata).length ? ` | Meta: ${JSON.stringify(metadata)}` : '';
    const consoleMsg = `[${timestamp}] [AI-${level.toUpperCase()}] [${component}] ${message}${metaStr}`;
    
    // Print to console
    if (level === 'error') {
      console.error('\x1b[31m%s\x1b[0m', consoleMsg);
    } else if (level === 'warn') {
      console.warn('\x1b[33m%s\x1b[0m', consoleMsg);
    } else if (level === 'telemetry') {
      console.log('\x1b[36m%s\x1b[0m', consoleMsg);
    } else {
      console.log('\x1b[32m%s\x1b[0m', consoleMsg);
    }

    // Write to a persistent log file
    try {
      const logEntry = JSON.stringify({ timestamp, level, component, message, metadata }) + '\n';
      fs.appendFileSync(path.join(this.logDir, 'ai-engine.log'), logEntry, 'utf8');
    } catch (e) {
      // Ignore disk errors
    }
  }

  info(component, message, metadata) {
    this.log('info', component, message, metadata);
  }

  warn(component, message, metadata) {
    this.log('warn', component, message, metadata);
  }

  error(component, message, metadata) {
    this.log('error', component, message, metadata);
  }

  telemetry(component, message, metadata) {
    this.log('telemetry', component, message, metadata);
  }
}

module.exports = new Logger();
