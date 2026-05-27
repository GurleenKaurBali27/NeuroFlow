const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
  const { Workflows, WorkflowSteps, WorkflowAudits, Incidents, Notifications } = this.entities;

  // 1. AI-triggered workflow routing on incident creation
  this.before('CREATE', 'Incidents', async (req) => {
    const incident = req.data;
    console.log(`[AI Router] Intercepted incident creation: "${incident.title}". Severity: ${incident.priority}`);

    // If it's a High or Critical incident, auto-route a new workflow with SLA and approvals!
    if (incident.priority === 'HIGH' || incident.priority === 'CRITICAL') {
      const workflowId = cds.utils.uuid();
      console.log(`[AI Router] Critical incident detected! dynamic routing triggered. Auto-provisioning Workflow: ${workflowId}`);

      // Calculate SLA: 60 seconds from now for fast local HUD demonstration!
      const now = new Date();
      const deadline = new Date(now.getTime() + 60000); // 60 seconds deadline

      // Create workflow
      await cds.transaction(req).run(INSERT.into(Workflows).entries({
        ID: workflowId,
        name: `AI-Orchestrated: ${incident.title.substring(0, 30)}`,
        status: 'PENDING_APPROVAL',
        priority: incident.priority,
        progress: 10,
        incident_ID: incident.ID,
        department_ID: incident.department_ID || 'dept-0000-0000-0000-000000000001', // default to IT Ops
        slaDuration: 60,
        slaStartedAt: now.toISOString(),
        slaDeadline: deadline.toISOString(),
        slaStatus: 'WITHIN_SLA',
        assignedRole: 'MANAGER'
      }));

      // Create workflow steps
      await cds.transaction(req).run(INSERT.into(WorkflowSteps).entries([
        {
          ID: cds.utils.uuid(),
          workflow_ID: workflowId,
          stepSequence: 1,
          name: "Assess Incident Severity & Diagnostics",
          status: "DONE",
          description: "AI engine evaluated log files and formulated recommendation."
        },
        {
          ID: cds.utils.uuid(),
          workflow_ID: workflowId,
          stepSequence: 2,
          name: "Manager Approval Flow",
          status: "PENDING",
          description: "Requires operational approval before launching remediation playbook."
        },
        {
          ID: cds.utils.uuid(),
          workflow_ID: workflowId,
          stepSequence: 3,
          name: "Deploy Remediation & Recover Node",
          status: "PENDING",
          description: "Remediation script execution and health check."
        }
      ]));

      // Create initial audit trail
      await cds.transaction(req).run(INSERT.into(WorkflowAudits).entries({
        ID: cds.utils.uuid(),
        workflow_ID: workflowId,
        action: 'STATUS_CHANGE',
        actor: 'AI_ORCHESTRATOR',
        details: `Dynamic workflow instantiated automatically based on high-severity incident: ${incident.title}`,
        timestamp: now.toISOString()
      }));

      console.log(`[AI Router] Workflow successfully provisioned with steps, SLA deadlines, and manager assignments.`);
    }
  });

  // 2. Custom action: Approve/Reject Step
  this.on('approveStep', async (req) => {
    const { workflowId, notes, approved } = req.data;
    console.log(`[Workflow Engine] Action approveStep invoked. Workflow: ${workflowId}, Approved: ${approved}, Notes: ${notes}`);

    const tx = cds.transaction(req);

    // Retrieve active workflow
    const wf = await tx.run(SELECT.one.from(Workflows).where({ ID: workflowId }));
    if (!wf) return req.error(404, `Workflow ${workflowId} not found.`);

    const now = new Date().toISOString();

    if (approved) {
      // 1. Advance steps: Complete Step 2, and start Step 3!
      await tx.run(UPDATE(WorkflowSteps).set({ status: 'DONE' }).where({ workflow_ID: workflowId, stepSequence: 2 }));
      await tx.run(UPDATE(WorkflowSteps).set({ status: 'PROCESSING' }).where({ workflow_ID: workflowId, stepSequence: 3 }));

      // 2. Transition Workflow State to Running & Progress to 60%
      await tx.run(UPDATE(Workflows).set({
        status: 'RUNNING',
        progress: 60,
        approvalNotes: notes
      }).where({ ID: workflowId }));

      // 3. Write Audit Trail
      await tx.run(INSERT.into(WorkflowAudits).entries({
        ID: cds.utils.uuid(),
        workflow_ID: workflowId,
        action: 'APPROVAL',
        actor: 'OPERATIONAL_MANAGER',
        details: `Manager approved step sequence 2. Notes: ${notes || 'None'}. Advancing remediation step.`,
        timestamp: now
      }));

      // Trigger mock SAP Build Process Automation trigger logging
      const btpConnector = require('./handlers/BuildProcessAutomationConnector');
      btpConnector.logTrigger('Workflow_Step_Approved', {
        workflowId: workflowId,
        workflowName: wf.name,
        actor: 'OPERATIONAL_MANAGER',
        notes: notes,
        action: 'APPROVED'
      });

      console.log(`[Workflow Engine] Step approved. Advancing executing node.`);
    } else {
      // Step rejected -> Fail Workflow
      await tx.run(UPDATE(WorkflowSteps).set({ status: 'FAILED' }).where({ workflow_ID: workflowId, stepSequence: 2 }));
      await tx.run(UPDATE(Workflows).set({
        status: 'FAILED',
        progress: 100,
        approvalNotes: `REJECTED: ${notes}`
      }).where({ ID: workflowId }));

      // Write Audit Trail
      await tx.run(INSERT.into(WorkflowAudits).entries({
        ID: cds.utils.uuid(),
        workflow_ID: workflowId,
        action: 'APPROVAL',
        actor: 'OPERATIONAL_MANAGER',
        details: `Manager rejected step sequence 2. Notes: ${notes || 'None'}. Failing workflow execution.`,
        timestamp: now
      }));

      const btpConnector = require('./handlers/BuildProcessAutomationConnector');
      btpConnector.logTrigger('Workflow_Step_Rejected', {
        workflowId: workflowId,
        workflowName: wf.name,
        actor: 'OPERATIONAL_MANAGER',
        notes: notes,
        action: 'REJECTED'
      });
    }

    // Return the updated workflow
    const updatedWf = await tx.run(SELECT.one.from(Workflows).where({ ID: workflowId }));
    return updatedWf;
  });

  // 3. Custom action: Escalate Workflow
  this.on('escalateWorkflow', async (req) => {
    const { workflowId, reason } = req.data;
    console.log(`[Workflow Engine] Action escalateWorkflow invoked. Workflow: ${workflowId}, Reason: ${reason}`);

    const tx = cds.transaction(req);

    const wf = await tx.run(SELECT.one.from(Workflows).where({ ID: workflowId }));
    if (!wf) return req.error(404, `Workflow ${workflowId} not found.`);

    const now = new Date().toISOString();

    // Determine escalate assignment (e.g. Department Head)
    const escalatedTo = 'John Smith (AI Eng Head)';

    // Update workflow status to ESCALATED
    await tx.run(UPDATE(Workflows).set({
      status: 'ESCALATED',
      escalatedTo: escalatedTo,
      priority: 'CRITICAL',
      assignedRole: 'VP_OPERATIONS'
    }).where({ ID: workflowId }));

    // Write Audit Trail
    await tx.run(INSERT.into(WorkflowAudits).entries({
      ID: cds.utils.uuid(),
      workflow_ID: workflowId,
      action: 'ESCALATION',
      actor: 'OPERATIONS_MONITOR',
      details: `Workflow escalated to ${escalatedTo}. Reason: ${reason || 'Manual escalation triggered.'}`,
      timestamp: now
    }));

    // Trigger mock SAP Build Process Automation trigger logging
    const btpConnector = require('./handlers/BuildProcessAutomationConnector');
    btpConnector.logTrigger('Workflow_Escalated', {
      workflowId: workflowId,
      workflowName: wf.name,
      actor: 'OPERATIONS_MONITOR',
      escalatedTo: escalatedTo,
      reason: reason
    });

    console.log(`[Workflow Engine] Workflow escalated to VP Level.`);

    const updatedWf = await tx.run(SELECT.one.from(Workflows).where({ ID: workflowId }));
    return updatedWf;
  });
});
