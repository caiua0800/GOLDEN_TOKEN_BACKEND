// controllers/passwordController.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendPasswordResetEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Aqui você deve gerar um token ou link de redefinição de senha
  const resetToken = '123456'; // Substitua isso por um token real

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Request',
    text: `Click the following link to reset your password: http://localhost:3000/reset-password/${resetToken}`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send password reset email' });
  }
};

module.exports = { sendPasswordResetEmail };
