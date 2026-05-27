class EventProcessor {
  constructor() {
    this.adapter = 'event-engine';
  }

  normalize(event) {
    return {
      id: event.id || Date.now().toString(),
      type: event.type || 'unknown',
      payload: event.payload || {},
      receivedAt: new Date().toISOString()
    };
  }
}

module.exports = new EventProcessor();
