const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/avatar', upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const result = await new Promise((resolve, reject) => {
      const opts = { folder: 'ballmates/avatars', resource_type: 'image' };
      cloudinary.uploader.upload_stream(opts, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      }).end(req.file.buffer);
    });

    await User.findByIdAndUpdate(req.user._id, { avatar: result.secure_url });
    res.json({ avatar: result.secure_url });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
