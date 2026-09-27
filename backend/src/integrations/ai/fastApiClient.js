const env = require('../../config/env');
const mockAiClient = require('./mockAiClient');

class FastApiClient {
  constructor(baseUrl = env.AI_SERVICE_URL) {
    this.baseUrl = baseUrl;
  }

  async predictSign(payload = {}) {
    const { file } = payload;

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
        console.warn('[FastApiClient] No image or frame provided, using mock client fallback');
        return mockAiClient.predictSign(payload);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: mimeType });
      formData.append('file', blob, filename);

      const response = await fetch(`${this.baseUrl}/predict`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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
        `[FastApiClient] AI service unavailable or error: ${err.message}`
      );

      return mockAiClient.predictSign(payload);
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
