// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { loadDataIntoAVLTree } = require('./utils/helpers');
const AVLTree = require('./utils/avlTree');
const { db } = require('./database/firebaseConfig');
const cron = require('node-cron');
const { updateRendimentoAtual } = require('./controllers/rendimentoController'); // Atualize a importação
const mercadoPagoRoutes = require('./routes/mercadoPagoRoutes');
const passwordRoutes = require('./routes/passwordRoutes'); // Adicione esta linha

const app = express();
const port = process.env.PORT || 3000;

// Middleware para analisar JSON
app.use(express.json());

// Middleware para permitir CORS para todas as origens
app.use(cors());

// Caminho para o arquivo de dados
const dataPath = path.join(__dirname, 'database/data.json');

// Função para iniciar o servidor e carregar dados
async function startServer() {
  try {
    // Carregar dados e preparar a árvore AVL
    const avlTree = loadDataIntoAVLTree(dataPath);

    // Imprimir a árvore AVL
    avlTree.printTree();

    // Adiciona a árvore AVL ao objeto de requisição
    app.use((req, res, next) => {
      req.avlTree = avlTree;
      next();
    });

    // Configurar rotas
    const clientRoutes = require('./routes/clientsRoutes')(avlTree);
    app.use('/clientes', clientRoutes);

    // Rotas do MercadoPago
    app.use('/mercado-pago', mercadoPagoRoutes);

    // Adicionar rotas de redefinição de senha
    app.use('/api', passwordRoutes); // Adicione esta linha

    // Agendar a função para rodar uma vez por dia
    // cron.schedule('0 2 * * *', () => {
    //   console.log('Atualizando rendimento atual...');
    //   updateRendimentoAtual();
    // });

    // Iniciar o servidor
    app.listen(port, () => {
      console.log(`Servidor rodando na porta ${port}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar o servidor:', error);
  }
}

// Iniciar o servidor
startServer();
