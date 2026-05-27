class EventBus {
  constructor() {
    this.io = null;
  }

  /**
   * Initialize the EventBus with the active Socket.IO server instance
   * 
   * @param {Object} ioInstance - Socket.IO server instance
   */
  init(ioInstance) {
    this.io = ioInstance;
    console.log('[EventBus] Decoupled Event Bus initialized. Ready for Socket.IO broadcasts.');
  }

  /**
   * Publish an operational event to the bus.
   * Decoupled to allow drop-in replacement with SAP Event Mesh in the future.
   * 
   * @param {String} topic - Event topic channel (e.g. 'metric_update', 'workflow_update')
   * @param {Object} payload - Structured event details
   */
  publish(topic, payload) {
    if (!this.io) {
      console.warn(`[EventBus] Warning: Event published to topic "${topic}" but Socket.IO is not initialized yet.`);
      return;
    }

    // 1. Broadcast over local Socket.IO websockets
    this.io.emit(topic, payload);

    // 2. Future-ready SAP Event Mesh integration hooks
    // In production, publish to BTP Event Mesh:
    //   const client = this.getEventMeshClient();
    //   client.publish(`neuroflow/events/${topic}`, JSON.stringify(payload));
    
    // Log telemetry internally
    if (topic === 'operational_event' || topic === 'insight_update') {
      console.log(`[EventBus] [SAP Event Mesh Ready] Broadcasted event to topic "${topic}":`, payload.message || payload.title);
    }
  }
}

module.exports = new EventBus();
