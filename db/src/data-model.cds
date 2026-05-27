namespace neuroflow;
using { cuid, managed } from '@sap/cds/common';

entity SensorNode : cuid, managed {
  name        : String(100);
  type        : String(50);
  status      : String(20);
  location    : String(100);
  description : String(250);
}

entity OperationalMetric : cuid, managed {
  sensor      : Association to SensorNode;
  metricType  : String(80);
  value       : Decimal(18,4);
  unit        : String(20);
  timestamp   : DateTime;
}

entity Alert : cuid, managed {
  title       : String(120);
  severity    : String(20);
  status      : String(20);
  description : String(500);
  raisedAt    : DateTime;
  source      : String(100);
  sensor      : Association to SensorNode;
}

entity WorkflowTask : cuid, managed {
  title       : String(120);
  description : String(500);
  status      : String(20);
  priority    : String(20);
  owner       : String(80);
  dueDate     : Date;
}

// Enterprise Type Definitions and Enums
type Priority : String(10) enum {
  Low      = 'LOW';
  Medium   = 'MEDIUM';
  High     = 'HIGH';
  Critical = 'CRITICAL';
};

type WorkflowStatus : String(20) enum {
  Queued          = 'QUEUED';
  Running         = 'RUNNING';
  Paused          = 'PAUSED';
  PendingApproval = 'PENDING_APPROVAL';
  Escalated       = 'ESCALATED';
  Completed       = 'COMPLETED';
  Failed          = 'FAILED';
};

type IncidentStatus : String(15) enum {
  New        = 'NEW';
  Assigned   = 'ASSIGNED';
  InProgress = 'IN_PROGRESS';
  Resolved   = 'RESOLVED';
  Closed     = 'CLOSED';
};

type Severity : String(10) enum {
  Info    = 'INFO';
  Warning = 'WARNING';
  Error   = 'ERROR';
  Fatal   = 'FATAL';
};

type HealthStatus : String(10) enum {
  Healthy  = 'HEALTHY';
  Degraded = 'DEGRADED';
  Critical = 'CRITICAL';
};

type RecStatus : String(15) enum {
  Pending  = 'PENDING';
  Accepted = 'ACCEPTED';
  Rejected = 'REJECTED';
};

// Enterprise Domain Entities
entity Department : cuid, managed {
  code        : String(10);
  name        : String(100);
  description : String(250);
  head        : String(100);
  incidents   : Association to many Incident on incidents.department = $self;
  workflows   : Association to many Workflow on workflows.department = $self;
}

entity Vendor : cuid, managed {
  code        : String(20);
  name        : String(100);
  contactName : String(100);
  email       : String(100);
  phone       : String(30);
  status      : String(20);
  incidents   : Association to many Incident on incidents.vendor = $self;
}

entity Incident : cuid, managed {
  title             : String(150);
  description       : String(1000);
  priority          : Priority;
  status            : IncidentStatus default 'NEW';
  department        : Association to Department;
  vendor            : Association to Vendor;
  workflows         : Association to many Workflow on workflows.incident = $self;
  aiRecommendations : Association to many AIRecommendation on aiRecommendations.incident = $self;
}

entity Workflow : cuid, managed {
  name          : String(100);
  status        : WorkflowStatus default 'QUEUED';
  priority      : Priority;
  progress      : Integer;
  incident      : Association to Incident;
  department    : Association to Department;
  steps         : Composition of many WorkflowStep on steps.workflow = $self;
  slaDuration   : Integer; // duration limit in seconds
  slaStartedAt  : DateTime;
  slaDeadline   : DateTime;
  slaStatus     : String(15) enum { WithinSLA = 'WITHIN_SLA'; Warning = 'SLA_WARNING'; Breached = 'BREACHED'; } default 'WITHIN_SLA';
  assignedRole  : String(80); // e.g. 'MANAGER', 'VP', 'ENGINEER'
  approvalNotes : String(500);
  escalatedTo   : String(80);
}

entity WorkflowStep : cuid, managed {
  workflow     : Association to Workflow;
  stepSequence : Integer;
  name         : String(100);
  status       : String(20) enum { Pending = 'PENDING'; Processing = 'PROCESSING'; Done = 'DONE'; Failed = 'FAILED'; } default 'PENDING';
  description  : String(250);
}

entity AIRecommendation : cuid, managed {
  recommendationText : String(1000);
  confidenceScore    : Decimal(5,2);
  status             : RecStatus default 'PENDING';
  incident           : Association to Incident;
  generatedAt        : DateTime;
}

entity EnterpriseEvent : cuid, managed {
  eventType : String(50);
  source    : String(100);
  payload   : String(2000);
  severity  : Severity;
}

entity SystemHealth : cuid, managed {
  nodeName          : String(100);
  cpuUsage          : Decimal(5,2);
  memoryUsage       : Decimal(5,2);
  diskUsage         : Decimal(5,2);
  status            : HealthStatus;
  activeConnections : Integer;
}

entity Notification : cuid, managed {
  title     : String(150);
  message   : String(500);
  isRead    : Boolean default false;
  recipient : String(100);
  priority  : Priority;
}

entity WorkflowAudit : cuid, managed {
  workflow  : Association to Workflow;
  action    : String(50); // STATUS_CHANGE, STEP_COMPLETE, APPROVAL, ESCALATION, SLA_BREACH
  actor     : String(100);
  details   : String(1000);
  timestamp : DateTime;
}
