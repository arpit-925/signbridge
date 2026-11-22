const env = require('../../config/env');
const mockAiClient = require('./mockAiClient');

class FastApiClient {
  constructor(baseUrl = env.AI_SERVICE_URL) {
    this.baseUrl = baseUrl;
  }

  async predictSign(payload = {}) {
    const { file } = payload;
    let timeoutId = null;

    try {
      let imageBuffer = null;
      let mimeType = 'image/jpeg';
      let filename = 'frame.jpg';

      if (file && file.buffer) {
        imageBuffer = file.buffer;
        mimeType = file.mimetype || 'image/jpeg';
        filename = file.originalname || 'frame.jpg';
      } else if (payload.image && typeof payload.image === 'string') {
        const matches = payload.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          imageBuffer = Buffer.from(matches[2], 'base64');
        } else {
          imageBuffer = Buffer.from(payload.image, 'base64');
        }
      } else if (Array.isArray(payload.frames) && payload.frames.length > 0 && typeof payload.frames[0] === 'string') {
        const frameStr = payload.frames[0];
        const matches = frameStr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          imageBuffer = Buffer.from(matches[2], 'base64');
        } else {
          imageBuffer = Buffer.from(frameStr, 'base64');
        }
      }

      if (!imageBuffer) {
        return {
          prediction: {
            text: 'UNKNOWN',
            label: null,
            confidence: 0,
            accepted: false,
            success: false,
            message: 'No image or frame buffer provided for sign inference',
            provider: 'fastapi',
          },
          provider: 'fastapi',
        };
      }

      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 35000);

      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: mimeType });
      formData.append('file', blob, filename);

      const response = await fetch(`${this.baseUrl}/predict`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`FastAPI responded with HTTP ${response.status}`);
      }

      const data = await response.json();

      return {
        prediction: {
          text: data.label || 'UNKNOWN',
          label: data.label || null,
          confidence: data.confidence || 0,
          accepted: data.accepted ?? false,
          success: data.success ?? false,
          message:
            data.message ||
            (data.success ? 'Sign recognized' : 'No hand detected'),
          provider: 'fastapi',
        },
        provider: 'fastapi',
      };

    } catch (err) {
      console.warn(
        `[FastApiClient] AI service error or cold start timeout: ${err.message}`
      );

      return {
        prediction: {
          text: 'UNKNOWN',
          label: null,
          confidence: 0,
          accepted: false,
          success: false,
          message: `AI service unavailable: ${err.message}`,
          provider: 'offline',
        },
        provider: 'offline',
      };
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  async predictObject(payload) {
    let timeoutId = null;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${this.baseUrl}/predict/object`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {}),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`FastAPI responded with HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        ...data,
        provider: data.provider || 'fastapi',
      };
    } catch (err) {
      console.warn(`[FastApiClient] Fallback to educational demo for object recognition: ${err.message}`);
      return mockAiClient.predictObject(payload);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  async healthCheck() {
    let timeoutId = null;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
      });

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
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }
}

module.exports = new FastApiClient();
