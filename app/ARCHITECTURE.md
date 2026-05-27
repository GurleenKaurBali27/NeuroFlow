# NeuroFlow UI5 Enterprise Architecture - Refactored

## Overview

This document describes the refactored, enterprise-grade frontend architecture for NeuroFlow, addressing model binding stability, aggregation rendering, live updates, and cache consistency.

## 1. CENTRALIZED MODEL ARCHITECTURE

### Single Source of Truth: ModelManager.js

**Location**: `app/webapp/model/ModelManager.js`

The ModelManager enforces a strict schema and provides immutable update patterns:

```javascript
// Model is created with guaranteed schema
const appModel = ModelManager.createAppModel();
```

#### Guaranteed Schema Structure

```javascript
{
  metrics: {
    latency: { value, display, unit, trend },
    errors: { value, display, unit, trend },
    throughput: { value, display, unit, trend }
  },
  
  health: {
    cpu,
    memory,
    nodeStatus,
    incidents,
    throughput,
    timestamp
  },
  
  kpis: [
    { id, label, value, trend },
    // ...
  ],
  
  events: [
    { id, type, message, priority, timestamp },
    // ...
  ],
  
  workflows: [
    { id, name, status, owner, progress, updatedAt },
    // ...
  ],
  
  insights: [
    { id, title, summary, severity, timestamp, actionable },
    // ...
  ]
}
```

### Immutable Update Patterns

**CRITICAL**: Never mutate arrays directly. Always use ModelManager methods:

```javascript
// ❌ WRONG - Direct mutation (breaks UI5 binding)
const events = model.getProperty("/events");
events.push(newEvent);

// ✅ CORRECT - Immutable replacement
ModelManager.updateEventsList(model, newEvent);
```

#### Available Update Methods

| Method | Purpose |
|--------|---------|
| `updateEventsList(model, newEvent)` | Add event (immutable) |
| `updateInsightsList(model, newInsight)` | Add insight (immutable) |
| `updateWorkflowProgress(model, workflowId, progress)` | Update workflow progress |
| `updateWorkflowStatus(model, workflowId, status)` | Update workflow status |
| `updateMetrics(model, metricKey, value)` | Update metric value |
| `updateHealth(model, key, value)` | Update health indicator |

## 2. STRICT DATA SCHEMA DEFINITIONS

### Insights Schema
```javascript
{
  id: string,              // Unique identifier
  title: string,          // Brief title
  summary: string,        // Detailed description
  severity: string,       // 'high' | 'medium' | 'low' | 'info'
  timestamp: ISO8601,     // Creation timestamp
  actionable: boolean     // Whether user can take action
}
```

### Events Schema
```javascript
{
  id: string,              // Unique identifier
  type: string,           // 'system' | 'alert' | 'metric' | 'workflow' | etc
  message: string,        // Event description
  priority: string,       // 'info' | 'warning' | 'error' | 'success'
  timestamp: ISO8601      // Event timestamp
}
```

### Workflows Schema
```javascript
{
  id: string,              // Unique identifier
  name: string,           // Workflow name
  status: string,         // 'Running' | 'Queued' | 'Completed' | 'Failed'
  owner: string,          // Team/owner name
  progress: number,       // 0-100 percentage
  updatedAt: ISO8601      // Last update timestamp
}
```

### KPIs Schema
```javascript
{
  id: string,              // Unique identifier
  label: string,          // Display label
  value: string,          // Display value
  trend: string           // 'up' | 'down' | 'stable'
}
```

## 3. CACHE INVALIDATION & MODULE LOADING

### Browser Cache Busting

**index.html** includes:
- HTTP headers: `Cache-Control: no-cache, no-store, must-revalidate`
- Version query strings: `?v=1.0.0`

**server.js** enforces:
- All `.js`, `.css`, `.xml` files served with no-cache headers
- Prevents browser from loading stale JavaScript modules

### Module Path Resolution

```javascript
// manifest.json configures resource roots
"sap.ui": {
  "resourceroots": {
    "neuroflow": "./"
  }
}
```

