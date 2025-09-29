const express = require('express');
const router = express.Router();
const { createOrGetSession, handleMessage } = require('../controllers/botController');

router.post('/session', createOrGetSession);
router.post('/message', handleMessage);

module.exports = router;