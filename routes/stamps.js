const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { get, run, query } = require('../db');
const { authenticate, requireSubscription } = require('../middleware/auth');
const { identifyStamp } = require('../services/stampIdentifier');

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  }
});

router.post('/identify', authenticate, upload.single('image'), async (req, res) => {
  try {
    const user = req.user;
    const trialActive = user.trial_end && new Date(user.trial_end) > new Date();
    const isSubscribed = user.subscription_status === 'active' || user.subscription_status === 'trialing';
    if (!isSubscribed && !trialActive && user.scans_used >= user.scans_limit) {
      return res.status(403).json({ error: 'Scan limit reached. Subscribe to continue.', code: 'SCAN_LIMIT' });
    }
    const imageBuffer = req.file ? fs.readFileSync(req.file.path) : null;
    const result = await identifyStamp(imageBuffer);
    let stampId = null;
    if (result.identified && result.stamp) {
      stampId = result.stamp.id;
      run(`INSERT INTO stamps (id, user_id, image_path, name, country, year, estimated_value, rarity_score, condition, catalog_number, perforation, watermark, color, denomination, description, confidence)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [stampId, user.id, req.file?.path || null, result.stamp.name, result.stamp.country, result.stamp.year,
          result.stamp.estimated_value, result.stamp.rarity_score, result.stamp.condition, result.stamp.catalog_number,
          result.stamp.perforation, result.stamp.watermark, result.stamp.color, result.stamp.denomination,
          result.stamp.description, result.confidence]);
    }
    const scanId = uuidv4();
    run('INSERT INTO scan_history (id, user_id, stamp_id, status, confidence) VALUES (?, ?, ?, ?, ?)',
      [scanId, user.id, stampId, result.identified ? 'completed' : 'partial', result.confidence]);
    if (!isSubscribed && !trialActive) {
      run('UPDATE users SET scans_used = scans_used + 1 WHERE id = ?', [user.id]);
    }
    res.json(result);
  } catch (err) {
    console.error('Identify error:', err);
    res.status(500).json({ error: 'Identification failed' });
  }
});

router.get('/history', authenticate, (req, res) => {
  const history = query(`
    SELECT s.*, sh.created_at as scanned_at, sh.confidence as scan_confidence
    FROM scan_history sh
    LEFT JOIN stamps s ON s.id = sh.stamp_id
    WHERE sh.user_id = ?
    ORDER BY sh.created_at DESC
    LIMIT 20`, [req.user.id]);
  res.json({ history });
});

router.get('/collection', authenticate, (req, res) => {
  const stamps = query('SELECT * FROM stamps WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
  res.json({ stamps });
});

router.delete('/collection/:id', authenticate, (req, res) => {
  run('DELETE FROM stamps WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

module.exports = router;
