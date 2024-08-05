// mercadoPagoRoutes.js
const express = require('express');
const router = express.Router();
const { criarPix } = require('../controllers/mercadoPagoController');

// Rota para a página inicial (opcional)
router.get('/', function (req, res) {
  res.render('index', { title: 'Express v0.0.1' });
});

// Rota para criar um pagamento PIX
router.post('/criar-pix', criarPix);

module.exports = router;
