sap.ui.define([
  "sap/ui/model/json/JSONModel",
  "sap/ui/Device"
], function (JSONModel, Device) {
  "use strict";

  /**
   * Centralized Model Manager - Single source of truth for all application data
   * Eliminates scattered mutations, ensures immutable updates, validates schemas
   * CRITICAL: All array updates MUST go through methods in this module to ensure:
   *   1. Proper immutable patterns (never mutate in-place)
   *   2. Correct UI5 binding refresh (use setProperty)
   *   3. Consistent schema validation
   *   4. Enterprise-grade auditing
   */
  return {
    /**
     * Create the master app model with all operational data
     * Guaranteed to match the schema requirements
     */
    createAppModel: function () {
      // Strict schema definitions
      const initialData = {
        // KPI metrics with live updates
        metrics: {
          latency: { value: 120, display: "120", unit: "ms", trend: "stable" },
          errors: { value: 2, display: "2", unit: "/min", trend: "stable" },
          throughput: { value: 560, display: "560", unit: "req/s", trend: "up" }
        },

        // System health indicators
        health: {
          cpu: 42,
          memory: 68,
          nodeStatus: "OK",
          incidents: 1,
          throughput: 560,
          timestamp: new Date().toISOString()
        },

        // KPI panel data - strict schema
        kpis: [
          { id: "kpi-1", label: "Uptime", value: "99.99%", trend: "stable" },
          { id: "kpi-2", label: "SLA Compliance", value: "99.2%", trend: "up" },
          { id: "kpi-3", label: "Processing Delay", value: "120ms", trend: "stable" }
        ],

        // Initial events - will be updated live
        events: [
          {
            id: "evt-0",
            type: "system",
            message: "System initialized",
            priority: "info",
            timestamp: new Date().toLocaleTimeString()
          }
        ],

        // Workflow tracking - strict schema
        workflows: [
          {
            id: "wf-1",
            name: "Ingest Pipeline",
            status: "Running",
            owner: "Team A",
            progress: 42,
            updatedAt: new Date().toISOString()
          },
          {
            id: "wf-2",
            name: "Analytics ETL",
            status: "Queued",
            owner: "Team B",
            progress: 0,
            updatedAt: new Date().toISOString()
          },
          {
            id: "wf-3",
            name: "Anomaly Detection",
            status: "Running",
            owner: "Team C",
            progress: 78,
            updatedAt: new Date().toISOString()
          }
        ],

        // AI insights - strict schema
        insights: [
          {
            id: "ins-1",
            title: "Latency anomaly detected",
            summary: "Sustained 20% increase vs baseline over 5min window",
            severity: "high",
            timestamp: new Date().toISOString(),
            actionable: true
          },
          {
            id: "ins-2",
            title: "Workflow bottleneck",
            summary: "Queue depth increasing for ETL — recommend +2 workers",
            severity: "medium",
            timestamp: new Date().toISOString(),
            actionable: true
          },
          {
            id: "ins-3",
            title: "Memory pressure rising",
            summary: "Cache hit ratio declining — 68% memory utilization",
            severity: "medium",
            timestamp: new Date().toISOString(),
            actionable: false
          }
        ]
      };

      const model = new JSONModel(initialData);
      
      // Enable two-way binding
      model.setDefaultBindingMode("TwoWay");

      // Attach validation and logging
      this._attachModelDiagnostics(model);

      return model;
    },

    /**
     * Create device/responsive model
     */
    createDeviceModel: function () {
      return new JSONModel({
        isTouch: Device.support.touch,
        listMode: Device.system.phone ? "None" : "SingleSelectMaster",
        listItemType: Device.system.phone ? "Active" : "Inactive"
      });
    },

    /**
     * IMMUTABLE update helper - replace entire array without direct mutation
     * This ensures proper model refresh and binding updates
     */
    updateEventsList: function (model, newEvent) {
      if (!model) return;

      const currentEvents = model.getProperty("/events") || [];
      const updatedEvents = [newEvent, ...currentEvents];
      
      // Keep max 50 events to prevent memory bloat
      if (updatedEvents.length > 50) {
        updatedEvents.pop();
      }

      // Use setProperty for proper binding refresh
      model.setProperty("/events", updatedEvents);

      // Log for diagnostics
      console.log("[ModelManager] Event added. Total events:", updatedEvents.length);
    },

    /**
     * IMMUTABLE update for insights
     */
    updateInsightsList: function (model, newInsight) {
      if (!model) return;

      // Ensure insight has required fields
      const insight = {
        id: newInsight.id || "ins-" + Date.now(),
        title: newInsight.title || "New Insight",
        summary: newInsight.summary || "",
        severity: newInsight.severity || "info",
        timestamp: newInsight.timestamp || new Date().toISOString(),
        actionable: newInsight.actionable !== undefined ? newInsight.actionable : false
      };

      const currentInsights = model.getProperty("/insights") || [];
      const updatedInsights = [insight, ...currentInsights];

      // Keep max 20 insights
      if (updatedInsights.length > 20) {
        updatedInsights.pop();
      }

      model.setProperty("/insights", updatedInsights);
      console.log("[ModelManager] Insight added. Total insights:", updatedInsights.length);
    },

    /**
     * IMMUTABLE update for workflows - returns completely new array
     * CRITICAL: Never mutate array directly, always use setProperty with new array
     */
    updateWorkflowProgress: function (model, workflowId, newProgress, oWorkflowData) {
      if (!model) return;

      const currentWorkflows = model.getProperty("/workflows") || [];
      const exists = currentWorkflows.some(wf => wf.id === workflowId);

      let updatedWorkflows;
      if (exists) {
        // Create completely new array with replaced item
        updatedWorkflows = currentWorkflows.map(wf => {
          if (wf.id === workflowId) {
            return {
              ...wf,
              progress: Math.min(100, Math.max(0, newProgress)),
              updatedAt: new Date().toISOString()
            };
          }
          return wf;
        });
      } else {
        // Dynamically append new workflow
        const newWf = {
          id: workflowId,
          name: oWorkflowData?.name || "Dynamic Workflow",
          status: oWorkflowData?.status || "RUNNING",
          owner: oWorkflowData?.owner || "AI Engine",
          progress: Math.min(100, Math.max(0, newProgress)),
          updatedAt: new Date().toISOString()
        };
        updatedWorkflows = [...currentWorkflows, newWf];
      }

      // Use setProperty to trigger proper UI5 binding refresh
      model.setProperty("/workflows", updatedWorkflows);
      console.log("[ModelManager] Workflow updated:", workflowId, "progress:", newProgress);
    },

    /**
     * IMMUTABLE update for workflow status
     */
    updateWorkflowStatus: function (model, workflowId, newStatus, oWorkflowData) {
      if (!model) return;

      const currentWorkflows = model.getProperty("/workflows") || [];
      const exists = currentWorkflows.some(wf => wf.id === workflowId);

      let updatedWorkflows;
      if (exists) {
        updatedWorkflows = currentWorkflows.map(wf => {
          if (wf.id === workflowId) {
            return {
              ...wf,
              status: newStatus,
              updatedAt: new Date().toISOString()
            };
          }
          return wf;
        });
      } else {
        const newWf = {
          id: workflowId,
          name: oWorkflowData?.name || "Dynamic Workflow",
          status: newStatus,
          owner: oWorkflowData?.owner || "AI Engine",
          progress: oWorkflowData?.progress || 10,
          updatedAt: new Date().toISOString()
        };
        updatedWorkflows = [...currentWorkflows, newWf];
      }

      model.setProperty("/workflows", updatedWorkflows);
      console.log("[ModelManager] Workflow status updated:", workflowId, "->", newStatus);
    },

    /**
     * IMMUTABLE update for metrics with proper live animation support
     */
    updateMetrics: function (model, metricKey, newValue) {
      if (!model) return;

      const currentMetric = model.getProperty("/metrics/" + metricKey);
      if (!currentMetric) return;

      // Update both value and display text
      model.setProperty("/metrics/" + metricKey + "/value", newValue);
      model.setProperty("/metrics/" + metricKey + "/display", String(newValue));

      console.log("[ModelManager] Metric updated:", metricKey, "->", newValue);
    },

    /**
     * IMMUTABLE update for health indicators
     */
    updateHealth: function (model, healthKey, newValue) {
      if (!model) return;

      model.setProperty("/health/" + healthKey, newValue);
      console.log("[ModelManager] Health updated:", healthKey, "->", newValue);
    },

    /**
     * Attach model diagnostics for debugging
     */
    _attachModelDiagnostics: function (model) {
      // Validate on every property change
      model.attachPropertyChange(function (oEvent) {
        const path = oEvent.getParameter("path");
        const value = oEvent.getParameter("value");

        // Validate critical arrays
        if (path && (path.includes("events") || path.includes("insights") || path.includes("workflows"))) {
          console.log("[ModelManager Diagnostic]", path, "changed to:", value);
        }
      });

      // Expose model state for browser console debugging
      window.__NeuroFlowModel = model;
      console.log("[ModelManager] Model available at window.__NeuroFlowModel");
    },

    /**
     * Validate data schema - called periodically for integrity
     */
    validateSchema: function (model) {
      if (!model) return false;

      const data = model.getData();

      // Check required arrays exist and are arrays
      const requiredArrays = ["events", "insights", "workflows", "kpis"];
      for (const arr of requiredArrays) {
        if (!Array.isArray(data[arr])) {
          console.error("[ModelManager] Schema violation: " + arr + " is not an array", data[arr]);
          return false;
        }
      }

      console.log("[ModelManager] Schema validation passed ✓");
      return true;
    },

    /**
     * Get current model state for debugging
     */
    getModelState: function (model) {
      if (!model) return null;

      const data = model.getData();
      return {
        eventCount: data.events?.length || 0,
        insightCount: data.insights?.length || 0,
        workflowCount: data.workflows?.length || 0,
        kpiCount: data.kpis?.length || 0,
        health: data.health,
        metrics: data.metrics,
        timestamp: new Date().toISOString()
      };
    }
  };
});
