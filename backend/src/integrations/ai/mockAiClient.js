class MockAiClient {
  constructor() {
    this.dictionarySigns = [
      { label: 'hello', confidence: 0.98, translationEn: 'Hello', translationHi: 'नमस्ते' },
      { label: 'thank_you', confidence: 0.96, translationEn: 'Thank You', translationHi: 'धन्यवाद' },
      { label: 'good_morning', confidence: 0.94, translationEn: 'Good Morning', translationHi: 'शुभ प्रभात' },
      { label: 'water_cycle', confidence: 0.92, translationEn: 'Water Cycle', translationHi: 'जल चक्र' },
      { label: 'gravity', confidence: 0.95, translationEn: 'Gravity', translationHi: 'गुरुत्वाकर्षण' },
      { label: 'community', confidence: 0.91, translationEn: 'Community', translationHi: 'समुदाय' },
      { label: 'leader', confidence: 0.93, translationEn: 'Leader', translationHi: 'नेता' },
      { label: 'police', confidence: 0.90, translationEn: 'Police', translationHi: 'पुलिस' },
      { label: 'fractions', confidence: 0.89, translationEn: 'Fractions', translationHi: 'भिन्न' },
    ];

    this.mockObjects = [
      {
        object: 'Notebook / Book',
        confidence: 0.97,
        description: 'A portable pad of paper for school work and taking down learning notes.',
        signInstructions: {
          text: 'Clasp palms flat together, then pivot them open at the wrist like opening book pages.',
          icons: ['✋', '📖'],
        },
      },
      {
        object: 'Apple',
        confidence: 0.98,
        description: 'A round fruit with red or green skin and a whitish inside.',
        signInstructions: {
          text: 'Place the knuckle of your right index finger against your cheek and twist it back and forth.',
          icons: ['🍎', '✊'],
        },
      },
      {
        object: 'Computer',
        confidence: 0.95,
        description: 'An electronic device for storing and processing data.',
        signInstructions: {
          text: 'Form a "C" handshape with your right hand and move it up your left forearm.',
          icons: ['💻', '🖥️'],
        },
      },
      {
        object: 'Pencil',
        confidence: 0.96,
        description: 'An instrument for writing or drawing consisting of a thin stick of graphite.',
        signInstructions: {
          text: 'Hold thumb and index fingers together like holding a pencil and mimic writing on your open palm.',
          icons: ['✏️', '✍️'],
        },
      },
    ];
  }

  async predictSign({ frames = [], sessionId = 'default', language = 'en' }) {
    // Pick based on session or cycle through
    const index = Math.floor(Math.random() * this.dictionarySigns.length);
    const item = this.dictionarySigns[index] || this.dictionarySigns[0];

    return {
      success: true,
      prediction: {
        label: item.label,
        confidence: item.confidence,
        text: language === 'hi' ? item.translationHi : item.translationEn,
      },
      language,
      sessionId,
      provider: 'mock',
    };
  }

  async predictObject({ image, sessionId = 'default' }) {
    const index = Math.floor(Math.random() * this.mockObjects.length);
    const obj = this.mockObjects[index];

    return {
      success: true,
      data: obj,
      sessionId,
      provider: 'mock',
    };
  }

  async healthCheck() {
    return { status: 'healthy', provider: 'mock', uptime: process.uptime() };
  }
}

module.exports = new MockAiClient();
