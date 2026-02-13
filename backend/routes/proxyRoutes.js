const express = require('express');
const router = express.Router();
const proxyController = require('../controllers/proxyController');
const externalApiController = require('../controllers/externalApiController');

router.get('/image', proxyController.getProxyImage);

router.get('/gst-lookup', externalApiController.fetchGstDetails);

module.exports = router;
