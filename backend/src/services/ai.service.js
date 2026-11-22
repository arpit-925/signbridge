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

    // Only authenticated users produce persisted prediction records.
    try {
      if (userId) {
        await AiPrediction.create({
          sessionId,
          userId,
          predictionType: 'sign',
          inputPayload: { hasFile: !!file, frameCount: frames.length, language },
          result: result.prediction,
          latencyMs,
          provider: result.provider || 'fastapi',
          status: result.prediction?.success ? 'success' : 'failed',
        });
      }

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
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);

    if (words.length === 0) {
      return { text: cleanText, language, tokens: [] };
    }

    // 2. Level 1: Look up complete words in SignDictionary
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

    // 3. Level 2: Look up individual alphabet letters A-Z for fingerspelling
    const ISL_ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const alphabetEntries = await SignDictionary.find({
      word: { $in: ISL_ALPHABET },
      category: { $in: ['Alphabet', 'alphabet', 'Letter', 'letter', 'Fingerspelling', 'fingerspelling'] },
    }).lean();

    const alphabetMap = new Map();
    alphabetEntries.forEach((entry) => {
      alphabetMap.set(entry.word.toLowerCase(), entry);
    });

    // 4. Build token list with three-level fallback per word
    const tokens = words.map((w) => {
      // --- Level 1: Verified word/phrase sign ---
      const wordMatch = entryMap.get(w);
      if (wordMatch) {
        return {
          word: w,
          displayWord: w,
          animationUrl: wordMatch.animationUrl,
          thumbnail: wordMatch.thumbnail || '',
          category: wordMatch.category || 'ISL Dictionary',
          matched: true,
          fallbackLevel: 1,
          spellingLetters: null,
        };
      }

      // --- Level 2: Alphabet-by-alphabet fingerspelling ---
      const letters = w.split('');
      const letterTokens = letters.map((ch) => {
        const alphEntry = alphabetMap.get(ch);
        return {
          char: ch.toUpperCase(),
          animationUrl: alphEntry ? alphEntry.animationUrl : null,
          thumbnail: alphEntry ? (alphEntry.thumbnail || '') : '',
          available: !!alphEntry,
        };
      });

      const availableLetters = letterTokens.filter((lt) => lt.available);
      const unavailableLetters = letterTokens.filter((lt) => !lt.available).map((lt) => lt.char);

      if (availableLetters.length > 0) {
        return {
          word: w,
          displayWord: w,
          animationUrl: null,
          thumbnail: '',
          category: 'Fingerspelling',
          matched: false,
          fallbackLevel: 2,
          spellingLetters: letterTokens,
          unavailableLetters,
          message:
            unavailableLetters.length > 0
              ? `Showing ${availableLetters.length}/${letters.length} letters. Missing: ${unavailableLetters.join(', ')}`
              : null,
        };
      }

      // --- Level 3: Completely unavailable ---
      return {
        word: w,
        displayWord: w,
        animationUrl: null,
        thumbnail: '',
        category: 'Unavailable',
        matched: false,
        fallbackLevel: 3,
        spellingLetters: letterTokens,
        unavailableLetters: letters.map((c) => c.toUpperCase()),
        message: 'This sign is not currently available. Alphabet spelling is also unavailable for this word.',
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
      if (userId) {
        await AiPrediction.create({
          sessionId,
          userId,
          predictionType: 'object',
          inputPayload: { hasImage: !!image },
          result: result.data,
          latencyMs,
          provider: result.provider || 'mock',
          status: 'success',
        });
      }
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
