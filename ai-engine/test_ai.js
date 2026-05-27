const assert = require('assert');
const aiEngine = require('./src/aiEngine');
const BaseProvider = require('./src/providers/BaseProvider');
const logger = require('./src/utils/Logger');

// Store original request runner
const originalMakeRequest = BaseProvider.prototype._makeRequest;

// Realistic mock incident
const mockIncident = {
  title: 'GPU Out of Memory Leak',
  description: 'Inference pipeline llama-3-70b leaking CUDA allocation registers under high concurrency.',
  priority: 'CRITICAL',
  status: 'ASSIGNED',
  department: { name: 'AI Engineering', code: 'AIENG' },
  vendor: { name: 'Cognitive Systems Inc', code: 'VEND-COGNITIVE' },
  telemetry: {
    cpuUsage: 94.5,
    memoryUsage: 98.1,
    nodeStatus: 'DEGRADED'
  }
};

// Expected schema outputs
const mockGeminiSuccessResponse = {
  body: JSON.stringify({
    candidates: [
      {
        content: {
          parts: [
            {
              text: JSON.stringify({
                severityScore: 9,
                businessImpact: 'LLM inference requests failing, breaching the 99.9% Uptime SLA constraint.',
                workflowRecommendation: ['Trigger Memory Diagnostics', 'Isolate Affected CUDA Contexts', 'Recycle Target Services'],
                anomalyExplanation: 'Leaking VRAM block references on context recycling in llama-3 GPU allocation layers.',
                escalationPath: 'L3 AI Infrastructure Operations Team'
              })
            }
          ]
        }
      }
    ],
    usageMetadata: {
      promptTokenCount: 140,
      candidatesTokenCount: 180,
      totalTokenCount: 320
    }
  }),
  statusCode: 200,
  latency: 180,
  headers: {}
};

const mockOpenAISuccessResponse = {
  body: JSON.stringify({
    choices: [
      {
        message: {
          content: JSON.stringify({
            severityScore: 9,
            businessImpact: 'LLM response latency spike leads to downstream operational telemetry timeout.',
            workflowRecommendation: ['Recycle Inference Nodes', 'Add Replica Clusters'],
            anomalyExplanation: 'Memory heap exhaustion on GPU driver due to unbounded token cache buffer size.',
            escalationPath: 'L3 AI Platform Infrastructure Ops'
          })
        }
      }
    ],
    usage: {
      prompt_tokens: 155,
      completion_tokens: 190,
      total_tokens: 345
    }
  }),
  statusCode: 200,
  latency: 220,
  headers: {}
};

