const env = require('../../config/env');
const mockAiClient = require('./mockAiClient');
const fastApiClient = require('./fastApiClient');

class AIClientFactory {
  static getClient() {
    // If AI_SERVICE_URL is defined and not default mock, use fastApiClient with fallback
    if (env.AI_SERVICE_URL && env.AI_SERVICE_URL !== 'mock') {
      return fastApiClient;
    }
    return mockAiClient;
  }
}

module.exports = AIClientFactory.getClient();
