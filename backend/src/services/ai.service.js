const aiClient = require('../integrations/ai/aiClient');
const SignDictionary = require('../models/SignDictionary');
const AiPrediction = require('../models/AiPrediction');
const ConversionHistory = require('../models/ConversionHistory');
const { BadRequestError } = require('../utils/errors');

class AiService {
  async predictSign({ file = null, sessionId = `sess_${Date.now()}`, frames = [], language = 'en', userId = null }) {
    const startTime = Date.now();
    const result = await aiClient.predictSign({ file, sessionId, frames, language });
    const latencyMs = Date.now() - startTime;

    // Log prediction asynchronously
    try {
      await AiPrediction.create({
        sessionId,
        userId: userId || undefined,
        predictionType: 'sign',
        inputPayload: { hasFile: !!file, frameCount: frames.length, language },
        result: result.prediction,
        latencyMs,
        provider: result.provider || 'fastapi',
        status: result.prediction?.success ? 'success' : 'failed',
      });

      if (userId && result.prediction?.text && result.prediction?.accepted) {
        await ConversionHistory.create({
          userId,
          inputType: 'sign',
          predictedText: result.prediction.text,
          confidence: result.prediction.confidence,
          language,
          sessionId,
        });
      }
    } catch (logErr) {
      console.warn('[AiService] Failed to log prediction:', logErr.message);
    }

    return result;
  }

  async textToSign({ text, language = 'en' }) {
    if (!text || typeof text !== 'string') {
      throw new BadRequestError('Text input is required');
    }

    // 1. Normalize and clean
    const cleanText = text.trim();
    // Tokenize into words
    const words = cleanText
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);

    // 2. Look up in SignDictionary
    const dictionaryEntries = await SignDictionary.find({
      $or: [
        { word: { $in: words } },
        { aliases: { $in: words } },
      ],
    }).lean();

    const entryMap = new Map();
    dictionaryEntries.forEach((entry) => {
      entryMap.set(entry.word.toLowerCase(), entry);
      if (entry.aliases) {
        entry.aliases.forEach((a) => entryMap.set(a.toLowerCase(), entry));
      }
    });

    // 3. Map tokens
    const tokens = words.map((w) => {
      const match = entryMap.get(w);
      if (match) {
        return {
          word: w,
          animationUrl: match.animationUrl,
          thumbnail: match.thumbnail || '',
          category: match.category || 'General',
          matched: true,
        };
      }

      // Fallback for letters / spelling or generic sign placeholder
      return {
        word: w,
        animationUrl: `/media/signs/${w}.mp4`,
        thumbnail: '',
        category: 'Spelled',
        matched: false,
      };
    });

    return {
      text: cleanText,
      language,
      tokens,
    };
  }

  async predictObject({ image, sessionId = `obj_${Date.now()}`, userId = null }) {
    const startTime = Date.now();
    const result = await aiClient.predictObject({ image, sessionId });
    const latencyMs = Date.now() - startTime;

    try {
      await AiPrediction.create({
        sessionId,
        userId: userId || undefined,
        predictionType: 'object',
        inputPayload: { hasImage: !!image },
        result: result.data,
        latencyMs,
        provider: result.provider || 'mock',
        status: 'success',
      });
    } catch (logErr) {
      console.warn('[AiService] Failed to log object prediction:', logErr.message);
    }

    return result;
  }

  async health() {
    return aiClient.healthCheck();
  }
}

module.exports = new AiService();
