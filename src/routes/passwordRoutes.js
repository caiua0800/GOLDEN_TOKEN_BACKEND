// routes/passwordRoutes.js
const express = require('express');
const router = express.Router();
const { sendPasswordResetEmail } = require('../controllers/passwordController');

// Rota para solicitar a redefinição de senha
router.post('/reset-password', sendPasswordResetEmail);

module.exports = router;
