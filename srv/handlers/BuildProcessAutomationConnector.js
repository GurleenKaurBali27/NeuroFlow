const fs = require('fs');
const path = require('path');

/**
 * BuildProcessAutomationConnector - Future-ready connector modeling integration 
 * with SAP Build Process Automation (BTP Process API / Destination services).
 */
class BuildProcessAutomationConnector {
  constructor() {
    this.logDirectory = path.join(__dirname, '..', '..', 'shared', 'logs');
    this.logFile = path.join(this.logDirectory, 'btp-spa.log');
    
    // Ensure directory exists
    try {
      if (!fs.existsSync(this.logDirectory)) {
        fs.mkdirSync(this.logDirectory, { recursive: true });
      }
    } catch (e) {
      console.warn('[BuildProcessAutomationConnector] Failed to create shared logs directory:', e.message);
    }
  }

  /**
   * Log Process Automation Trigger Activity (simulates an outbound BTP REST API trigger call)
   * 
   * @param {String} triggerType - Type of activity (e.g. 'Workflow_Step_Approved', 'Workflow_Escalated')
   * @param {Object} context - Structured payload fields representing the workflow variables
   */
  logTrigger(triggerType, context) {
    const timestamp = new Date().toISOString();
    
    // Format BTP SAP Build Process Automation standard trigger context payload
    const spaPayload = {
      definitionId: `neuroflow.processes.incidentremediation.v1.${triggerType}`,
      context: {
        systemId: "NEUROFLOW-CORE-US",
        processInstanceId: `spa-inst-${cds.utils.uuid().substring(0, 8)}`,
        triggerTime: timestamp,
        eventContext: context
      }
    };

    const logEntry = `[${timestamp}] [SPA TRIGGER: ${triggerType}] Payload: ${JSON.stringify(spaPayload, null, 2)}\n\n`;

    console.log(`[SAP Build Process Automation Connector] Outbound trigger compiled and queued: "${triggerType}"`);

    try {
      fs.appendFileSync(this.logFile, logEntry, 'utf8');
      console.log(`[SAP Build Process Automation Connector] Mock trigger successfully logged to: ${this.logFile}`);
    } catch (err) {
      console.error('[SAP Build Process Automation Connector] Error writing to log file:', err.message);
    }
  }
}

module.exports = new BuildProcessAutomationConnector();
