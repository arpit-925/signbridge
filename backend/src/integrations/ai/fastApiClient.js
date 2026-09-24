const env = require('../../config/env');
const mockAiClient = require('./mockAiClient');

class FastApiClient {
  constructor(baseUrl = env.AI_SERVICE_URL) {
    this.baseUrl = baseUrl;
  }

  async predictSign(payload = {}) {
    const { file, frames, sessionId, language } = payload;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      let response;
      if (file && file.buffer) {
        // Send multipart form-data to FastAPI /predict
        const formData = new FormData();
        const blob = new Blob([file.buffer], { type: file.mimetype || 'image/jpeg' });
        formData.append('file', blob, file.originalname || 'frame.jpg');

        response = await fetch(`${this.baseUrl}/predict`, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
      } else {
        // Send JSON payload to FastAPI /predict/sign
        response = await fetch(`${this.baseUrl}/predict/sign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ frames, sessionId, language }),
          signal: controller.signal,
        });
      }
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`FastAPI responded with HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.prediction) {
        // Response from /predict/sign
        return {
          prediction: {
            text: data.prediction.text || 'UNKNOWN',
            label: data.prediction.text || null,
            confidence: data.prediction.confidence || 0,
            accepted: data.prediction.accepted ?? true,
            success: data.prediction.text !== 'UNKNOWN' && data.prediction.text !== null,
            message: data.prediction.message || 'Sign recognized',
            provider: 'fastapi',
          },
          provider: 'fastapi',
        };
      }

      // Response from /predict
      return {
        prediction: {
          text: data.label || 'UNKNOWN',
          label: data.label || null,
          confidence: data.confidence || 0,
          accepted: data.accepted ?? false,
          success: data.success ?? false,
          message: data.message || (data.success ? 'Sign recognized' : 'No hand detected'),
          provider: 'fastapi',
        },
        provider: 'fastapi',
      };
    } catch (err) {
      console.warn(`[FastApiClient] AI service unavailable or error: ${err.message}`);
      return {
        prediction: {
          text: null,
          label: null,
          confidence: 0,
          accepted: false,
          success: false,
          message: 'AI service unavailable',
          provider: 'offline',
        },
        provider: 'offline',
      };
    }
  }

  async predictObject(payload) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(`${this.baseUrl}/predict/object`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`FastAPI responded with HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        ...data,
        provider: 'fastapi',
      };
    } catch (err) {
      console.warn(`[FastApiClient] Fallback to mock for object recognition: ${err.message}`);
      return mockAiClient.predictObject(payload);
    }
  }

  async healthCheck() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return {
          status: 'healthy',
          model_loaded: data.model_loaded,
          classes_count: data.classes_count,
          provider: 'FastAPI + MediaPipe + TensorFlow',
          model: 'SignBridge Vision Core',
        };
      }
      return {
        status: 'degraded',
        provider: 'FastAPI + MediaPipe + TensorFlow',
        model: 'SignBridge Vision Core',
      };
    } catch (err) {
      return {
        status: 'offline',
        provider: 'FastAPI + MediaPipe + TensorFlow',
        model: 'SignBridge Vision Core',
        message: 'AI service unavailable',
      };
    }
  }
}

module.exports = new FastApiClient();
