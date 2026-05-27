const cds = require('@sap/cds');
const express = require('express');
require('dotenv').config();

cds.on('bootstrap', app => {
  // JSON parsing middleware
  app.use(express.json());

  // Cache control middleware for frontend assets
  // Prevent stale JavaScript modules from being served
  app.use((req, res, next) => {
    // Cache busting for all UI5 module files
    if (req.path.endsWith('.js') || req.path.endsWith('.css') || req.path.endsWith('.xml')) {
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
    }
    next();
  });

  // Health check endpoint for monitoring
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // Debug endpoint to verify module loading
  app.get('/api/debug/modules', (req, res) => {
    res.json({
      loadedModules: Object.keys(require.cache).length,
      timestamp: new Date().toISOString(),
      cacheControl: 'enabled'
    });
  });
});

cds.on('listening', ({ server }) => {
  console.log('[Socket.IO] Bootstrap started. Loading Socket.IO...');
  const io = require('socket.io')(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Bind the EventBus
  const eventBus = require('./handlers/EventBus');
  eventBus.init(io);

  // Setup connection logs
  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected! Socket ID: ${socket.id}`);
    
    // Send initial handshake configuration
    socket.emit('handshake', {
      connected: true,
      timestamp: new Date().toISOString(),
      meshReady: true
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected. Socket ID: ${socket.id}`);
    });
  });

  // --- Premium Operational Storytelling Simulation State Machine ---
  let currentPhase = 'STATE_NORMAL'; // STATE_NORMAL, STATE_WARNING, STATE_CRITICAL, STATE_RECOVERY, STATE_STABLE
  let phaseTicks = 0;
  let cpu = 32;
  let memory = 54;
  let incidents = 0;
  let latencyVal = 108;
  let errorsVal = 0;
  let throughputVal = 840;
  let currentWorkflowId = null;

  // Purge and pre-seed active database workflows immediately on boot for perfect OData synchronization
  (async () => {
    try {
      console.log('[Operational Engine] Purging database tables for pristine demonstration cycle...');
      await cds.run(DELETE.from('neuroflow.Incident'));
      await cds.run(DELETE.from('neuroflow.Workflow'));
      await cds.run(DELETE.from('neuroflow.WorkflowStep'));
      await cds.run(DELETE.from('neuroflow.WorkflowAudit'));

      console.log('[Operational Engine] Pre-seeding baseline workflows into database...');
      const now = new Date().toISOString();
      await cds.run(INSERT.into('neuroflow.Workflow').entries([
        {
          ID: "wf-1",
          name: "Ingest Pipeline",
          status: "RUNNING",
          priority: "MEDIUM",
          progress: 42,
          assignedRole: "Team A",
          slaDuration: 120,
          slaStartedAt: now,
          slaStatus: "WITHIN_SLA"
        },
        {
          ID: "wf-2",
          name: "Analytics ETL",
          status: "QUEUED",
          priority: "LOW",
          progress: 0,
          assignedRole: "Team B",
          slaDuration: 180,
          slaStartedAt: now,
          slaStatus: "WITHIN_SLA"
        },
        {
          ID: "wf-3",
          name: "Anomaly Detection",
          status: "RUNNING",
          priority: "HIGH",
          progress: 78,
          assignedRole: "Team C",
          slaDuration: 120,
          slaStartedAt: now,
          slaStatus: "WITHIN_SLA"
        }
      ]));
      console.log('[Operational Engine] Baseline workflows pre-seeded successfully ✓');
    } catch (err) {
      console.warn('[Operational Engine] Startup database sync warning:', err.message);
    }
  })();

  // Tick interval running every 2 seconds (1 operational cycle tick)
  setInterval(async () => {
    phaseTicks++;

    // 1. Process Scenario State Transitions & Telemetry Calculations
    switch (currentPhase) {
      case 'STATE_NORMAL':
        // Steady-state operations, clean telemetry with minor natural jitter
        cpu = Math.round(32 + (Math.random() * 4 - 2));
        memory = Math.round(54 + (Math.random() * 2 - 1));
        latencyVal = Math.round(108 + (Math.random() * 8 - 4));
        errorsVal = 0;
        throughputVal = Math.round(840 + (Math.random() * 20 - 10));
        incidents = 0;

        if (phaseTicks >= 15) { // 30 seconds
          currentPhase = 'STATE_WARNING';
          phaseTicks = 0;
          console.log('[Scenario Transition] STATE_NORMAL -> STATE_WARNING');
        }
        break;

      case 'STATE_WARNING':
        // Core dispatcher congestion, gradual degradation of telemetry
        cpu = Math.round(62 + (Math.random() * 6 - 3));
        memory = Math.round(71 + (Math.random() * 4 - 2));
        latencyVal = Math.round(165 + (Math.random() * 15 - 7));
        errorsVal = Math.random() > 0.6 ? 1 : 0;
        throughputVal = Math.round(760 + (Math.random() * 30 - 15));
        incidents = 0;

        if (phaseTicks >= 10) { // 20 seconds
          currentPhase = 'STATE_CRITICAL';
          phaseTicks = 0;
          console.log('[Scenario Transition] STATE_WARNING -> STATE_CRITICAL');
        }
        break;

      case 'STATE_CRITICAL':
        // Memory partition breach, massive response latency surge, incident generated
        cpu = Math.round(91 + (Math.random() * 4 - 2));
        memory = Math.round(89 + (Math.random() * 3 - 1));
        latencyVal = Math.round(445 + (Math.random() * 35 - 17));
        errorsVal = Math.round(14 + (Math.random() * 4 - 2));
        throughputVal = Math.round(410 + (Math.random() * 25 - 12));
        incidents = 1;

        // Trigger database auto-orchestrated pipeline on phase entry
        if (phaseTicks === 1) {
          try {
            console.log('[Scenario Action] Generating high-priority Incident and auto-routing Workflow...');
            const incidentId = cds.utils.uuid();
            currentWorkflowId = cds.utils.uuid();

            // Insert Incident
            await cds.run(INSERT.into('neuroflow.Incident').entries({
              ID: incidentId,
              title: "Inference Cluster VRAM partition memory leak",
              description: "Critically high heap accumulation causing thread dispatch lock on GPU worker node core-3.",
              priority: 'HIGH',
              status: 'NEW'
            }));

            // Force override the generated Workflow IDs in db to sync OData triggers
            const now = new Date();
            const deadline = new Date(now.getTime() + 60000); // 60s SLA

            // We let the neuroflow-service handler create the actual Workflow during before-Incident trigger,
            // but we fetch it to capture the generated ID!
            setTimeout(async () => {
              try {
                const wfs = await cds.run(SELECT.from('neuroflow.Workflow').where({ incident_ID: incidentId }));
                if (wfs && wfs.length > 0) {
                  currentWorkflowId = wfs[0].ID;
                  console.log(`[Scenario Engine] Captured auto-orchestrated Workflow ID: ${currentWorkflowId}`);
                  
                  // Publish workflow update immediately to Socket.IO
                  eventBus.publish('workflow_update', {
                    id: currentWorkflowId,
                    name: wfs[0].name,
                    status: 'PENDING_APPROVAL',
                    progress: 10,
                    owner: 'MANAGER',
                    updatedAt: now.toISOString()
                  });
                }
              } catch (fetchErr) {
                console.error('[Scenario Engine] Failed to fetch auto-generated workflow:', fetchErr.message);
              }
            }, 1000);

          } catch (dbErr) {
            console.error('[Scenario Engine] Error inserting Incident:', dbErr.message);
          }
        }

        // Safety timeout fallback: if operational engineer fails to approve step within 25 ticks (50 seconds),
        // we trigger automatic escalation and recovery to keep the cockpit live
        if (phaseTicks >= 25) {
          console.log('[Scenario Engine] Critical phase timeout reached. Triggering automatic fallback recovery.');
          currentPhase = 'STATE_RECOVERY';
          phaseTicks = 0;
        }
        break;

      case 'STATE_RECOVERY':
        // Active remediation cycle deployed, metrics receding cleanly
        cpu = Math.round(54 - (phaseTicks * 2.5) + (Math.random() * 4 - 2));
        memory = Math.round(66 - (phaseTicks * 1.5) + (Math.random() * 2 - 1));
        latencyVal = Math.round(210 - (phaseTicks * 12) + (Math.random() * 10 - 5));
        errorsVal = Math.max(0, Math.round(3 - (phaseTicks * 0.5)));
        throughputVal = Math.round(640 + (phaseTicks * 30) + (Math.random() * 20 - 10));
        incidents = 0;

        // Limit metrics bounds
        cpu = Math.max(30, cpu);
        memory = Math.max(50, memory);
        latencyVal = Math.max(90, latencyVal);
        throughputVal = Math.min(880, throughputVal);

        if (phaseTicks >= 8) { // 16 seconds
          currentPhase = 'STATE_STABLE';
          phaseTicks = 0;
          console.log('[Scenario Transition] STATE_RECOVERY -> STATE_STABLE');
        }
        break;

      case 'STATE_STABLE':
        // Systems stabilized, thread allocations optimal
        cpu = Math.round(28 + (Math.random() * 2 - 1));
        memory = Math.round(49 + (Math.random() * 2 - 1));
        latencyVal = Math.round(92 + (Math.random() * 6 - 3));
        errorsVal = 0;
        throughputVal = Math.round(890 + (Math.random() * 15 - 7));
        incidents = 0;

        if (phaseTicks === 1) {
          // Clear incident records on stabilization
          try {
            await cds.run(DELETE.from('neuroflow.Incident'));
            await cds.run(DELETE.from('neuroflow.Workflow'));
            await cds.run(DELETE.from('neuroflow.WorkflowStep'));
            await cds.run(DELETE.from('neuroflow.WorkflowAudit'));
            console.log('[Scenario Engine] Operational databases recycled and cleared.');
          } catch (dbErr) {
            console.warn('[Scenario Engine] Database cleanup error:', dbErr.message);
          }
        }

        if (phaseTicks >= 10) { // 20 seconds
          currentPhase = 'STATE_NORMAL';
          phaseTicks = 0;
          console.log('[Scenario Transition] STATE_STABLE -> STATE_NORMAL');
        }
        break;
    }

    // 2. Publish Real-time System Metrics
    eventBus.publish('metrics', {
      latency: { value: latencyVal, display: String(latencyVal) },
      errors: { value: errorsVal, display: String(errorsVal) },
      throughput: { value: throughputVal, display: String(throughputVal) }
    });

    // 3. Publish Physical Health Telemetry
    eventBus.publish('health', {
      cpu,
      memory,
      nodeStatus: cpu > 80 ? "CRITICAL" : (cpu > 60 ? "DEGRADED" : "OK"),
      incidents,
      throughput: throughputVal,
      timestamp: new Date().toISOString()
    });

    // 4. State-Driven Operational Events & Security Narrative
    if (phaseTicks % 2 === 0) {
      let eventPayload = null;

      if (currentPhase === 'STATE_NORMAL') {
        const normalEvents = [
          { type: "scaling", message: "Proactive autoscaler telemetry validation: Node core pool balanced.", priority: "info", targetComponent: "ITOPS" },
          { type: "schedule", message: "Routine transactional system backup completed: Archive cycle finalized.", priority: "info", targetComponent: "ITOPS" },
          { type: "trigger", message: "Thread pool garbage dispatcher evaluated heap allocations: Optimal health.", priority: "info", targetComponent: "wf-1" }
        ];
        eventPayload = normalEvents[Math.floor(Math.random() * normalEvents.length)];
      } 
      else if (currentPhase === 'STATE_WARNING') {
        const warningEvents = [
          { type: "metric", message: "Predictive response-time monitor registers latency build-up on api_gateway.", priority: "warning", targetComponent: "wf-2" },
          { type: "alert", message: "High heap memory lock threshold warning on cluster processor core-3.", priority: "warning", targetComponent: "wf-3" },
          { type: "trigger", message: "Job scheduler accumulates queue depth backlog on Ingest Pipeline thread context.", priority: "warning", targetComponent: "wf-1" }
        ];
        eventPayload = warningEvents[Math.floor(Math.random() * warningEvents.length)];
      } 
      else if (currentPhase === 'STATE_CRITICAL') {
        const criticalEvents = [
          { type: "error", message: "🚨 CRITICAL: Inference Cluster VRAM memory overflow. Thread dispatcher locked on node 3.", priority: "error", targetComponent: "SECURE" },
          { type: "alert", message: "🚨 SLA WARNING: GPU cluster overheat registers 92°C thermal throttle threshold.", priority: "error", targetComponent: "wf-3" }
        ];
        eventPayload = criticalEvents[Math.floor(Math.random() * criticalEvents.length)];
      } 
      else if (currentPhase === 'STATE_RECOVERY') {
        const recoveryEvents = [
          { type: "recovery", message: "Remediation step 2 validated: Executed VRAM heap partition purge.", priority: "success", targetComponent: "wf-3", isRecovery: true },
          { type: "scaling", message: "Active load balancer recycled thread pool and routed contexts to backup node core-4.", priority: "success", targetComponent: "ITOPS", isRecovery: true }
        ];
        eventPayload = recoveryEvents[Math.floor(Math.random() * recoveryEvents.length)];
      } 
      else if (currentPhase === 'STATE_STABLE') {
        const stableEvents = [
          { type: "workflow", message: "SLA recovery complete: Threat remediation playbook closed out with success status.", priority: "success", targetComponent: "wf-1" },
          { type: "recovery", message: "GPU node cluster thermal thresholds returned to optimal 54°C operating baseline.", priority: "success", targetComponent: "wf-3", isRecovery: true }
        ];
        eventPayload = stableEvents[Math.floor(Math.random() * stableEvents.length)];
      }

      if (eventPayload) {
        eventBus.publish('operational_event', {
          id: "evt-" + Date.now(),
          type: eventPayload.type,
          message: eventPayload.message,
          priority: eventPayload.priority,
          targetComponent: eventPayload.targetComponent,
          isRecovery: eventPayload.isRecovery || false,
          timestamp: new Date().toLocaleTimeString()
        });
      }
    }

    // 5. State-Driven AI Insights
    if (phaseTicks % 4 === 0) {
      let insightPayload = null;

      if (currentPhase === 'STATE_NORMAL') {
        insightPayload = { title: "Telemetry pattern stable", summary: "Adaptive baseline learning confirms system operations conform to normal daily parameters. Thread allocations optimal.", severity: "low" };
      } 
      else if (currentPhase === 'STATE_WARNING') {
        insightPayload = { title: "Congestion warning verified", summary: "Neural network load dispatcher flags response time degradation on ETL. Recommend load balancing scaling vectors.", severity: "medium" };
      } 
      else if (currentPhase === 'STATE_CRITICAL') {
        insightPayload = { title: "VRAM Heap Contention Critical", summary: "Core memory partition lock detected on GPU cluster. Threat remediation playbook queued. Instant manager approval required.", severity: "high" };
      } 
      else if (currentPhase === 'STATE_RECOVERY') {
        insightPayload = { title: "Remediation vector active", summary: "Predictive simulation confirms memory cleanup successful. Ingress latency trending down gracefully. Normalizing parameters.", severity: "medium" };
      } 
      else if (currentPhase === 'STATE_STABLE') {
        insightPayload = { title: "Cluster balance achieved", summary: "Automated recycle completed successfully. All threat alerts dismissed. Systems returned to baseline operating thresholds.", severity: "low" };
      }

      if (insightPayload) {
        eventBus.publish('insight_update', {
          id: "ins-ai-" + Date.now(),
          title: insightPayload.title,
          summary: insightPayload.summary,
          severity: insightPayload.severity,
          timestamp: new Date().toISOString(),
          actionable: true
        });
      }
    }

    // 6. Database SLA Tracking & Auto-Escalation alerts
    try {
      const now = new Date();
      const activeWorkflows = await cds.run(
        SELECT.from('neuroflow.Workflow').where({ status: ['PENDING_APPROVAL', 'RUNNING', 'ESCALATED'] })
      );

      for (const wf of activeWorkflows) {
        // Automatically check if OData approved is active, and transition scenario to recovery!
        if (wf.status === 'RUNNING' && currentPhase === 'STATE_CRITICAL') {
          console.log('[Scenario Engine] User approved playbook! Advancing scenario phase to STATE_RECOVERY.');
          currentPhase = 'STATE_RECOVERY';
          phaseTicks = 0;
        }

        if (wf.slaDeadline) {
          const deadline = new Date(wf.slaDeadline);
          
          if (now > deadline && wf.slaStatus !== 'BREACHED') {
            console.log(`[SLA Engine] SLA Breach occurred on workflow: ${wf.name}`);

            await cds.tx(async (wtx) => {
              await wtx.run(UPDATE('neuroflow.Workflow').set({ slaStatus: 'BREACHED' }).where({ ID: wf.ID }));
              await wtx.run(INSERT.into('neuroflow.WorkflowAudit').entries({
                ID: cds.utils.uuid(),
                workflow_ID: wf.ID,
                action: 'SLA_BREACH',
                actor: 'SLA_ENGINE',
                details: `Operational compliance deadline breached. Exceeded threshold limit of ${wf.slaDeadline}`,
                timestamp: now.toISOString()
              }));

              if (wf.status === 'PENDING_APPROVAL') {
                const escalatedTo = 'John Smith (AI Eng Head)';
                await wtx.run(UPDATE('neuroflow.Workflow').set({
                  status: 'ESCALATED',
                  escalatedTo: escalatedTo,
                  priority: 'CRITICAL',
                  assignedRole: 'VP_OPERATIONS'
                }).where({ ID: wf.ID }));

                await wtx.run(INSERT.into('neuroflow.WorkflowAudit').entries({
                  ID: cds.utils.uuid(),
                  workflow_ID: wf.ID,
                  action: 'ESCALATION',
                  actor: 'SLA_ENGINE',
                  details: `Automated SLA escalation algorithm triggered. VP escalation level activated.`,
                  timestamp: now.toISOString()
                }));
              }
            });

            // Publish SLA Breach Event
            eventBus.publish('workflow_sla_alert', {
              workflowId: wf.ID,
              name: wf.name,
              status: 'BREACHED',
              message: `🚨 COMPLIANCE SLA BREACH: Workflow "${wf.name}" exceeded response limits. Auto-escalated to head office.`,
              timestamp: now.toLocaleTimeString()
            });

            // Sync model update
            eventBus.publish('workflow_update', {
              id: wf.ID,
              name: wf.name,
              status: wf.status === 'PENDING_APPROVAL' ? 'ESCALATED' : wf.status,
              progress: wf.progress,
              updatedAt: now.toISOString()
            });
          } 
          else if (wf.slaStatus === 'WITHIN_SLA') {
            const diffSec = (deadline.getTime() - now.getTime()) / 1000;
            if (diffSec > 0 && diffSec < 35) { // SLA deadline approaches warning
              await cds.run(UPDATE('neuroflow.Workflow').set({ slaStatus: 'SLA_WARNING' }).where({ ID: wf.ID }));

              eventBus.publish('workflow_sla_alert', {
                workflowId: wf.ID,
                name: wf.name,
                status: 'SLA_WARNING',
                message: `⚠️ COMPLIANCE SLA WARNING: SLA deadline approaching for "${wf.name}" in ${Math.round(diffSec)}s!`,
                timestamp: now.toLocaleTimeString()
              });
            }
          }
        }
      }
    } catch (e) {
      // quiet fail
    }

    // 7. Workflow dynamic progress updates during active recovery phase
    if (currentPhase === 'STATE_RECOVERY' && currentWorkflowId) {
      try {
        const wf = await cds.run(SELECT.one.from('neuroflow.Workflow').where({ ID: currentWorkflowId }));
        if (wf && wf.status !== 'COMPLETED') {
          // Accelerate progress during recovery ticks
          const nextProgress = Math.min(100, wf.progress + 25);
          const nextStatus = nextProgress >= 100 ? 'COMPLETED' : 'RUNNING';

          await cds.tx(async (wtx) => {
            await wtx.run(UPDATE('neuroflow.Workflow').set({ progress: nextProgress, status: nextStatus }).where({ ID: currentWorkflowId }));

            if (nextStatus === 'COMPLETED') {
              await wtx.run(UPDATE('neuroflow.WorkflowStep').set({ status: 'DONE' }).where({ workflow_ID: currentWorkflowId, stepSequence: 3 }));
              await wtx.run(INSERT.into('neuroflow.WorkflowAudit').entries({
                ID: cds.utils.uuid(),
                workflow_ID: currentWorkflowId,
                action: 'STATUS_CHANGE',
                actor: 'WORKFLOW_ENGINE',
                details: 'Remediation playbook execution finalized. Systems operational and return status green.',
                timestamp: new Date().toISOString()
              }));
            }
          });

          eventBus.publish('workflow_update', {
            id: currentWorkflowId,
            name: wf.name,
            status: nextStatus,
            progress: nextProgress,
            updatedAt: new Date().toISOString()
          });
        }
      } catch (e) {
        // quiet fail
      }
    }

  }, 2000);
});

module.exports = cds.server;
