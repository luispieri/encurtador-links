const express = require('express');
const UrlController = require('../controllers/urlController');

const router = express.Router();

// Rota de redirecionamento
router.get('/:code', UrlController.redirectUrl);

module.exports = router;