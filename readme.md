# 🧠 NeuroFlow

### *AI-Native Enterprise Operational Intelligence & Digital Twin Command Center*

[![SAP BTP Ready](https://img.shields.io/badge/SAP%20BTP-Ready-blue?style=for-the-badge&logo=sap&logoColor=white&color=008FD3)](https://www.sap.com/products/technology-platform.html)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D%2018-blue?style=for-the-badge&logo=node.js&logoColor=white&color=339933)](https://nodejs.org/)
[![License MIT](https://img.shields.io/badge/license-MIT-green?style=for-the-badge&color=4CAF50)](https://opensource.org/licenses/MIT)
[![Platform Status](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge&color=2e7d32)](#)
[![AI Architecture](https://img.shields.io/badge/AI--Native-Operational%20Command-purple?style=for-the-badge)](#)

---

## 🌐 1. Vision & Overview

**NeuroFlow** is an AI-native operational command center for enterprise infrastructure. Powered by the **SAP Cloud Application Programming Model (CAP)** and **SAP UI5**, NeuroFlow bridges the gap between raw backend event streams and high-level executive decision-making. It provides real-time telemetry streaming, interactive digital twin topologies, and predictive SLA risk inference.

---

## 📷 2. Visual Previews

The platform gives infrastructure command teams an instantaneous real-time visual grasp of logical topology, data flows, and active incidents.

### 🖥️ Enterprise Operational Dashboard
The dashboard aggregates live event telemetry (CPU load, memory, error rates, and system-wide SLA metrics).

![Operational Dashboard Preview](assets/dashboard-preview.png)
> *Figure 1: High-fidelity operational command center dashboard showing live event metrics and SLA warning thresholds.*

### 🕸️ Digital Twin Topology View
Interactive physical and logical network node diagrams powered by `Cytoscape.js`, dynamically updating latency metrics and state degradation colors.

![Digital Twin Visualization](assets/digital-twin.png)
> *Figure 2: Real-time network and database topology visualization mapped using Cytoscape.js and live Socket.IO events.*

---

## ⚙️ 3. Core Architecture & Engines

NeuroFlow acts as a centralized operational nervous system using five tightly integrated modules:

*   **⚡ Real-Time Ingestion**: A low-latency streaming pipeline powered by Socket.IO pushing database actions and telemetry straight to clients.
*   **🧠 AI Cognitive Inference**: A predictive engine parsing log parameters, computing historical anomaly risks, and evaluating SLA breach probabilities.
*   **🕸️ Digital Twin Mapping**: High-performance layout rendering hardware and software hierarchies dynamically with Cytoscape.js.
*   **⏱️ SLA Watchdog**: Temporal compliance trackers with progressive escalation pathways for rapid incident remediation.
*   **☁️ SAP Enterprise Integration**: Ready-to-go OData V4 services built on CAP, optimized for SAP Business Technology Platform (BTP) and SAP HANA Cloud.

---

## 📊 4. System Architecture Diagram

This diagram displays the unified flow of telemetry, architectural boundaries, and communication protocols built within the NeuroFlow platform.

```mermaid
graph TB
    %% Layout Configuration
    subgraph ClientLayer ["💻 Client Layer (SAP UI5 Application)"]
        UI5["🖥️ Shell View"]
        Cytoscape["🕸️ Digital Twin (Cytoscape.js)"]
        SocketClient["⚡ Socket.IO Client"]
        ModelManager["📦 Central ModelManager (Immutable)"]
        DebugUtil["🔍 DebugUtil Logger"]

        UI5 --> Cytoscape
        UI5 --> ModelManager
        SocketClient --> ModelManager
        DebugUtil --> ModelManager
    end

    subgraph ServiceLayer ["⚙️ Service Orchestration Layer (SAP CAP & Node.js)"]
        Express["🌐 Express.js Server"]
        CAP["🛡️ SAP CAP Services (OData v4)"]
        SocketServer["⚡ Socket.IO Server"]
        EventEngine["📡 Event Stream Engine"]
        AIEngine["🧠 Cognitive Inference Engine"]

        Express --> CAP
        Express --> SocketServer
        CAP --> EventEngine
        CAP --> AIEngine
    end

    subgraph DataLayer ["🗄️ Persistence Layer"]
        DB[("💾 Enterprise DB <br> SQLite / SAP HANA Cloud")]
    end

    %% Flow Connections
    UI5 == "OData V4 (HTTPS)" ==> CAP
    SocketClient == "WebSockets" ==> SocketServer
    EventEngine == "Push Live Events" ==> SocketServer
    CAP == "CDS ORM" ==> DB
    AIEngine == "Audit Logs" ==> DB

    %% Styling & Colors
    classDef client fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef service fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#f8fafc;
    classDef db fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#f8fafc;

    class UI5,Cytoscape,SocketClient,ModelManager,DebugUtil client;
    class Express,CAP,SocketServer,EventEngine,AIEngine service;
    class DB db;

    %% Global Theme Overrides
    style ClientLayer fill:#0b1329,stroke:#1e293b,stroke-width:2px,color:#38bdf8;
    style ServiceLayer fill:#111029,stroke:#1e293b,stroke-width:2px,color:#818cf8;
    style DataLayer fill:#041a16,stroke:#1e293b,stroke-width:2px,color:#34d399;
```

---

## 🔄 5. Operational Incident Lifecycle

```mermaid
sequenceDiagram
    autonumber
    participant EventEngine as Event Engine
    participant AIEngine as AI Cognitive Engine
    participant SLAMonitor as SLA Compliance Monitor
    participant SocketServer as Socket.IO Server
    participant UI5App as SAP UI5 Digital Twin

    rect rgb(20, 24, 33)
        note right of EventEngine: Phase 1: Ingest & Predict
        EventEngine->>AIEngine: Telemetry Anomaly Detected
        AIEngine->>AIEngine: Cognitive Inference (Breach Risk Evaluation)
    end

    rect rgb(20, 24, 33)
        note right of AIEngine: Phase 2: Act & Stream
        AIEngine->>SLAMonitor: Initialize SLA Watchdog (15m Threshold)
        SLAMonitor->>SocketServer: Broadcast SLA & Workflow State Live
        SocketServer->>UI5App: Push Real-Time Event (Socket.IO Stream)
    end

    rect rgb(20, 24, 33)
        note right of UI5App: Phase 3: Visualize & Update
        UI5App->>UI5App: Update Immutable ModelManager State
        UI5App->>UI5App: Refresh Digital Twin Layout (Cytoscape.js)
    end
```

---

## 🛠️ 6. Technical Stack

| Layer | Technology | Primary Purpose |
|---|---|---|
| **Frontend Shell** | **SAP UI5 (v1.120+)** | Enterprise XML views and declarative model binding. |
| **Digital Twin** | **Cytoscape.js** | Interactive network topology visualizations. |
| **Streaming** | **Socket.IO** | Bi-directional websocket stream for raw events. |
| **State Management**| **Immutable ModelManager** | Thread-safe, non-mutating UI state updates. |
| **Backend Core** | **SAP CAP (Node.js)** | Declarative CDS schemas & OData V4 services. |
| **Server Framework**| **Express.js (v5.0)** | Base HTTP routing and hardened header controls. |
| **Persistence** | **SQLite / SAP HANA** | Seamless local sandbox to cloud HANA database scaling. |

---

## 🚀 7. Installation & Quick Start

### 📋 Prerequisites
1. **Node.js** (v18.x or v20.x LTS)
2. **SAP CDS Toolkit**: `npm i -g @sap/cds-dk`
3. **SAP UI5 CLI**: `npm i -g @ui5/cli`

### 🔧 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Deploy local SQLite database schema
npm run db:init

# 3. Spin up the SAP CAP backend watcher & Socket.IO server
npm run dev:backend

# 4. Spin up the SAP UI5 frontend (in a separate terminal)
npm run dev:frontend
```

Open **`http://localhost:8080/index.html`** in your browser to view the operational command center.

---

## 📄 8. Licensing

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more details.
