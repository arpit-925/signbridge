const express = require('express');
const aiController = require('../controllers/ai.controller');
const { aiLimiter } = require('../middleware/rateLimiter');
const { verifyAccessToken } = require('../utils/token');
const User = require('../models/User');

const router = express.Router();

// Optional authentication middleware: if token present, attach user
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      req.user = await User.findById(decoded.id);
    }
  } catch (err) {
    // Ignore invalid token in optionalAuth
  }
  next();
};

const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Middleware to extract first uploaded file to req.file
const handleFileUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) return next(err);
    if (req.files && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};

router.use(aiLimiter);
router.use(optionalAuth);

router.post('/sign/predict', handleFileUpload, aiController.predictSign);
router.post('/text-to-sign', aiController.textToSign);
router.post('/object-recognition', handleFileUpload, aiController.predictObject);
router.get('/health', aiController.health);

module.exports = router;
