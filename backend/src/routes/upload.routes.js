const express = require('express');
const multer = require('multer');
const path = require('path');
const storageService = require('../config/cloud');
const { authenticate } = require('../middleware/auth');
const { successResponse } = require('../utils/response');
const { BadRequestError } = require('../utils/errors');

const router = express.Router();

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|mp4|webm|pdf|doc|docx/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (allowed.test(ext)) {
    cb(null, true);
  } else {
    cb(new BadRequestError(`File type .${ext} is not allowed`));
  }
};

const upload = multer({
  storage: diskStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter,
});

router.use(authenticate);

router.post('/single', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError('No file uploaded');
    }
    const result = await storageService.uploadFile(req.file, 'general');
    return successResponse(res, result, 'File uploaded successfully', 201);
  } catch (error) {
    next(error);
  }
});

router.post('/video', upload.single('video'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError('No video uploaded');
    }
    const result = await storageService.uploadFile(req.file, 'videos');
    return successResponse(res, result, 'Video uploaded successfully', 201);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
