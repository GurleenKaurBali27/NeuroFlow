class PromptTemplates {
  /**
   * System role instructions specifying constraints, enums, and output format.
   */
  getIncidentSystemInstruction() {
    return `You are the core NeuroFlow AI Orchestration engine. You analyze enterprise system incidents and provide structured, operational decision support.

You MUST respond strictly with a valid JSON object matching this schema:
{
  "severityScore": 1 to 10 (integer representing operational severity),
  "businessImpact": "Clear description of the immediate and secondary effects on business services and SLA compliance",
  "workflowRecommendation": ["Array", "Of", "Specific", "Actions", "To", "Execute", "In", "Order"],
  "anomalyExplanation": "Root cause analysis detailing the patterns, anomalies, or system metrics responsible for the incident",
  "escalationPath": "Specific team, group, or tier (e.g. L1 Ops, L2 Security, L3 AI Engineering) that should handle this if automated steps fail"
}

Constraints:
1. Do not wrap the JSON output in markdown block wrappers (no \`\`\`json ... \`\`\`). Output only the raw JSON.
2. Select actionable, realistic steps for 'workflowRecommendation'.
3. Use professional, analytical enterprise-grade language.`;
  }

  /**
   * Builds the formatted user prompt inject with incident details.
   */
  buildIncidentPrompt(incident) {
    const title = incident.title || 'Untitled Incident';
    const description = incident.description || 'No description provided';
    const priority = incident.priority || 'MEDIUM';
    const status = incident.status || 'NEW';
    const department = incident.department?.name || incident.department || 'Unknown Department';
    const vendor = incident.vendor?.name || incident.vendor || 'Unknown Vendor';
    
    // Inject system health telemetry context if available
    const telemetryContext = incident.telemetry 
      ? `\nSystem Health Context:\n- CPU Usage: ${incident.telemetry.cpuUsage || 'N/A'}%\n- Memory Usage: ${incident.telemetry.memoryUsage || 'N/A'}%\n- Node Status: ${incident.telemetry.nodeStatus || 'N/A'}`
      : '';

    return `Please analyze the following enterprise system incident:

Incident Details:
- Title: ${title}
- Priority: ${priority}
- Current Status: ${status}
- Department Impact: ${department}
- Associated Vendor: ${vendor}
- Description: ${description}${telemetryContext}

Provide the severity assessment, business impact analysis, recommended recovery workflow steps, anomaly explanation, and proper escalation tier.`;
  }
}

module.exports = new PromptTemplates();