**Hard cache busting** happens automatically when:
1. Application is reloaded with `Ctrl+Shift+R`
2. Server enforces no-cache headers
3. Version in manifest is updated

## 4. AGGREGATION BINDING FIXES

### XML View Binding Patterns

**CRITICAL**: All list bindings must use absolute paths with model prefix:

```xml
<!-- ✅ CORRECT - Absolute path with model prefix -->
<List items="{app>/events}" mode="None">
  <StandardListItem 
    title="{app>message}" 
    info="{app>priority}" 
    description="{app>timestamp}" 
    type="Inactive" />
</List>

<!-- ❌ WRONG - Relative paths cause binding issues -->
<List items="{/events}">
  <StandardListItem title="{message}" />
</List>
```

### Binding Path Rules

1. **List aggregation**: `items="{app>/arrayName}"`
2. **Item properties**: `property="{app>fieldName}"`
3. **No mixed prefixes**: Use same model prefix consistently
4. **ListItem type**: Set `type="Inactive"` to prevent auto-selection
5. **Mode**: Set `mode="None"` to disable selection interactions

### Template Lifecycle

- `StandardListItem` used instead of custom templates for stability
- No `templateShareable=true` needed for standard items
- Automatic recycling handled by UI5 framework

## 5. LIVE EVENT STREAM ENGINE

### EventStreamService.js

**Location**: `app/webapp/service/EventStreamService.js`

Generates enterprise operational events every 2 seconds:

```javascript
EventStreamService.start(appModel, ModelManager, 2000);
```

#### Event Generation

- Simulates realistic operational metrics
- Uses immutable array patterns with ModelManager
- Triggers proper UI5 binding refresh
- Validates schema integrity

#### Generated Event Types

| Type | Example | Priority |
|------|---------|----------|
| trigger | Anomaly detector fired | info |
| alert | High memory pressure | warning |
| metric | P99 latency spike | warning |
| workflow | Pipeline completed | success |
| error | Retry exhausted | error |
| scaling | Auto-scaling triggered | info |
| recovery | Node recovered | success |
| schedule | Backup cycle started | info |

## 6. INITIAL DATA HYDRATION

### Guaranteed Hydration on Load

ModelManager provides complete initial datasets:

- **3 KPIs** with live update values
- **3 Workflows** (various states)
- **3 AI Insights** with severity levels
- **1 System Event** (initialization)
- **System Health** indicators

```javascript
// Immediate population when model is created
const appModel = ModelManager.createAppModel();
// All arrays already populated - no "No data" state
```

### Array Size Management

- **Events**: Max 50 entries (FIFO rollover)
- **Insights**: Max 20 entries (FIFO rollover)
- **Workflows**: No limit (retain all)
- **KPIs**: Fixed set (no growth)

## 7. CONTROLLER REFACTORING

### App.controller.js

**Location**: `app/webapp/controller/App.controller.js`

#### Lifecycle: onInit()

1. Initialize debugging utilities (`DebugUtil.init()`)
2. Create app model (`ModelManager.createAppModel()`)
3. Attach model to view with `app` model name
4. Validate schema immediately
5. Start event stream (2s interval)
6. Start periodic diagnostics (15s interval)
7. Make controller globally accessible for debugging

#### Lifecycle: onExit()

1. Stop event stream
2. Stop diagnostics timer
3. Log cleanup

#### Controller Pattern

```javascript
onInit: function() {
  // 1. Setup model BEFORE anything else
  const appModel = ModelManager.createAppModel();
  this.getView().setModel(appModel, "app");
  
  // 2. Initialize event stream
  EventStreamService.start(appModel, ModelManager, 2000);
  
  // 3. Store references
  this._appModel = appModel;
  this._eventStreamService = EventStreamService;
}
```

### Event Handlers

- `onRefreshMetrics()`: Trigger manual event stream tick
- Navigation handlers: `onNavHome()`, `onNavWorkflows()`, etc.
- `onInsightAction()`: AI insight actions

## 8. ENTERPRISE DEBUGGING UTILITIES

### DebugUtil.js

**Location**: `app/webapp/util/DebugUtil.js`

Provides comprehensive diagnostics and monitoring:

#### Key Methods

