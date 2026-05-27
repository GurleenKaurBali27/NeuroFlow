using { neuroflow as nf } from '../db/src/data-model';

service NeuroFlowService {
  entity Departments      as projection on nf.Department;
  entity Vendors          as projection on nf.Vendor;
  entity Incidents        as projection on nf.Incident;
  entity Workflows        as projection on nf.Workflow;
  entity WorkflowSteps    as projection on nf.WorkflowStep;
  entity AIRecommendations as projection on nf.AIRecommendation;
  entity EnterpriseEvents as projection on nf.EnterpriseEvent;
  entity SystemHealth     as projection on nf.SystemHealth;
  entity Notifications    as projection on nf.Notification;
  entity WorkflowAudits   as projection on nf.WorkflowAudit;

  action approveStep(workflowId: UUID, notes: String, approved: Boolean) returns Workflows;
  action escalateWorkflow(workflowId: UUID, reason: String) returns Workflows;
}
