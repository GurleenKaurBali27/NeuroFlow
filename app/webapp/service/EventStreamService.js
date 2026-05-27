sap.ui.define([
  "neuroflow/util/DebugUtil"
], function (DebugUtil) {
  "use strict";

  /**
   * EventStreamService - Enterprise Socket.IO Operational Real-Time Stream Receiver
   * Subscribes to backend EventBus topics over Websockets, synchronizing the models
   * immutably, and triggering animated notification alert portals.
   */
  return {
    /**
     * Connect to the Socket.IO server and register stream callbacks
     * 
     * @param {Object} model - Master JSONModel
     * @param {Object} modelManager - Centralized ModelManager
     */
    start: function (model, modelManager) {
      this._model = model;
      this._modelManager = modelManager;

      DebugUtil.log("EventStreamService", "Initializing Socket.IO operational stream connection...");

      // 1. Establish connection to local Express Socket.IO server
      if (typeof io === "undefined") {
        console.error("[EventStreamService] Socket.IO client library is missing. Make sure /socket.io/socket.io.js is loaded.");
        return this;
      }

      this.socket = io();

      // 2. Handshake handshake verification
      this.socket.on("handshake", (config) => {
        DebugUtil.log("EventStreamService", "Real-Time Event Stream Handshake complete ✓", config);
        this._showFloatingToast({
          title: "Command Handshake Stabilized",
          summary: "Real-time stream interface verified. Cognitive mesh connection active.",
          severity: "low"
        });
      });

      // 3. Subscribe to Real-Time Telemetry Metrics
      this.socket.on("metrics", (metrics) => {
        this._modelManager.updateMetrics(this._model, "latency", metrics.latency.value);
        this._modelManager.updateMetrics(this._model, "errors", metrics.errors.value);
        this._modelManager.updateMetrics(this._model, "throughput", metrics.throughput.value);
      });

      // 4. Subscribe to Real-Time Node Health
      this.socket.on("health", (health) => {
        this._modelManager.updateHealth(this._model, "cpu", health.cpu);
        this._modelManager.updateHealth(this._model, "memory", health.memory);
        this._modelManager.updateHealth(this._model, "nodeStatus", health.nodeStatus);
        this._modelManager.updateHealth(this._model, "incidents", health.incidents);
        this._modelManager.updateHealth(this._model, "throughput", health.throughput);
        this._modelManager.updateHealth(this._model, "timestamp", health.timestamp);
      });

      // 5. Subscribe to Live Event Feed
      this.socket.on("operational_event", (event) => {
        this._modelManager.updateEventsList(this._model, event);
        
        // Show animated notifications for warning, success, or error events
        if (event.priority === "warning" || event.priority === "error" || event.priority === "success") {
          this._showFloatingToast({
            title: event.priority.toUpperCase() + " Operational Incident",
            summary: event.message,
            severity: event.priority
          });
        }

        // Proactive Digital Twin dynamic incident orchestration
        const controller = window.__NeuroFlowController;
        if (controller) {
          if (event.priority === "warning" || event.priority === "error") {
            if (typeof controller.addDynamicIncident === "function") {
              controller.addDynamicIncident(event);
            }
          } else if (event.isRecovery === true || event.priority === "success") {
            if (typeof controller.resolveDynamicIncident === "function") {
              // Resolve incidents associated with the target component (e.g. 'wf-3')
              controller.resolveDynamicIncident(event.targetComponent, event.message);
            }
          }
        }
      });

      // 6. Subscribe to AI insights
      this.socket.on("insight_update", (insight) => {
        this._modelManager.updateInsightsList(this._model, insight);
        
        // Trigger high-attention AI alert popups
        this._showFloatingToast({
          title: "AI Cognitive Insight Generated",
          summary: `${insight.title}: ${insight.summary}`,
          severity: insight.severity === "high" ? "error" : "warning"
        });
      });

      // 7. Subscribe to Workflow progress updates
      this.socket.on("workflow_update", (workflow) => {
        this._modelManager.updateWorkflowProgress(this._model, workflow.id, workflow.progress);
        this._modelManager.updateWorkflowStatus(this._model, workflow.id, workflow.status);

        // Dynamic Digital Twin synchronization (Theme-Aware)
        const controller = window.__NeuroFlowController;
        if (controller && controller._cy) {
          const cyNode = controller._cy.getElementById(workflow.id);
          if (cyNode && cyNode.length > 0) {
            cyNode.data({
              label: `${workflow.name} (${workflow.progress}%)`,
              progress: workflow.progress,
              status: workflow.status
            });

            const isLight = document.body.classList.contains("nf-theme-light");

            // Update glow colors dynamically based on active statuses (Completed, Running, Pending Approval, Escalated)
            if (workflow.status === "Completed" || workflow.status === "COMPLETED") {
              cyNode.style({
                "border-color": isLight ? "#059669" : "#10b981",
                "background-color": isLight ? "rgba(5, 150, 105, 0.08)" : "rgba(16, 185, 129, 0.08)"
              });
            } else if (workflow.status === "Running" || workflow.status === "RUNNING") {
              cyNode.style({
                "border-color": isLight ? "#008fa3" : "#00e5ff",
                "background-color": isLight ? "rgba(0, 143, 163, 0.08)" : "rgba(0, 229, 255, 0.08)"
              });
            } else if (workflow.status === "PENDING_APPROVAL" || workflow.status === "PendingApproval") {
              cyNode.style({
                "border-color": isLight ? "#d97706" : "#f59e0b",
                "background-color": isLight ? "rgba(217, 119, 6, 0.08)" : "rgba(245, 158, 11, 0.08)"
              });
            } else if (workflow.status === "ESCALATED" || workflow.status === "Escalated") {
              cyNode.style({
                "border-color": isLight ? "#dc2626" : "#ef4444",
                "background-color": isLight ? "rgba(220, 38, 38, 0.08)" : "rgba(239, 68, 68, 0.08)"
              });
            }
          }
        }

        if (workflow.status === "Completed" || workflow.status === "COMPLETED") {
          this._showFloatingToast({
            title: "Threat Playbook Completed",
            summary: `Automated Pipeline "${workflow.name}" completed successfully. Baseline telemetry verified.`,
            severity: "success"
          });
        }
      });

      // 8. Subscribe to SLA Alerts (Warnings and Breaches)
      this.socket.on("workflow_sla_alert", (alert) => {
        this._showFloatingToast({
          title: alert.status === "BREACHED" ? "Compliance SLA Breach" : "Compliance SLA Warning",
          summary: alert.message,
          severity: alert.status === "BREACHED" ? "error" : "warning"
        });
      });

      return this;
    },

    /**
     * Stop and disconnect the websocket stream
     */
    stop: function () {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
        DebugUtil.log("EventStreamService", "Socket.IO event stream interface disconnected.");
      }
    },

    /**
     * Inject a floating glassmorphic notification banner dynamically into the DOM
     */
    _showFloatingToast: function (alert) {
      const area = document.getElementById("notificationArea");
      if (!area) return;

      const toast = document.createElement("div");
      toast.className = `nfSlideInAlert nfAlert-${alert.severity || "info"}`;

      // Pick nice high-fidelity icon representing priority
      let icon = "⚙️";
      if (alert.severity === "success") icon = "✅";
      else if (alert.severity === "warning") icon = "⚠️";
      else if (alert.severity === "error" || alert.severity === "high") icon = "🚨";
      else if (alert.severity === "low") icon = "✨";

      toast.innerHTML = `
        <div class="nfAlertHeader">
          <span class="nfAlertIcon">${icon}</span>
          <span class="nfAlertTitle">${alert.title}</span>
        </div>
        <div class="nfAlertBody">${alert.summary}</div>
      `;

      area.appendChild(toast);

      // Slide in transition handled by CSS keyframe, handle slide out + remove programmatically
      setTimeout(() => {
        toast.classList.add("nfFadeOut");
        setTimeout(() => toast.remove(), 400);
      }, 4000);
    }
  };
});
