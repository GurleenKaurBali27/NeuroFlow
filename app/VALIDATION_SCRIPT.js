/**
 * VALIDATION SCRIPT - Run in browser console to verify refactoring
 * 
 * Usage in browser console:
 *   1. Copy entire script
 *   2. Paste into browser console
 *   3. Press Enter
 *   4. Check validation results
 */

(function() {
  console.group("🔍 NeuroFlow Refactoring Validation");
  
  const checks = {
    passed: 0,
    failed: 0,
    results: []
  };

  function check(name, condition, details) {
    const status = condition ? "✅ PASS" : "❌ FAIL";
    checks.results.push({ name, status, condition, details });
    if (condition) {
      checks.passed++;
    } else {
      checks.failed++;
    }
    console.log(`${status} ${name}`, details || "");
  }

  // Check 1: Debug utilities initialized
  check(
    "Debug Utils Initialized",
    typeof window.__NeuroFlowDebug !== "undefined",
    window.__NeuroFlowDebug ? "Available at window.__NeuroFlowDebug" : "Missing"
  );

  // Check 2: Model attached
  check(
    "App Model Attached",
    typeof window.__NeuroFlowModel !== "undefined",
    window.__NeuroFlowModel ? "Available at window.__NeuroFlowModel" : "Missing"
  );

  // Check 3: Controller attached
  check(
    "Controller Available",
    typeof window.__NeuroFlowController !== "undefined",
    window.__NeuroFlowController ? "Available at window.__NeuroFlowController" : "Missing"
  );

  // Check 4: Audit logs initialized
  check(
    "Audit Logs Initialized",
    Array.isArray(window.__NeuroFlowLogs),
    `${(window.__NeuroFlowLogs || []).length} log entries`
  );

  // Check 5-8: Model arrays exist and are arrays
  const model = window.__NeuroFlowModel;
  if (model) {
    const data = model.getData();
    check("Events Array Exists", Array.isArray(data.events), `${data.events?.length || 0} events`);
    check("Insights Array Exists", Array.isArray(data.insights), `${data.insights?.length || 0} insights`);
    check("Workflows Array Exists", Array.isArray(data.workflows), `${data.workflows?.length || 0} workflows`);
    check("KPIs Array Exists", Array.isArray(data.kpis), `${data.kpis?.length || 0} kpis`);
  }

  // Check 9: Event stream running
  if (window.__NeuroFlowController && window.__NeuroFlowController._eventStreamService) {
    const stats = window.__NeuroFlowController._eventStreamService.getStats();
    check("Event Stream Running", stats.running === true, `Tick count: ${stats.tickCount}`);
  }

  // Check 10-11: Health data structure
  if (model) {
    const data = model.getData();
    check("Health Object Exists", typeof data.health === "object", "Health indicators present");
    check("Metrics Object Exists", typeof data.metrics === "object", "Metrics present");
  }

  // Check 12: First event has correct schema
  if (model) {
    const data = model.getData();
    const firstEvent = data.events?.[0];
    if (firstEvent) {
      check(
        "Event Schema Valid",
        firstEvent.id && firstEvent.type && firstEvent.message && firstEvent.priority,
        `Event: ${firstEvent.id}`
      );
    }
  }

  // Check 13: First insight has correct schema
  if (model) {
    const data = model.getData();
    const firstInsight = data.insights?.[0];
    if (firstInsight) {
      check(
        "Insight Schema Valid",
        firstInsight.id && firstInsight.title && firstInsight.summary && firstInsight.severity,
        `Insight: ${firstInsight.id}`
      );
    }
  }

  // Check 14: First workflow has correct schema
  if (model) {
    const data = model.getData();
    const firstWorkflow = data.workflows?.[0];
    if (firstWorkflow) {
      check(
        "Workflow Schema Valid",
        firstWorkflow.id && firstWorkflow.name && firstWorkflow.status && firstWorkflow.owner,
        `Workflow: ${firstWorkflow.id}`
      );
    }
  }

  // Check 15: Model binding diagnostics
  const controller = window.__NeuroFlowController;
  if (controller) {
    const view = controller.getView();
    const eventList = view.byId("eventFeed");
    check(
      "Event List Control Found",
      eventList !== null && eventList !== undefined,
      eventList ? `List ID: ${eventList.getId()}` : "Not found"
    );
  }

  // Summary
  console.log("\n");
  console.table(checks.results);
  
  const totalTests = checks.passed + checks.failed;
  const passPercentage = ((checks.passed / totalTests) * 100).toFixed(1);
  
  console.groupEnd();
  
  console.group("📊 Summary");
  console.log(`Total: ${totalTests} tests`);
  console.log(`Passed: ${checks.passed} ✅`);
  console.log(`Failed: ${checks.failed} ❌`);
  console.log(`Pass Rate: ${passPercentage}%`);
  console.groupEnd();

  if (checks.failed === 0) {
    console.log(
      "%c🎉 All checks passed! NeuroFlow is ready for enterprise operations.",
      "color: #40d38a; font-weight: bold; font-size: 14px"
    );
  } else {
    console.log(
      "%c⚠️ Some checks failed. Review the validation results above.",
      "color: #ff6b6b; font-weight: bold; font-size: 14px"
    );
  }

  // Available debug commands
  console.group("📋 Available Debug Commands");
  console.log("Dump Model State:");
  console.log("  __NeuroFlowDebug.dumpModelState(__NeuroFlowModel, 'app')");
  console.log("\nInspect Events Array:");
  console.log("  __NeuroFlowDebug.inspectArray(__NeuroFlowModel, '/events')");
  console.log("\nValidate Bindings:");
  console.log("  __NeuroFlowDebug.validateBindings(__NeuroFlowController.getView(), 'app')");
  console.log("\nGet Audit Log:");
  console.log("  __NeuroFlowDebug.getAuditLog(50)");
  console.log("\nExport Diagnostics:");
  console.log("  __NeuroFlowDebug.exportDiagnostics(__NeuroFlowModel)");
  console.groupEnd();
})();
