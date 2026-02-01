const express = require('express');
const router = express.Router();
const proxyController = require('../controllers/proxyController');

router.get('/image', proxyController.getProxyImage);

module.exports = router;
