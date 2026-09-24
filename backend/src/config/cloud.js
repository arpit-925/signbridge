const fs = require('fs');
const path = require('path');
const env = require('./env');

const uploadDir = path.resolve(__dirname, '../../', env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

class StorageService {
  constructor() {
    this.provider = env.STORAGE_PROVIDER;
  }

  async uploadFile(file, subfolder = 'general') {
    if (this.provider === 'cloudinary' && env.CLOUDINARY_CLOUD_NAME) {
      // Future Cloudinary integration if configured
      return {
        url: `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/${subfolder}/${file.filename}`,
        publicId: file.filename,
        provider: 'cloudinary',
      };
    }

    // Default: Local disk storage
    return {
      url: `/uploads/${file.filename}`,
      path: file.path,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      provider: 'local',
    };
  }

  async deleteFile(filename) {
    if (this.provider === 'local') {
      const filePath = path.join(uploadDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
    }
    return false;
  }
}

module.exports = new StorageService();
