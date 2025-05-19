import multer from 'multer';
import { Request } from 'express';

// Define custom interface for the request with file
export interface MulterRequest extends Request {
  file: Express.Multer.File;
}

// Configure memory storage
const storage = multer.memoryStorage();

// Create Multer middleware instance
const upload = multer({
  storage: storage,
  // Optional: Add file filter or limits if needed
  fileFilter: (req, file, cb) => {
    // Example filter: accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB limit (adjust as needed)
  }
}).single('post_file'); // 'file' should match the field name in the form-data

export default upload;