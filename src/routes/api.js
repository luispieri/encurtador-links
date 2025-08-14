const express = require('express');
const UrlController = require('../controllers/urlController');
const StatsController = require('../controllers/statsController');

const router = express.Router();

// Rotas da API
router.post('/shorten', UrlController.shortenUrl);
router.get('/manage', UrlController.getUserUrls);
router.delete('/delete/:id', UrlController.deleteUrl);
router.get('/stats/:code', StatsController.getUrlStats);

module.exports = router;