| Method | Purpose |
|--------|---------|
| `log(source, message, data)` | Structured logging with color |
| `error(source, message, error)` | Error logging with stack trace |
| `validateBindings(view, modelName)` | Check binding consistency |
| `dumpModelState(model, name)` | Full model state inspection |
| `inspectArray(model, arrayPath)` | Inspect specific array |
| `traceBinding(control, path)` | Debug binding evaluation |
| `measureUpdate(label, fn)` | Performance monitoring |
| `getAuditLog(limit)` | Recent operations log |
| `exportDiagnostics(model)` | Export as JSON |

#### Browser Console Access

```javascript
// Global access
window.__NeuroFlowDebug  // DebugUtil instance
window.__NeuroFlowModel  // App model
window.__NeuroFlowController  // App controller
window.__NeuroFlowLogs  // Audit log (500-entry buffer)

// Example usage in console
__NeuroFlowDebug.dumpModelState(__NeuroFlowModel, "app");
__NeuroFlowDebug.inspectArray(__NeuroFlowModel, "/events");
__NeuroFlowDebug.validateBindings(
  __NeuroFlowController.getView(), 
  "app"
);
```

#### Structured Logging Format

```
[HH:MM:SS] [Source] Message
  └─ Data: { ... }
```

All logs stored in `window.__NeuroFlowLogs` with timestamps.

## 9. PERFORMANCE & STABILITY

### Binding Refresh

- **Immutable updates**: Use `model.setProperty()` for arrays
- **No direct mutations**: Never use `.push()`, `.pop()`, etc.
- **Automatic refresh**: UI5 detects property changes
- **Efficient batching**: Updates batched in event stream ticks

### Memory Management

- Events: 50-entry circular buffer
- Insights: 20-entry circular buffer
- Audit logs: 500-entry circular buffer
- Automatic FIFO cleanup

### Polling & Timers

- Event stream: 2-second intervals
- Diagnostics: 15-second intervals
- Stale modules: Prevented by cache headers

## 10. UI CONSISTENCY

### Visual Elements

- Futuristic operational intelligence design
- Animated KPI cards with gradient backgrounds
- Live event feed with color-coded priorities
- Workflow progress tracking
- AI insight severity indicators

### Responsive Layout

- Left navigation rail (72px)
- Central canvas (70% width)
- Right AI panel (320px)
- Flexbox-based, full-height layout

### Color Scheme (CSS Variables)

```css
--nf-bg: #0b0f14              /* Main background */
--nf-panel: #0f1720           /* Panel background */
--nf-accent: #00d1ff          /* Cyan accent */
--nf-success: #40d38a         /* Green success */
--nf-danger: #ff6b6b          /* Red error */
```

## Architecture Benefits

✅ **Single Source of Truth**: ModelManager controls all data
✅ **Immutable Updates**: No hidden mutations
✅ **Stable Bindings**: Consistent path usage
✅ **Live Updates**: Continuous event stream
✅ **Cache Control**: No stale modules
✅ **Debugging**: Comprehensive utilities
✅ **Performance**: Optimized refresh patterns
✅ **Enterprise Ready**: Audit trails and diagnostics

## Troubleshooting

### Lists Show "No data"

1. Check: `window.__NeuroFlowDebug.dumpModelState(__NeuroFlowModel)`
2. Verify: Array exists and has items
3. Check bindings: `window.__NeuroFlowDebug.validateBindings(view, "app")`

### Stale JavaScript

1. Hard refresh: `Ctrl+Shift+R`
2. Check: Network tab shows `cache-control: no-cache`
3. Verify: `http://localhost:4004/api/debug/modules`

### Metrics Not Updating

1. Check event stream: `__NeuroFlowController._eventStreamService.getStats()`
2. Verify binding paths use `app>` prefix
3. Inspect model: `__NeuroFlowDebug.inspectArray(__NeuroFlowModel, "/events")`

## Next Steps

1. ✅ Model binding fixed
2. ✅ Aggregation rendering stabilized
3. ✅ Live updates working
4. ✅ Cache consistency enforced
5. Ready for: Scale testing, custom event sources, multi-user features
