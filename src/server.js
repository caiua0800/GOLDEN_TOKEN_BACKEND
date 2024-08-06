// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { loadDataIntoAVLTree } = require('./utils/helpers');
const cron = require('node-cron');
const mercadoPagoRoutes = require('./routes/mercadoPagoRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const adminController = require('./controllers/adminController');
const https = require('https');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Configuração CORS
const corsOptions = {
  origin: '*',
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
};

app.use(cors(corsOptions));

// Middleware para tratar JSON
app.use(express.json());

// Configuração para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Carregar dados na AVL Tree
const dataPath = path.join(__dirname, 'database/data.json');
async function startServer() {
  try {
    const avlTree = loadDataIntoAVLTree(dataPath);

    app.use((req, res, next) => {
      req.avlTree = avlTree;
      next();
    });

    // Rotas
    const clientRoutes = require('./routes/clientsRoutes')(avlTree);
    app.use('/clientes', clientRoutes);
    app.use('/mercado-pago', mercadoPagoRoutes);
    app.use('/api', passwordRoutes);

    // Agendador de tarefas
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

    // Configuração HTTPS
    const options = {
      key: fs.readFileSync('/etc/letsencrypt/live/servidor.modelodesoftwae.com/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/servidor.modelodesoftwae.com/fullchain.pem'),
    };

    // Iniciar servidor HTTPS
    https.createServer(options, app).listen(443, () => {
      console.log(`Servidor HTTPS rodando na porta 443`);
    });
  } catch (error) {
    console.error('Erro ao iniciar o servidor:', error);
  }
}

// Iniciar o servidor
startServer();
