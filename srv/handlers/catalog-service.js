const cds = require('@sap/cds');

module.exports = cds.service.impl(function() {
  const { Alerts, WorkflowTasks } = this.entities;

  this.after('READ', Alerts, row => {
    row.severity = row.severity || 'Normal';
  });

  this.after('READ', WorkflowTasks, row => {
    row.status = row.status || 'Pending';
  });
});
