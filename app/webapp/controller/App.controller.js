sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "neuroflow/model/ModelManager",
  "neuroflow/service/EventStreamService",
  "neuroflow/util/DebugUtil",
  "sap/m/MessageToast"
], function (Controller, ModelManager, EventStreamService, DebugUtil, MessageToast) {
  "use strict";

  return Controller.extend("neuroflow.controller.App", {
    onInit: function () {
      // Initialize enterprise debugging
      DebugUtil.init();
      DebugUtil.log("App.controller", "Operational Cockpit Component Initialized");

      const oView = this.getView();
      
      // 1. Create centralized model BEFORE any bindings happen
      const appModel = ModelManager.createAppModel();
      oView.setModel(appModel, "app");
      
      DebugUtil.log("App.controller", "Master app JSONModel attached to operational view", {
        model: "app",
        modelId: appModel.getId()
      });

      // 2. Validate schema immediately
      const isValid = ModelManager.validateSchema(appModel);
      if (!isValid) {
        DebugUtil.error("App.controller", "Initial model schema integrity check failed!");
      } else {
        DebugUtil.log("App.controller", "Model schema integrity check passed ✓");
      }

      // 3. Log initial model state
      const initialState = ModelManager.getModelState(appModel);
      DebugUtil.log("App.controller", "Model state telemetry initialized", initialState);
      DebugUtil.dumpModelState(appModel, "app");

      // 4. Start event stream for live updates
      EventStreamService.start(appModel, ModelManager);
      DebugUtil.log("App.controller", "Socket.IO real-time event stream active", { sync: "real-time" });

      // Fetch active workflows from database to sync seeds
      this._loadODataWorkflows();

      // 5. Initialize theme preference from localStorage on startup
      const savedTheme = localStorage.getItem("neuroflow-theme") || "dark";
      this._applyTheme(savedTheme);
      setTimeout(() => {
        this._applyTheme(savedTheme);
      }, 50);

      // 6. Validate bindings are correctly set up
      setTimeout(() => {
        const bindingValidation = DebugUtil.validateBindings(oView, "app");
        if (!bindingValidation.valid) {
          DebugUtil.error("App.controller", "Binding structural validation failed", bindingValidation.errors);
        }
      }, 500);

      // 7. Attach periodic diagnostics (every 15 seconds)
      this._diagnosticsTimer = setInterval(() => {
        const state = ModelManager.getModelState(appModel);
        DebugUtil.log("App.controller", "Periodic telemetry health audit", state);
      }, 15000);

      // 8. Store references for cleanup and debugging
      this._appModel = appModel;
      this._eventStreamService = EventStreamService;

      // Make model and debug util globally accessible for browser console debugging
      window.__NeuroFlowController = this;
      DebugUtil.log("App.controller", "Diagnostics handle exposed at window.__NeuroFlowController");
    },

    /**
     * Apply operational theme (Light/Dark) to HTML document and toggle button icon
     */
    _applyTheme: function (sTheme) {
      const elBody = document.body;
      if (sTheme === "light") {
        elBody.classList.add("nf-theme-light");
        elBody.classList.remove("nf-theme-dark");
      } else {
        elBody.classList.add("nf-theme-dark");
        elBody.classList.remove("nf-theme-light");
      }

      // Update button icon in the view
      const toggleBtn = this.getView().byId("themeToggleBtn");
      if (toggleBtn) {
        toggleBtn.setIcon(sTheme === "light" ? "sap-icon://dark-mode" : "sap-icon://light-mode");
      }

      localStorage.setItem("neuroflow-theme", sTheme);
      
      // Update Cytoscape style theme colors dynamically if active
      if (this._cy) {
        this._updateCytoscapeThemeStyles(sTheme);
      }
    },

    /**
     * Operator Action: Toggle operational command center theme (Light/Dark)
     */
    onToggleTheme: function () {
      const elBody = document.body;
      const currentTheme = elBody.classList.contains("nf-theme-light") ? "light" : "dark";
      const nextTheme = currentTheme === "light" ? "dark" : "light";
      
      DebugUtil.log("App.controller", `Theme Manager: Transitioning theme -> "${nextTheme.toUpperCase()}"`);
      this._applyTheme(nextTheme);

      MessageToast.show(`Operational Theme: ${nextTheme === "light" ? "Light Mode" : "Dark Mode"} Activated`);
    },

    /**
     * Update Cytoscape Graph Theme colors dynamically based on background contrast
     */
    _updateCytoscapeThemeStyles: function (sTheme) {
      if (!this._cy) return;

      const isLight = sTheme === "light";
      
      this._cy.style()
        .selector("node")
        .style({
          "color": isLight ? "#334155" : "#94a3b8",
          "background-color": isLight ? "#ffffff" : "#07090d",
          "border-color": isLight ? "#008fa3" : "#00e5ff"
        })
        .selector('node[type="dept"]')
        .style({
          "border-color": isLight ? "#008fa3" : "#00e5ff",
          "background-color": isLight ? "rgba(0, 143, 163, 0.08)" : "rgba(0, 229, 255, 0.08)"
        })
        .selector('node[id="SECURE"]')
        .style({
          "border-color": isLight ? "#7c3aed" : "#a855f7",
          "background-color": isLight ? "rgba(124, 58, 237, 0.08)" : "rgba(168, 85, 247, 0.08)"
        })
        .selector('node[type="wf"]')
        .style({
          "border-color": (node) => {
            const s = node.data("status");
            if (s === "Completed" || s === "COMPLETED") return isLight ? "#059669" : "#10b981";
            if (s === "Running" || s === "RUNNING") return isLight ? "#008fa3" : "#00e5ff";
            if (s === "PENDING_APPROVAL" || s === "PendingApproval") return isLight ? "#d97706" : "#f59e0b";
            if (s === "ESCALATED" || s === "Escalated") return isLight ? "#dc2626" : "#ef4444";
            return isLight ? "#d97706" : "#f59e0b";
          },
          "background-color": (node) => {
            const s = node.data("status");
            if (s === "Completed" || s === "COMPLETED") return isLight ? "rgba(5, 150, 105, 0.08)" : "rgba(16, 185, 129, 0.08)";
            if (s === "Running" || s === "RUNNING") return isLight ? "rgba(0, 143, 163, 0.08)" : "rgba(0, 229, 255, 0.08)";
            if (s === "PENDING_APPROVAL" || s === "PendingApproval") return isLight ? "rgba(217, 119, 6, 0.08)" : "rgba(245, 158, 11, 0.08)";
            if (s === "ESCALATED" || s === "Escalated") return isLight ? "rgba(220, 38, 38, 0.08)" : "rgba(239, 68, 68, 0.08)";
            return isLight ? "rgba(217, 119, 6, 0.08)" : "rgba(245, 158, 11, 0.08)";
          }
        })
        .selector('node[type="inc"]')
        .style({
          "border-color": isLight ? "#dc2626" : "#ef4444",
          "background-color": isLight ? "rgba(220, 38, 38, 0.08)" : "rgba(239, 68, 68, 0.08)"
        })
        .selector("edge")
        .style({
          "line-color": isLight ? "rgba(0, 143, 163, 0.15)" : "rgba(0, 229, 255, 0.15)",
          "target-arrow-color": isLight ? "rgba(0, 143, 163, 0.25)" : "rgba(0, 229, 255, 0.25)"
        })
        .selector('edge[type="incident-prop"]')
        .style({
          "line-color": isLight ? "rgba(220, 38, 38, 0.35)" : "rgba(239, 68, 68, 0.35)",
          "target-arrow-color": isLight ? "rgba(220, 38, 38, 0.45)" : "rgba(239, 68, 68, 0.45)"
        })
        .update();
    },

    /**
     * Fetch active workflows from CAP OData endpoint
     */
    _loadODataWorkflows: function () {
      fetch("/odata/v4/neuro-flow/Workflows")
        .then(res => {
          if (res.ok) return res.json();
          throw new Error("Active workflow index load failed");
        })
        .then(data => {
          if (data && data.value && data.value.length > 0) {
            const formatted = data.value.map(w => ({
              id: w.ID,
              name: w.name,
              status: w.status,
              owner: w.assignedRole || "AI Coprocessor",
              progress: w.progress,
              slaStatus: w.slaStatus,
              updatedAt: new Date().toISOString()
            }));
            this._appModel.setProperty("/workflows", formatted);
            DebugUtil.log("App.controller", "Database workflow synchronization complete", formatted);
          }
        })
        .catch(err => {
          console.warn("[App.controller] OData workflows sync warning:", err.message);
        });
    },

    /**
     * Refresh metrics - manual trigger for operational operators
     */
    onRefreshMetrics: function () {
      if (this._appModel) {
        // Show loading spinner
        const loader = document.getElementById("nfLoaderOverlay");
        if (loader) {
          loader.classList.add("active");
          setTimeout(() => loader.classList.remove("active"), 500);
        }

        // Force a telemetry fetch
        this._loadODataWorkflows();
        MessageToast.show("Command Center Telemetry Synchronized");
        DebugUtil.log("App.controller", "Manual cockpit recalibration triggered");
      }
    },

    /**
     * Navigation handlers (stub for future nav implementation)
     */
    onNavHome: function () {
      MessageToast.show("Navigating to Primary Overview Workspace");
    },

    onNavWorkflows: function () {
      MessageToast.show("Navigating to Workflow SLA Pipeline");
    },

    onNavMetrics: function () {
      MessageToast.show("Navigating to Telemetry Diagnostics");
    },

    onNavEvents: function () {
      MessageToast.show("Navigating to Live Event Feeds");
    },

    /**
     * Toggle between Dashboard view and Digital Twin Topology
     */
    onToggleCanvasView: function (oEvent) {
      const sKey = oEvent.getParameter("key");
      const oView = this.getView();
      
      const oDashboard = oView.byId("dashboardLayout");
      const oRight = oView.byId("rightLayout");
      const oTwin = oView.byId("digitalTwinLayout");

      const oFeed = oView.byId("feedPanel");
      const oWorkflow = oView.byId("workflowPanel");
      const oHealth = oView.byId("healthPanel");
      const oKpi = oView.byId("kpiPanel");

      DebugUtil.log("App.controller", `View Manager: Switching operational desk canvas to: "${sKey}"`);

      // Deactivate Cytoscape animations if switching away from Twin
      if (sKey !== "twin" && this._edgeAnimationTimer) {
        clearInterval(this._edgeAnimationTimer);
        this._edgeAnimationTimer = null;
      }

      // Show sleek loading transition overlay
      const loader = document.getElementById("nfLoaderOverlay");
      if (loader) {
        loader.classList.add("active");
        setTimeout(() => {
          loader.classList.remove("active");
        }, 550);
      }

      switch (sKey) {
        case "all":
          oDashboard.setVisible(true);
          oDashboard.setWidth("65%");
          oFeed.setVisible(true);
          oWorkflow.setVisible(true);

          oRight.setVisible(true);
          oRight.setWidth("32%");
          oHealth.setVisible(true);
          oKpi.setVisible(true);

          oTwin.setVisible(false);
          break;

        case "events":
          oDashboard.setVisible(true);
          oDashboard.setWidth("100%");
          oFeed.setVisible(true);
          oWorkflow.setVisible(false);

          oRight.setVisible(false);
          oTwin.setVisible(false);
          break;

        case "workflows":
          oDashboard.setVisible(true);
          oDashboard.setWidth("100%");
          oFeed.setVisible(false);
          oWorkflow.setVisible(true);

          oRight.setVisible(false);
          oTwin.setVisible(false);
          break;

        case "health":
          oDashboard.setVisible(false);
          oTwin.setVisible(false);

          oRight.setVisible(true);
          oRight.setWidth("100%");
          oHealth.setVisible(true);
          oKpi.setVisible(false);
          break;

        case "kpis":
          oDashboard.setVisible(false);
          oTwin.setVisible(false);

          oRight.setVisible(true);
          oRight.setWidth("100%");
          oHealth.setVisible(false);
          oKpi.setVisible(true);
          break;

        case "twin":
          oDashboard.setVisible(false);
          oRight.setVisible(false);
          oTwin.setVisible(true);
          oTwin.setWidth("100%");

          // Initialize Cytoscape network layout after view mount completes
          setTimeout(() => {
            this._initDigitalTwin();
          }, 150);
          break;

        default:
          break;
      }
    },

    /**
     * Futuristic Digital Twin Topology Setup using Cytoscape.js
     */
    _initDigitalTwin: function () {
      const domCanvas = document.getElementById("digitalTwinCanvas");
      if (!domCanvas) {
        console.warn("[App.controller] Digital Twin layout container is not mounted in DOM.");
        return;
      }

      if (this._cy) {
        this._cy.destroy();
        this._cy = null;
      }

      if (this._edgeAnimationTimer) {
        clearInterval(this._edgeAnimationTimer);
        this._edgeAnimationTimer = null;
      }

      DebugUtil.log("App.controller", "Bootstrapping Cytoscape Digital Twin Topology...");
      this._dynamicIncidents = {};

      // Gather current state from model for seed nodes
      const appModel = this._appModel;
      const wf1 = appModel.getProperty("/workflows/0") || { progress: 42, status: "Running" };
      const wf2 = appModel.getProperty("/workflows/1") || { progress: 0, status: "Queued" };
      const wf3 = appModel.getProperty("/workflows/2") || { progress: 78, status: "Running" };

      // Define concentric, symmetric preset coordinates for premium HUD dashboard balance
      const elements = [
        // Department Nodes (Top layer)
        { data: { id: "ITOPS", label: "IT OPERATIONS DIVISION", type: "dept", status: "OK", info: "Manager assignment: IT Core Services" }, position: { x: 150, y: 80 } },
        { data: { id: "AIENG", label: "AI ENGINEERING MESH", type: "dept", status: "OK", info: "Manager assignment: Cognitive Operations" }, position: { x: 350, y: 80 } },
        { data: { id: "SECURE", label: "SECURITY INFRASTRUCTURE", type: "dept", status: "OK", info: "Manager assignment: Intrusion Detection" }, position: { x: 550, y: 80 } },

        // Workflow Nodes (Middle layer, linked to departments)
        { data: { id: "wf-1", label: `Ingest Pipeline (${wf1.progress}%)`, type: "wf", status: wf1.status, progress: wf1.progress, info: "Assigned: Core Pipeline Team" }, position: { x: 180, y: 220 } },
        { data: { id: "wf-2", label: `Analytics ETL (${wf2.progress}%)`, type: "wf", status: wf2.status, progress: wf2.progress, info: "Assigned: Big Data Dispatchers" }, position: { x: 350, y: 220 } },
        { data: { id: "wf-3", label: `Anomaly Detection (${wf3.progress}%)`, type: "wf", status: wf3.status, progress: wf3.progress, info: "Assigned: Security Automation Engines" }, position: { x: 520, y: 220 } },

        // Initial Operational Hotspots (Bottom layer, positioned cleanly)
        { data: { id: "inc-1", label: "Core Node Leak", type: "inc", status: "CRITICAL", info: "Thread pool context accumulation" }, position: { x: 150, y: 360 } },
        { data: { id: "inc-2", label: "P99 Latency Breach", type: "inc", status: "HIGH", info: "API gateway network queue accumulation" }, position: { x: 350, y: 360 } },
        { data: { id: "inc-3", label: "Port Contention scan", type: "inc", status: "CRITICAL", info: "Intrusion system logs filter anomaly" }, position: { x: 550, y: 360 } },

        // Relationships (Edges)
        { data: { id: "e-wf1-it", source: "wf-1", target: "ITOPS", type: "rel" } },
        { data: { id: "e-wf2-ai", source: "wf-2", target: "AIENG", type: "rel" } },
        { data: { id: "e-wf3-sec", source: "wf-3", target: "SECURE", type: "rel" } },

        // Glowing fault propagation lines
        { data: { id: "e-inc1-wf1", source: "inc-1", target: "wf-1", type: "incident-prop" } },
        { data: { id: "e-inc2-wf2", source: "inc-2", target: "wf-2", type: "incident-prop" } },
        { data: { id: "e-inc3-sec", source: "inc-3", target: "SECURE", type: "incident-prop" } }
      ];

      // Setup Cytoscape Instance
      this._cy = cytoscape({
        container: domCanvas,
        elements: elements,
        style: [
          {
            selector: "node",
            style: {
              "content": "data(label)",
              "text-valign": "bottom",
              "text-margin-y": 10,
              "color": "#94a3b8",
              "font-family": "Outfit, Segoe UI, sans-serif",
              "font-size": "10px",
              "font-weight": "700",
              "background-color": "#07090d",
              "border-width": "2.5px",
              "border-color": "#00e5ff",
              "width": "38px",
              "height": "38px",
              "overlay-padding": "6px",
              "overlay-opacity": 0,
              "transition-property": "background-color, border-color, width, height",
              "transition-duration": "0.3s"
            }
          },
          {
            selector: 'node[type="dept"]',
            style: {
              "width": "46px",
              "height": "46px",
              "border-color": "#00e5ff",
              "border-width": "3px",
              "background-color": "rgba(0, 229, 255, 0.08)"
            }
          },
          {
            selector: 'node[id="SECURE"]',
            style: {
              "border-color": "#a855f7",
              "background-color": "rgba(168, 85, 247, 0.08)"
            }
          },
          {
            selector: 'node[type="wf"]',
            style: {
              "border-color": function(node) {
                const s = node.data("status");
                if (s === "Completed" || s === "COMPLETED") return "#10b981";
                if (s === "Running" || s === "RUNNING") return "#00e5ff";
                if (s === "PENDING_APPROVAL" || s === "PendingApproval") return "#f59e0b";
                if (s === "ESCALATED" || s === "Escalated") return "#ef4444";
                return "#f59e0b";
              },
              "background-color": function(node) {
                const s = node.data("status");
                if (s === "Completed" || s === "COMPLETED") return "rgba(16, 185, 129, 0.08)";
                if (s === "Running" || s === "RUNNING") return "rgba(0, 229, 255, 0.08)";
                if (s === "PENDING_APPROVAL" || s === "PendingApproval") return "rgba(245, 158, 11, 0.08)";
                if (s === "ESCALATED" || s === "Escalated") return "rgba(239, 68, 68, 0.08)";
                return "rgba(245, 158, 11, 0.08)";
              }
            }
          },
          {
            selector: 'node[type="inc"]',
            style: {
              "shape": "hexagon",
              "width": "42px",
              "height": "42px",
              "border-color": "#ef4444",
              "background-color": "rgba(239, 68, 68, 0.08)",
              "border-width": "3px"
            }
          },
          {
            selector: "edge",
            style: {
              "width": 1.5,
              "line-color": "rgba(0, 229, 255, 0.15)",
              "curve-style": "bezier",
              "target-arrow-shape": "triangle",
              "target-arrow-color": "rgba(0, 229, 255, 0.25)",
              "arrow-scale": 0.8
            }
          },
          {
            selector: 'edge[type="incident-prop"]',
            style: {
              "line-color": "rgba(239, 68, 68, 0.35)",
              "line-style": "dashed",
              "line-dash-pattern": [4, 4],
              "target-arrow-color": "rgba(239, 68, 68, 0.45)"
            }
          }
        ],
        layout: {
          name: "preset"
        },
        userZoomingEnabled: true,
        userPanningEnabled: true,
        boxSelectionEnabled: false
      });

      // 1. Dotted fault line movement animation
      let offset = 0;
      this._edgeAnimationTimer = setInterval(() => {
        offset = (offset + 1) % 8;
        if (this._cy) {
          this._cy.edges('edge[type="incident-prop"]').style("line-dash-offset", -offset);
        }
      }, 100);

      // Apply theme styles to Cytoscape on boot
      const currentTheme = document.body.classList.contains("nf-theme-light") ? "light" : "dark";
      this._updateCytoscapeThemeStyles(currentTheme);

      // 2. Click node interaction -> UI5 MessageToast details
      this._cy.on("tap", "node", (evt) => {
        const node = evt.target;
        const data = node.data();
        let detailText = `Twin Node: ${data.label}`;
        if (data.info) detailText += ` | ${data.info}`;
        if (data.status) detailText += ` | Status: ${data.status}`;
        
        MessageToast.show(detailText, {
          duration: 3000
        });
      });

      console.log("[App.controller] Digital Twin layout mounted successfully.");
    },

    /**
     * Dynamically spawn an incident node orbiting the target component using the concentric offset math
     */
    addDynamicIncident: function (oEvent) {
      const cy = this._cy;
      if (!cy) return;

      // 1. Resolve target component using Hybrid Smart Resolver
      let targetId = oEvent.targetComponent;
      if (!targetId && oEvent.message) {
        const msg = oEvent.message.toLowerCase();
        if (msg.includes("anomaly") || msg.includes("worker-3") || msg.includes("ingest")) {
          targetId = "wf-1";
        } else if (msg.includes("latency") || msg.includes("etl") || msg.includes("worker-1") || msg.includes("sla")) {
          targetId = "wf-2";
        } else if (msg.includes("gateway") || msg.includes("timeout") || msg.includes("attack") || msg.includes("scan")) {
          targetId = "SECURE";
        }
      }

      if (!targetId || !cy.getElementById(targetId).length) {
        targetId = "ITOPS";
      }

      const targetNode = cy.getElementById(targetId);
      const pos = targetNode.position();

      if (!this._dynamicIncidents) {
        this._dynamicIncidents = {};
      }

      if (!this._dynamicIncidents[targetId]) {
        this._dynamicIncidents[targetId] = [];
      }

      const eventId = oEvent.id || "dyn-inc-" + Date.now();
      if (cy.getElementById(eventId).length) return;

      // Spacing: Calculate concentric polar offsets to avoid node overlaps
      const activeCount = this._dynamicIncidents[targetId].length;
      const radius = 64;
      const angle = activeCount * (Math.PI / 4) + (Math.PI / 6); // Add an angle offset for neatness

      const xNew = pos.x + radius * Math.cos(angle);
      const yNew = pos.y + radius * Math.sin(angle);

      const nodeLabel = oEvent.message.split(":")[0] || "Incident Alert";
      const shortLabel = nodeLabel.length > 20 ? nodeLabel.substring(0, 18) + "..." : nodeLabel;

      console.log(`[App.controller] Spawning incident node ${eventId} around ${targetId} at x:${xNew.toFixed(1)}, y:${yNew.toFixed(1)}`);

      cy.add({
        group: "nodes",
        data: {
          id: eventId,
          label: shortLabel,
          type: "inc",
          status: oEvent.priority.toUpperCase(),
          info: oEvent.message
        },
        position: { x: xNew, y: yNew }
      });

      const edgeId = "edge-" + eventId;
      cy.add({
        group: "edges",
        data: {
          id: edgeId,
          source: eventId,
          target: targetId,
          type: "incident-prop"
        }
      });

      const record = { id: eventId, edgeId: edgeId, targetId: targetId };
      this._dynamicIncidents[targetId].push(record);

      // Trigger 20-second automatic fadeout fallback
      setTimeout(() => {
        this._fadeAndRemoveIncident(targetId, eventId);
      }, 20000);
    },

    /**
     * Gracefully fade out and remove a dynamic incident node and its propagation edge
     */
    _fadeAndRemoveIncident: function (targetId, eventId) {
      const cy = this._cy;
      if (!cy) return;

      const node = cy.getElementById(eventId);
      const edge = cy.getElementById("edge-" + eventId);

      if (node.length > 0) {
        node.animate({
          style: {
            "opacity": 0,
            "border-width": "0px",
            "width": "0px",
            "height": "0px"
          },
          duration: 350
        });
        if (edge.length > 0) {
          edge.animate({
            style: { "opacity": 0 },
            duration: 350
          });
        }

        setTimeout(() => {
          if (this._cy) {
            this._cy.remove(node);
            this._cy.remove(edge);
          }
        }, 360);
      }

      if (this._dynamicIncidents && this._dynamicIncidents[targetId]) {
        this._dynamicIncidents[targetId] = this._dynamicIncidents[targetId].filter(inc => inc.id !== eventId);
      }
    },

    /**
     * Resolve all dynamic incidents orbiting a target component (Explicit recovery trigger)
     */
    resolveDynamicIncident: function (targetId, sMessage) {
      const cy = this._cy;
      if (!cy) return;

      let resolvedTarget = targetId;
      if (!resolvedTarget && sMessage) {
        const msg = sMessage.toLowerCase();
        if (msg.includes("anomaly") || msg.includes("worker-3") || msg.includes("ingest")) {
          resolvedTarget = "wf-1";
        } else if (msg.includes("latency") || msg.includes("etl") || msg.includes("worker-1") || msg.includes("sla")) {
          resolvedTarget = "wf-2";
        } else if (msg.includes("gateway") || msg.includes("timeout") || msg.includes("attack") || msg.includes("scan")) {
          resolvedTarget = "SECURE";
        }
      }

      if (!resolvedTarget) return;

      console.log(`[App.controller] Operational Recovery: Restoring layout status for target: ${resolvedTarget}`);

      const registry = this._dynamicIncidents ? this._dynamicIncidents[resolvedTarget] : null;
      if (registry && registry.length > 0) {
        const list = [...registry];
        list.forEach(inc => {
          this._fadeAndRemoveIncident(resolvedTarget, inc.id);
        });

        MessageToast.show(`Operational Recovery: System health restored on ${resolvedTarget}`, {
          duration: 3000
        });
      }
    },

    /**
     * AI insight action handler
     */
    onInsightAction: function (oEvent) {
      MessageToast.show("Cognitive Inference Analysis Triggered");
    },

    /**
     * Operational Manager Approval Action
     */
    onApproveWorkflowStep: function (oEvent) {
      const oModel = this.getView().getModel("app");
      const aWorkflows = oModel.getProperty("/workflows") || [];
      const oWf = aWorkflows.find(w => w.status === "PENDING_APPROVAL" || w.status === "PendingApproval" || oWf.status === "ESCALATED" || oWf.status === "Escalated");
      
      if (!oWf) {
        MessageToast.show("No workflows are currently pending operator approval.");
        return;
      }

      const sWorkflowId = oWf.id || oWf.ID;
      DebugUtil.log("App.controller", `Operator Action: Submitting approval for Playbook Step sequence 2 on Workflow: ${sWorkflowId}`);

      // Clear dynamic incidents immediately on approve to feel beautifully reactive!
      this.resolveDynamicIncident("wf-3", "Manual operator approval override executed.");

      fetch("/odata/v4/neuro-flow/approveStep", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          workflowId: sWorkflowId,
          notes: "Approved via operator Command Desk Console",
          approved: true
        })
      })
      .then(res => {
        if (!res.ok) throw new Error("Approval OData response was rejected");
        return res.json();
      })
      .then(data => {
        MessageToast.show("Remediation playbook step authorized. Running recovery vectors.");
        this.onRefreshMetrics();
      })
      .catch(err => {
        console.error(err);
        MessageToast.show("Error submitting operational approval.");
      });
    },

    /**
     * Operator Manual Escalation Action
     */
    onEscalateWorkflowManual: function (oEvent) {
      const oModel = this.getView().getModel("app");
      const aWorkflows = oModel.getProperty("/workflows") || [];
      const oWf = aWorkflows.find(w => w.status === "PENDING_APPROVAL" || w.status === "PendingApproval" || w.status === "RUNNING" || w.status === "Running");

      if (!oWf) {
        MessageToast.show("No active workflows found to escalate.");
        return;
      }

      const sWorkflowId = oWf.id || oWf.ID;
      DebugUtil.log("App.controller", `Operator Override: Submitting escalation request for Workflow: ${sWorkflowId}`);

      fetch("/odata/v4/neuro-flow/escalateWorkflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          workflowId: sWorkflowId,
          reason: "Operator manual override from Command Desk."
        })
      })
      .then(res => {
        if (!res.ok) throw new Error("Escalation OData response was rejected");
        return res.json();
      })
      .then(data => {
        MessageToast.show("Workflow escalated successfully to VP Level");
        this.onRefreshMetrics();
      })
      .catch(err => {
        console.error(err);
        MessageToast.show("Error processing manual escalation override.");
      });
    },

    /**
     * Cleanup on exit
     */
    onExit: function () {
      if (this._eventStreamService) {
        this._eventStreamService.stop();
        DebugUtil.log("App.controller", "Socket.IO event stream stopped");
      }

      if (this._diagnosticsTimer) {
        clearInterval(this._diagnosticsTimer);
        this._diagnosticsTimer = null;
      }

      if (this._edgeAnimationTimer) {
        clearInterval(this._edgeAnimationTimer);
        this._edgeAnimationTimer = null;
      }

      if (this._cy) {
        this._cy.destroy();
        this._cy = null;
      }

      this._dynamicIncidents = null;
      DebugUtil.log("App.controller", "Cleanup complete");
    }
  });
});
