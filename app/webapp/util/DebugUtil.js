sap.ui.define([], function () {
  "use strict";

  /**
   * DebugUtil - Enterprise-grade debugging and diagnostics
   * Provides structured logging, model state validation, and binding diagnostics
   * Accessible globally for browser console debugging
   */
  return {
    /**
     * Structured logging with context and timestamp
     */
    log: function (source, message, data) {
      const timestamp = new Date().toLocaleTimeString();
      const logEntry = {
        timestamp,
        source,
        message,
        data: data || null,
        level: "INFO"
      };

      // Write to console with formatting
      console.log(
        `%c[${timestamp}] %c${source} %c${message}`,
        "color: #999; font-size: 11px",
        "color: #00d1ff; font-weight: bold; font-size: 12px",
        "color: #e6eef6"
      );

      if (data) {
        console.log("  └─ Data:", data);
      }

      // Store in window for audit trail
      if (!window.__NeuroFlowLogs) {
        window.__NeuroFlowLogs = [];
      }
      window.__NeuroFlowLogs.push(logEntry);

      // Keep only last 500 logs
      if (window.__NeuroFlowLogs.length > 500) {
        window.__NeuroFlowLogs.shift();
      }
    },

    /**
     * Log errors with full context
     */
    error: function (source, message, error) {
      const timestamp = new Date().toLocaleTimeString();
      console.error(
        `%c[${timestamp}] %c${source} %c❌ ${message}`,
        "color: #999; font-size: 11px",
        "color: #ff6b6b; font-weight: bold; font-size: 12px",
        "color: #ff6b6b"
      );

      if (error) {
        console.error("  └─ Error:", error);
        if (error.stack) {
          console.error("  └─ Stack:", error.stack);
        }
      }
    },

    /**
     * Validate model binding consistency
     */
    validateBindings: function (oView, modelName) {
      if (!oView) return { valid: false, errors: ["View not provided"] };

      const errors = [];
      const model = oView.getModel(modelName);

      if (!model) {
        errors.push(`Model '${modelName}' not found on view`);
        return { valid: false, errors };
      }

      const data = model.getData();
      const requiredArrays = ["events", "insights", "workflows"];

      for (const arr of requiredArrays) {
        if (!Array.isArray(data[arr])) {
          errors.push(`Field '${arr}' is not an array`);
        }
      }

      const valid = errors.length === 0;
      this.log("DebugUtil.validateBindings", `Validation ${valid ? "PASSED" : "FAILED"}`, {
        model: modelName,
        errors: errors.length > 0 ? errors : null
      });

      return { valid, errors };
    },

    /**
     * Dump full model state for inspection
     */
    dumpModelState: function (model, name) {
      if (!model) {
        console.warn("Model not provided");
        return;
      }

      const data = model.getData();
      const state = {
        name: name || "AppModel",
        eventCount: data.events?.length || 0,
        insightCount: data.insights?.length || 0,
        workflowCount: data.workflows?.length || 0,
        kpiCount: data.kpis?.length || 0,
        health: data.health,
        metrics: data.metrics,
        capturedAt: new Date().toISOString()
      };

      console.group(`📊 Model State: ${state.name}`);
      console.table({
        "Events": state.eventCount,
        "Insights": state.insightCount,
        "Workflows": state.workflowCount,
        "KPIs": state.kpiCount
      });
      console.log("Health:", state.health);
      console.log("Metrics:", state.metrics);
      console.groupEnd();

      return state;
    },

    /**
     * Inspect a specific array in model
     */
    inspectArray: function (model, arrayPath) {
      if (!model) return;

      const array = model.getProperty(arrayPath) || [];
      console.group(`🔍 Inspecting: ${arrayPath}`);
      console.log(`Count: ${array.length}`);
      console.table(array);
      console.groupEnd();

      return array;
    },

    /**
     * Trace binding path evaluation
     */
    traceBinding: function (oControl, bindingPath) {
      const binding = oControl.getBinding("items");
      if (!binding) {
        console.warn("No binding found on control");
        return;
      }

      console.group(`📍 Binding Trace: ${bindingPath}`);
      console.log("Path:", binding.getPath());
      console.log("Model:", binding.getModel().getId ? binding.getModel().getId() : "no-id");
      console.log("Length:", binding.getLength());
      console.log("Contexts:", binding.getContexts ? binding.getContexts() : "N/A");
      console.groupEnd();
    },

    /**
     * Performance monitoring for model updates
     */
    measureUpdate: function (label, updateFn) {
      const start = performance.now();
      updateFn();
      const elapsed = performance.now() - start;

      console.log(
        `%c⏱️ ${label}: ${elapsed.toFixed(2)}ms`,
        elapsed > 100 ? "color: #ff6b6b; font-weight: bold" : "color: #40d38a"
      );

      return elapsed;
    },

    /**
     * Get audit log of all recent operations
     */
    getAuditLog: function (limit) {
      limit = limit || 100;
      const logs = (window.__NeuroFlowLogs || []).slice(-limit);

      console.group(`📋 Audit Log (last ${limit})`);
      console.table(logs);
      console.groupEnd();

      return logs;
    },

    /**
     * Export diagnostics to JSON for external analysis
     */
    exportDiagnostics: function (model) {
      const diagnostics = {
        exportedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        modelState: this.dumpModelState(model, "exported"),
        auditLog: window.__NeuroFlowLogs || [],
        url: window.location.href
      };

      const json = JSON.stringify(diagnostics, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      console.log("Diagnostics exported:", url);
      return url;
    },

    /**
     * Initialize debug utilities - call once on app startup
     */
    init: function () {
      window.__NeuroFlowDebug = this;
      window.__NeuroFlowLogs = [];

      this.log("DebugUtil", "Enterprise debugging initialized", {
        available: "window.__NeuroFlowDebug"
      });

      // Log any unhandled errors
      window.addEventListener("error", (e) => {
        this.error("Global", "Unhandled error", e.error);
      });

      // Log unhandled promise rejections
      window.addEventListener("unhandledrejection", (e) => {
        this.error("Global", "Unhandled promise rejection", e.reason);
      });
    }
  };
});
