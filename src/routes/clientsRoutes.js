// routes/clientsRoutes.js
const express = require('express');
const clientController = require('../controllers/clientsController');
const adminController = require('../controllers/adminController');

module.exports = (avlTree) => {
    const router = express.Router();

    // Middleware para parsear o corpo das requisições como JSON
    router.use(express.json());

    // Rota para criar um contrato
    router.post('/loginCliente', clientController.loginCliente(avlTree));

    // Rota para pesquisar um cliente pelo CPF
    router.post('/pesquisarCliente', clientController.getClienteByCPF(avlTree));

    // Rota para atualizar um cliente
    router.post('/editarInfoClient', clientController.updateCliente(avlTree));

    // Nova rota para atualizar um contrato
    router.post('/editarContrato', clientController.updateContrato(avlTree));

    // Nova rota para atualizar um saque
    router.post('/editarSaque', clientController.updateSaque(avlTree));

    // Rota para criar um cliente
    router.post('/criarCliente', clientController.createCliente(avlTree));

    // Rota para criar um contrato
    router.post('/criarContrato', clientController.createContrato(avlTree));

    // Rota para criar um contrato no admin
    router.post('/createContratoAdmin', adminController.createContratoAdmin(avlTree));

    // Rota para criar um saque
    router.post('/criarSaque', clientController.createSaque(avlTree));

    // Rota para criar um saque pelo admin
    router.post('/createSaqueAdmin', adminController.createSaqueAdmin(avlTree));

    // Rota para retornar todos os clientes
    router.get('/allClientes', adminController.getAllClientes(avlTree));

    // Rota para retornar todos os clientes
    router.get('/allClientesCached', adminController.getAllClientesCached(avlTree));

    // Rota para obter todos os contratos
    router.get('/obterDepositos', adminController.obterDepositos(avlTree));

    // Rota para obter todos os saques
    router.get('/obterSaques', adminController.obterSaques(avlTree));

    // Rota para obter o admin data
    router.get('/getAdminData', adminController.getAdminData(avlTree));

    // Rota para obter o admin data
    router.get('/getClientsByState', adminController.getQttClientsByState(avlTree));

    // Rota para obter todas as datas de cadastro
    router.get('/obterDatasDeCadastro', adminController.obterDatasDeCadastro(avlTree));

    // Rota para obter todas as compras e suas datas
    router.get('/getInvestimentosData', adminController.getMelhoresClientes(avlTree));

    // Nova rota para obter os 20 clientes que mais investiram
    router.get('/topInvestors', adminController.getTopInvestors(avlTree));

    //Nova rota para obter clientes sem contratos
    router.get('/clientsThatDidNotBought', adminController.clientsThatDidNotBought(avlTree));

    //Nova rota para obter todos os clientes com informações adicionais
    router.get('/getAllClientesWithPlusInfo', adminController.getAllClientesWithPlusInfo(avlTree));

    // Rota para criar um contrato
    router.post('/updateClientMoreThanOneInfo', clientController.updateClientMoreThanOneInfo(avlTree));

    //Nova rota pra atualizar validação do cliente
    router.post('/updateClienteValidacao', adminController.updateClienteValidacao(avlTree));

    //Nova rota pra rendimento de um cliente
    router.post('/atualizarContratosAtivosUmUsuario', adminController.atualizarContratosAtivosUmUsuario(avlTree));

    //Nova rota pra rendimento de todos os clientes
    router.get('/atualizarTodosContratosAtivos', adminController.atualizarTodosContratosAtivos(avlTree));

    //Nova rota para obter notícias
    router.get('/getAllNews', clientController.getAllNews(avlTree));

    //Nova rota para obter notícias
    router.post('/indicacaoProcess', clientController.adicionarSaldoAoIndicador(avlTree));

    //Nova rota pra gerar senha critografada
    router.post('/gerarCryptPass', clientController.gerarSenhaCriptografada);

    //Novaa rota pra obter um deposito especifico
    router.post('/getContrato', adminController.obterDeposito(avlTree))


    return router;
};