async function runTests() {
  console.log('\n=============================================');
  console.log('STARTING OPERATIONS AI ENGINE INTEGRATION TESTS');
  console.log('=============================================\n');

  let testCount = 0;
  let passedCount = 0;

  const runTest = async (name, fn) => {
    testCount++;
    try {
      console.log(`\n👉 Running Test ${testCount}: ${name}`);
      await fn();
      passedCount++;
      console.log(`\x1b[32m✓ PASSED: ${name}\x1b[0m`);
    } catch (err) {
      console.error(`\x1b[31m✗ FAILED: ${name}\x1b[0m`);
      console.error(err);
    }
  };

  // Set mock API keys so provider checks pass
  process.env.GEMINI_API_KEY = 'mock-gemini-key';
  process.env.OPENAI_API_KEY = 'mock-openai-key';

  // ----------------------------------------------------
  // TEST 1: Gemini Provider Path
  // ----------------------------------------------------
  await runTest('Gemini Provider Success Loop', async () => {
    BaseProvider.prototype._makeRequest = async function(options, body) {
      assert.strictEqual(options.hostname, 'generativelanguage.googleapis.com');
      assert.strictEqual(options.method, 'POST');
      assert.ok(body.generationConfig.responseMimeType === 'application/json');
      return mockGeminiSuccessResponse;
    };

    const result = await aiEngine.analyzeIncident(mockIncident, { provider: 'gemini', bypassFailover: true });
    
    assert.strictEqual(result.severityScore, 9);
    assert.strictEqual(result.escalationPath, 'L3 AI Infrastructure Operations Team');
    assert.ok(Array.isArray(result.workflowRecommendation));
    assert.strictEqual(result.workflowRecommendation[0], 'Trigger Memory Diagnostics');
  });

  // ----------------------------------------------------
  // TEST 2: OpenAI Provider Path
  // ----------------------------------------------------
  await runTest('OpenAI Provider Success Loop', async () => {
    BaseProvider.prototype._makeRequest = async function(options, body) {
      assert.strictEqual(options.hostname, 'api.openai.com');
      assert.strictEqual(options.method, 'POST');
      assert.strictEqual(body.response_format.type, 'json_object');
      return mockOpenAISuccessResponse;
    };

    const result = await aiEngine.analyzeIncident(mockIncident, { provider: 'openai', bypassFailover: true });
    
    assert.strictEqual(result.severityScore, 9);
    assert.strictEqual(result.workflowRecommendation[0], 'Recycle Inference Nodes');
    assert.ok(result.businessImpact.includes('downstream'));
  });

  // ----------------------------------------------------
  // TEST 3: Rate Limiting & Retry wait
  // ----------------------------------------------------
  await runTest('Exponential Backoff & Rate Limit Retry wait', async () => {
    let attempts = 0;
    
    BaseProvider.prototype._makeRequest = async function() {
      attempts++;
      if (attempts === 1) {
        // Fail with 429 and Retry-After header
        const rateLimitErr = new Error('API returned HTTP 429: Too Many Requests');
        rateLimitErr.statusCode = 429;
        rateLimitErr.headers = { 'retry-after': '1' }; // Wait 1 second
        throw rateLimitErr;
      }
      return mockGeminiSuccessResponse;
    };

    const startTime = Date.now();
    const result = await aiEngine.analyzeIncident(mockIncident, { provider: 'gemini', bypassFailover: true });
    const elapsed = Date.now() - startTime;

    assert.strictEqual(attempts, 2); // First failed, second succeeded
    assert.ok(elapsed >= 1000, `Should observe the 1 second retry-after delay (Elapsed: ${elapsed}ms)`);
    assert.strictEqual(result.severityScore, 9);
  });

  // ----------------------------------------------------
  // TEST 4: Primary to Secondary Failover
  // ----------------------------------------------------
  await runTest('Primary Provider Failure -> Automated Backup Failover', async () => {
    // Force active provider to be gemini so fallback is openai
    process.env.AI_PROVIDER = 'gemini';
    let geminiCalled = false;
    let openaiCalled = false;

    BaseProvider.prototype._makeRequest = async function(options) {
      if (options.hostname.includes('generativelanguage')) {
        geminiCalled = true;
        // Trigger server error on primary
        const serverErr = new Error('HTTP 500: Server Internal Error');
        serverErr.statusCode = 500;
        throw serverErr;
      } else if (options.hostname.includes('openai')) {
        openaiCalled = true;
        return mockOpenAISuccessResponse;
      }
    };

    const result = await aiEngine.analyzeIncident(mockIncident, { bypassFailover: false });
    
    assert.ok(geminiCalled, 'Should attempt Gemini first');
    assert.ok(openaiCalled, 'Should fall back to OpenAI');
    assert.strictEqual(result.severityScore, 9);
    assert.strictEqual(result.workflowRecommendation[0], 'Recycle Inference Nodes');
  });

  // Restore request method
  BaseProvider.prototype._makeRequest = originalMakeRequest;

  console.log('\n=============================================');
  console.log(`TEST SUMMARY: ${passedCount}/${testCount} tests passed.`);
  console.log('=============================================\n');

  if (passedCount === testCount) {
    console.log('\x1b[32m🌟 ALL TESTS COMPLETED SUCCESSFULY! ✓\x1b[0m\n');
    process.exit(0);
  } else {
    console.log('\x1b[31m🛑 SOME TESTS FAILED. CHECK LOGS ABOVE.\x1b[0m\n');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
