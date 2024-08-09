// controllers/clientsController.js
const { db } = require('../database/firebaseConfig');
const { updateLocalDataFile, processClientData, encryptPassword, getCurrentTimestamp, confirmIdentity } = require('../utils/helpers');
const { v4: uuidv4 } = require('uuid'); // Para gerar o código aleatório
const moment = require('moment'); // Para formatar a data
const QRCode = require('qrcode');
const admin = require('firebase-admin');
const FieldValue = admin.firestore.FieldValue;


const clientController = {
    // Função existente para buscar cliente por CPF
    getClienteByCPF: (avlTree) => async (req, res) => {
        const { CPF } = req.body;
        if (!CPF) return res.status(400).send('O CPF é obrigatório.');
        console.log("SOLICITAÇÃO DE OBTER DADOS DE UM CLIENTE")

        try {
            const cliente = avlTree.search(CPF);
            if (cliente) {
                // Manipula e adiciona dados ao cliente
                const processedCliente = processClientData(cliente);
                res.json(processedCliente);
            } else {
                res.status(404).send('Cliente não encontrado');
            }
        } catch (error) {
            console.error('Erro ao buscar o cliente:', error);
            res.status(500).send('Erro ao buscar o cliente.');
        }
    },

    loginCliente: (avlTree) => async (req, res) => {
        const { USERNAME, PASSWORD } = req.body || {}; // Adiciona fallback para um objeto vazio

        // Verifica se USERNAME e PASSWORD foram fornecidos
        if (!USERNAME || !PASSWORD) {
            return res.status(400).json({ message: 'USERNAME e PASSWORD são obrigatórios' });
        }

        try {
            // Encripta a senha fornecida
            const encryptedPassword = encryptPassword(PASSWORD);

            // Obtém todos os documentos da coleção USERS
            const usersSnapshot = await db.collection('USERS').get();
            let cpf = null;

            // Procura o documento com USERNAME e PASSWORD correspondentes
            usersSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.USERNAME === USERNAME && data.PASSWORD === encryptedPassword) {
                    cpf = data.CPF;
                }
            });

            if (!cpf) return res.status(404).json({ message: 'Cliente não encontrado ou credenciais incorretas' });

            // Busca o cliente na AVL Tree usando o CPF encontrado
            const cliente = avlTree.search(cpf);

            if (!cliente) return res.status(404).json({ message: 'Cliente não encontrado na AVL Tree' });

            // Manipula e adiciona dados ao cliente
            const processedCliente = processClientData(cliente);
            res.status(200).json(processedCliente);
        } catch (error) {
            console.error('Erro ao realizar o login:', error);
            res.status(500).send('Erro ao realizar o login.');
        }
    },


    gerarSenhaCriptografada: (req, res) => {
        const { PASSWORD } = req.body;

        const encryptedPassword = encryptPassword(PASSWORD);

        if(encryptPassword)
            res.status(200).send(encryptedPassword);
        else
            res.status(400).send('Erro ao criptografar senha.');

    },

    // Nova função para atualizar um cliente
    updateCliente: (avlTree) => async (req, res) => {
        const { docId, field, newValue } = req.body;
        if (!docId || !field || newValue === undefined) {
            return res.status(400).send('DocId, campo e novo valor são obrigatórios.');
        }

        try {
            // Atualiza o cliente no Firestore
            const clienteRef = db.collection('USERS').doc(docId);
            await clienteRef.update({ [field]: newValue });

            // Obtém o cliente atualizado do Firestore
            const clienteDoc = await clienteRef.get();
            if (clienteDoc.exists) {
                const updatedCliente = clienteDoc.data();

                // Atualiza o cliente no arquivo local data.json
                updateLocalDataFile(updatedCliente);

                // Remove o cliente antigo da AVL Tree e adiciona o cliente atualizado
                avlTree.removeNode(docId); // Remove o cliente antigo da AVL Tree
                avlTree.add(updatedCliente.CPF, updatedCliente); // Adiciona o cliente atualizado

                res.send('Cliente atualizado com sucesso.');
            } else {
                res.status(404).send('Cliente não encontrado no Firestore.');
            }
        } catch (error) {
            console.error('Erro ao atualizar o cliente:', error);
            res.status(500).send('Erro ao atualizar o cliente.');
        }
    },

    updateClientMoreThanOneInfo: (avlTree) => async (req, res) => {
        const { docId, updates } = req.body;
        if (!docId || !Array.isArray(updates) || updates.length === 0) {
            return res.status(400).send('DocId e atualizações são obrigatórios.');
        }
        console.log("SOLICITAÇÃO DE EDITAR DADOS DO CLIENTE");
        try {
            // Construir o objeto de atualização para o Firestore
            const updateFields = {};
            updates.forEach(({ field, fieldNewValue }) => {
                if (field && fieldNewValue !== undefined) {
                    updateFields[field] = fieldNewValue;
                }
            });

            // Atualiza o cliente no Firestore
            const clienteRef = db.collection('USERS').doc(docId);
            await clienteRef.update(updateFields);

            // Obtém o cliente atualizado do Firestore
            const clienteDoc = await clienteRef.get();
            if (clienteDoc.exists) {
                const updatedCliente = clienteDoc.data();

                // Atualiza o cliente no arquivo local data.json
                updateLocalDataFile(updatedCliente);

                // Remove o cliente antigo da AVL Tree e adiciona o cliente atualizado
                avlTree.removeNode(docId); // Remove o cliente antigo da AVL Tree
                avlTree.add(updatedCliente.CPF, updatedCliente); // Adiciona o cliente atualizado

                res.send('Cliente atualizado com sucesso.');
            } else {
                res.status(404).send('Cliente não encontrado no Firestore.');
            }
        } catch (error) {
            console.error('Erro ao atualizar o cliente:', error);
            res.status(500).send('Erro ao atualizar o cliente.');
        }
    },


    updateContrato: (avlTree) => async (req, res) => {
        const { docId, IDCONTRATO, fieldName, fieldNewValue } = req.body;
        if (!docId || !IDCONTRATO || !fieldName || fieldNewValue === undefined) {
            return res.status(400).send('DocId, IDCONTRATO, fieldName e fieldNewValue são obrigatórios.');
        }


        try {
            // Obtém o cliente do Firestore
            const clienteRef = db.collection('USERS').doc(docId);
            const clienteDoc = await clienteRef.get();

            if (clienteDoc.exists) {
                const clienteData = clienteDoc.data();
                const contratos = clienteData.CONTRATOS || [];

                // Encontra o contrato a ser atualizado
                const contratoIndex = contratos.findIndex(contrato => contrato.IDCOMPRA === IDCONTRATO);
                if (contratoIndex !== -1) {
                    // Atualiza o contrato
                    contratos[contratoIndex][fieldName] = fieldNewValue;

                    // Atualiza o cliente no Firestore
                    await clienteRef.update({ CONTRATOS: contratos });

                    // Atualiza o cliente no arquivo local data.json
                    clienteData.CONTRATOS = contratos;
                    updateLocalDataFile(clienteData);

                    // Remove o cliente antigo da AVL Tree e adiciona o cliente atualizado
                    avlTree.removeNode(docId);
                    avlTree.add(clienteData.CPF, clienteData);
    
                    res.send('Contrato atualizado com sucesso.');
                } else {
                    res.status(404).send('Contrato não encontrado.');
                }
            } else {
                res.status(404).send('Cliente não encontrado no Firestore.');
            }
        } catch (error) {
            console.error('Erro ao atualizar o contrato:', error);
            res.status(500).send('Erro ao atualizar o contrato.');
        }
    },


    updateSaque: (avlTree) => async (req, res) => {
        const { docId, DATASOLICITACAO, fieldName, fieldNewValue } = req.body;
        if (!docId || !DATASOLICITACAO || !fieldName || fieldNewValue === undefined) {
            return res.status(400).send('DocId, DATASOLICITACAO do contrato, fieldName e fieldNewValue são obrigatórios.');
        }

        try {
            // Obtém o cliente do Firestore
            const clienteRef = db.collection('USERS').doc(docId);
            const clienteDoc = await clienteRef.get();

            if (clienteDoc.exists) {
                const clienteData = clienteDoc.data();
                const saques = clienteData.SAQUES || [];

                // Encontra o contrato a ser atualizado
                const saqueIndex = saques.findIndex(saque => saque.DATASOLICITACAO === DATASOLICITACAO);
                if (saqueIndex !== -1) {
                    // Atualiza o contrato
                    saques[saqueIndex][fieldName] = fieldNewValue;

                    // Atualiza o cliente no Firestore
                    await clienteRef.update({ SAQUES: saques });

                    // Atualiza o cliente no arquivo local data.json
                    clienteData.SAQUES = saques;
                    updateLocalDataFile(clienteData);

                    // Remove o cliente antigo da AVL Tree e adiciona o cliente atualizado
                    avlTree.removeNode(docId);
                    avlTree.add(clienteData.CPF, clienteData);

                    res.send('Saque atualizado com sucesso.');
                } else {
                    res.status(404).send('Saque não encontrado.');
                }
            } else {
                res.status(404).send('Cliente não encontrado no Firestore.');
            }
        } catch (error) {
            console.error('Erro ao atualizar o contrato:', error);
            res.status(500).send('Erro ao atualizar o saque.');
        }
    },

    createCliente: (avlTree) => async (req, res) => {
        const clientData = req.body;

        if (!clientData.CPF) {
            return res.status(400).send('O CPF é obrigatório.');
        }

        try {
            // Verifica se a senha está presente
            if (!clientData.PASSWORD) {
                return res.status(400).send('A senha é obrigatória.');
            }

            // Cria o código de cliente aleatório
            const generateRandomCode = () => {
                return Math.random().toString(36).substring(2, 10).toUpperCase(); // 8 dígitos
            };

            // Criptografa a senha
            const hashedPassword = await encryptPassword(clientData.PASSWORD);

            // Cria o documento no Firestore com CPF como ID
            const docId = clientData.CPF;
            const clienteRef = db.collection('USERS').doc(docId);

            // Prepara os dados do cliente para salvar
            const clientToSave = {
                ...clientData,
                PASSWORD: hashedPassword, // Substitui a senha pela senha criptografada
                CODCLI: generateRandomCode(),
                DATACRIACAO: moment().format('YYYY-MM-DD HH:mm:ss'),
                DOCSENVIADOS: false,
                DOCSVERIFICADOS: false
            };

            // Salva o cliente no Firestore
            await clienteRef.set(clientToSave);

            // Atualiza o arquivo local data.json
            updateLocalDataFile(clientToSave);

            // Adiciona o cliente à árvore AVL
            avlTree.add(clientToSave.CPF, clientToSave);

            res.status(201).send('Cliente criado com sucesso.');
        } catch (error) {
            console.error('Erro ao criar o cliente:', error);
            res.status(500).send('Erro ao criar o cliente.');
        }
    },



    createContrato: (avlTree) => async (req, res) => {
        const { USERNAME, PASSWORD, docId, contratoData } = req.body;

        // Verifica se todos os parâmetros necessários estão presentes
        if (!USERNAME || !PASSWORD || !docId || !contratoData) {
            return res.status(400).send('USERNAME, PASSWORD, docId e contratoData são obrigatórios.');
        }

        try {
            // Verifica a identidade do cliente
            const isValid = await confirmIdentity(USERNAME, PASSWORD, docId, avlTree);
            if (!isValid) {
                return res.status(401).send('Credenciais inválidas.');
            }

            // Obtém o cliente do Firestore
            const clienteRef = db.collection('USERS').doc(docId);
            const clienteDoc = await clienteRef.get();

            if (clienteDoc.exists) {
                const clienteData = clienteDoc.data();
                const contratos = clienteData.CONTRATOS || [];

                // Adiciona o novo contrato ao array de contratos
                const newContrato = {
                    ...contratoData,
                    PURCHASEDATE: moment().format('YYYY-MM-DD HH:mm:ss'), // Adiciona a data de hoje
                    YIELDTERM: moment().add(3, 'years').format('YYYY-MM-DD') // Adiciona a data de 3 anos à frente
                };
                contratos.push(newContrato);

                // Atualiza o cliente no Firestore
                await clienteRef.update({ CONTRATOS: contratos });

                // Atualiza o cliente no arquivo local data.json
                clienteData.CONTRATOS = contratos;
                updateLocalDataFile(clienteData);

                // Remove o cliente antigo da AVL Tree e adiciona o cliente atualizado
                avlTree.removeNode(docId);
                avlTree.add(clienteData.CPF, clienteData);

                res.status(201).send('SOLICITAÇÃO DE COMPRA FEITA COM SUCESSO, FAÇA O PAGAMENTO E AGUARDE A CONFIRMAÇÃO.');
            } else {
                res.status(404).send('Cliente não encontrado no Firestore.');
            }
        } catch (error) {
            console.error('Erro ao criar o contrato:', error);
            res.status(500).send('Erro ao criar o contrato.');
        }
    },

    createSaque: (avlTree) => async (req, res) => {
        const { USERNAME, PASSWORD, docId, saqueData } = req.body;
        if (!docId || !saqueData || !PASSWORD || !USERNAME) {
            return res.status(400).send('DocId, saqueData, USERNAME e PASSWORD são obrigatórios.');
        }

        try {

            const isValid = await confirmIdentity(USERNAME, PASSWORD, docId, avlTree);
            if (!isValid) {
                return res.status(401).send('Credenciais inválidas.');
            }

            // Obtém o cliente do Firestore
            const clienteRef = db.collection('USERS').doc(docId);
            const clienteDoc = await clienteRef.get();

            if (clienteDoc.exists) {
                const clienteData = clienteDoc.data();
                const saques = clienteData.SAQUES || [];

                // Adiciona o novo contrato ao array de saques
                const newSaque = {
                    ...saqueData,
                    DATASOLICITACAO: moment().format('YYYY-MM-DD HH:mm:ss')
                };
                saques.push(newSaque);

                // Atualiza o cliente no Firestore
                await clienteRef.update({ SAQUES: saques });

                // Atualiza o cliente no arquivo local data.json
                clienteData.SAQUES = saques;
                updateLocalDataFile(clienteData);

                // Remove o cliente antigo da AVL Tree e adiciona o cliente atualizado
                avlTree.removeNode(docId);
                avlTree.add(clienteData.CPF, clienteData);

                res.status(201).send('Saque criado com sucesso.');
            } else {
                res.status(404).send('Cliente não encontrado no Firestore.');
            }
        } catch (error) {
            console.error('Erro ao criar o saque:', error);
            res.status(500).send('Erro ao criar o saque.');
        }
    },

    getAllNews: () => async (req, res) => {
        try {

            const newsSnapshot = await db.collection('NEWS').get();
            const newsArray = [];

            newsSnapshot.forEach(doc => {
                newsArray.push({ id: doc.id, ...doc.data() });
            });

            res.status(200).json(newsArray);
        } catch (error) {
            console.error('Erro ao buscar as notícias:', error);
            res.status(500).send('Erro ao buscar as notícias.');
        }
    },

    adicionarSaldoAoIndicador: (avlTree) => async (req, res) => {
        const { CPF_INDICADOR, CPF_INDICADO, NAME_INDICADO, VALOR_INTEIRO } = req.body;
    
        if (!CPF_INDICADOR || !CPF_INDICADO || !NAME_INDICADO || VALOR_INTEIRO === undefined) {
            return res.status(400).send('CPF_INDICADOR, CPF_INDICADO, NAME_INDICADO e VALOR_INTEIRO são obrigatórios.');
        }
    
        try {
            const timestamp = getCurrentTimestamp(); // Obtém o timestamp atual
    
            // Atualiza o documento do indicador no Firestore
            const indicadorRef = db.collection('USERS').doc(CPF_INDICADOR);
            const indicadorDoc = await indicadorRef.get();
            if (!indicadorDoc.exists) {
                return res.status(404).send('Indicador não encontrado no Firestore.');
            }
    
            const indicadorData = indicadorDoc.data();
            const indicacaoArray = indicadorData.INDICACAO || [];
    
            // Adiciona o novo objeto de indicação com o timestamp
            indicacaoArray.push({
                VALOR: VALOR_INTEIRO * 0.1,
                NAME: NAME_INDICADO,
                CPF: CPF_INDICADO,
                TIMESTAMP: timestamp // Adiciona o timestamp
            });
    
            await indicadorRef.update({ INDICACAO: indicacaoArray });
            console.log("ADICIONADO SALDO AO INDICADOR");
    
            const indicadoRef = db.collection('USERS').doc(CPF_INDICADO);
            const indicadoDoc = await indicadoRef.get();
            if (!indicadoDoc.exists) {
                return res.status(404).send('Indicado não encontrado no Firestore.');
            }
            await indicadoRef.update({ INDICADOR: FieldValue.delete() });
            console.log("INDICADOR DELETADO DO INDICADO");
    
            const indicadorAtualizado = { ...indicadorData, INDICACAO: indicacaoArray };
            const indicadoData = indicadoDoc.data();
            indicadoData.INDICADOR = null;
    
            avlTree.removeNode(CPF_INDICADOR);
            avlTree.add(CPF_INDICADOR, indicadorAtualizado);
            avlTree.removeNode(CPF_INDICADO);
            avlTree.add(CPF_INDICADO, indicadoData);
    
            updateLocalDataFile(indicadorAtualizado);
            updateLocalDataFile(indicadoData);
    
            res.send('Saldo adicionado ao indicador com sucesso.');
        } catch (error) {
            console.error('Erro ao adicionar saldo ao indicador:', error);
            res.status(500).send('Erro ao adicionar saldo ao indicador.');
        }
    },
    


};

module.exports = clientController;
