using { neuroflow as nf } from '../db/src/data-model';

service CatalogService @(requires:'authenticated-user') {
  entity SensorNodes      as projection on nf.SensorNode;
  entity OperationalMetrics as projection on nf.OperationalMetric;
  entity Alerts           as projection on nf.Alert;
  entity WorkflowTasks    as projection on nf.WorkflowTask;
}

service AnalyticsService @(requires:'authenticated-user') {
  @readonly entity SignalStream as projection on nf.OperationalMetric;
}
