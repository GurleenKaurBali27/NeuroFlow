class InsightRenderer {
  constructor() {
    this.layer = 'visualization';
  }

  render(data) {
    return {
      status: 'ready',
      points: Array.isArray(data) ? data.length : 0
    };
  }
}

module.exports = new InsightRenderer();
