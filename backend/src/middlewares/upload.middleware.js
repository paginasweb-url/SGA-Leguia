import multer from 'multer';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/octet-stream'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Solo se permiten archivos PDF, JPG, JPEG o PNG'));
    }

    cb(null, true);
  }
});