import multer from 'multer';
import { Request } from 'express';

// Define custom interface for the request with file
export interface MulterRequest extends Request {
  file: Express.Multer.File;
}

// Configure memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 2 // 2MB limit (adjust as needed)
  }
});

export default upload;