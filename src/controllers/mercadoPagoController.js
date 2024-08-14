// mercadoPagoController.js
require('dotenv').config();
const { MercadoPagoConfig, Payment } = require('mercadopago');
const { v4: uuidv4 } = require('uuid');

// Step 2: Initialize the client object
const client = new MercadoPagoConfig({
  accessToken: process.env.MC_ACCESS_TOKEN,
  options: { timeout: 5000 }
});

// Step 3: Initialize the API object
const payment = new Payment(client);

// Função para criar um pagamento PIX
const criarPix = async (req, res) => {
  try {
    console.log("REQUEST");
    console.log(req.body);

    // Adiciona a data de expiração (por exemplo, 1 hora a partir do momento atual)
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1); // Expiração em 1 hora

    const body = {
      transaction_amount: req.body.transaction_amount,
      description: req.body.description,
      payment_method_id: req.body.paymentMethodId,
      payer: {
        email: req.body.email,
        identification: {
          type: req.body.identificationType,
          number: req.body.number
        }
      },
      // Define a data de expiração
      date_of_expiration: expirationDate.toISOString()
    };

    const requestOptions = { idempotencyKey: uuidv4() };

    const result = await payment.create({ body, requestOptions });
    console.log("result");
    console.log(result);

    res.status(200).json(result);
  } catch (error) {
    console.log("ERROR");
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};


module.exports = {
  criarPix
};
