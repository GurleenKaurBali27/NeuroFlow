class WorkflowOrchestration {
  constructor() {
    this.pipeline = [];
  }

  enqueue(task) {
    this.pipeline.push({
      ...task,
      createdAt: new Date().toISOString(),
      status: task.status || 'Pending'
    });
    return this.pipeline[this.pipeline.length - 1];
  }
}

module.exports = new WorkflowOrchestration();
