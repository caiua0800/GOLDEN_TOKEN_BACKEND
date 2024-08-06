// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { loadDataIntoAVLTree } = require('./utils/helpers');
const cron = require('node-cron');
const mercadoPagoRoutes = require('./routes/mercadoPagoRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const adminController = require('./controllers/adminController'); // Importar o controlador

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

const dataPath = path.join(__dirname, 'database/data.json');

async function startServer() {
  try {

    const avlTree = loadDataIntoAVLTree(dataPath);

    app.use((req, res, next) => {
      req.avlTree = avlTree;
      next();
    });

    const clientRoutes = require('./routes/clientsRoutes')(avlTree);
    app.use('/clientes', clientRoutes);
    app.use('/mercado-pago', mercadoPagoRoutes);
    app.use('/api', passwordRoutes);

    cron.schedule('0 2 * * *', async () => {
      try {
        console.log('Atualizando todos os contratos ativos...');
        await adminController.atualizarTodosContratosAtivos(avlTree)();
      } catch (error) {
        console.error('Erro ao executar a atualização de contratos ativos:', error);
      }
    }, {
      timezone: "America/Sao_Paulo"
    });


    app.listen(port, () => {
      console.log(`Servidor rodando na porta ${port}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar o servidor:', error);
  }
}

// Iniciar o servidor
startServer();
