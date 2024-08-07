// controllers/adminController.js
const { processClientData, updateLocalDataFile } = require('../utils/helpers');
const { auth, db } = require('../database/firebaseConfig');
const { v4: uuidv4 } = require('uuid'); // Para gerar o código aleatório
const moment = require('moment'); // Para formatar a data


const adminController = {



    // Função existente para buscar todos os clientes
    getAllClientes: (avlTree) => (req, res) => {
        const allClientes = avlTree.inOrderTraversal(avlTree.root);
        res.json(allClientes);
    },

    //obter os contratos
    obterDepositos: (avlTree) => async (req, res) => {
        try {
            // Obtém todos os clientes do Firestore
            const allClientes = avlTree.inOrderTraversal(avlTree.root);

            // Cria um array para armazenar todos os contratos
            let todosContratos = [];

            // Itera sobre todos os clientes para adicionar seus contratos ao array
            allClientes.forEach(cliente => {
                if (cliente.CONTRATOS && cliente.CONTRATOS.length > 0) {
                    const contratos = cliente.CONTRATOS.map(contrato => ({
                        ...contrato,
                        CLIENT_NAME: cliente.NAME,  // Adiciona o nome do cliente a cada contrato
                        CLIENT_CPF: cliente.CPF     // Adiciona o CPF do cliente a cada contrato
                    }));

                    // Adiciona os contratos ao array de todos os contratos
                    todosContratos = todosContratos.concat(contratos);
                }
            });

            // Retorna todos os contratos
            res.json(todosContratos);
        } catch (error) {
            console.error('Erro ao obter os depósitos:', error);
            res.status(500).send('Erro ao obter os depósitos.');
        }
    },

    getAllClientesWithPlusInfo: (avlTree) => async (req, res) => {
        try {
            const allClientes = avlTree.inOrderTraversal(avlTree.root);

            // Processa cada cliente e retorna a lista com as informações adicionais
            const clientesWithPlusInfo = [];
            allClientes.forEach(cliente => {
                const processedCliente = processClientData(cliente);
                clientesWithPlusInfo.push(processedCliente);
            });

            res.json(clientesWithPlusInfo);
        } catch (error) {
            console.error('Erro ao obter todos os clientes com informações adicionais:', error);
            res.status(500).send('Erro ao obter todos os clientes com informações adicionais.');
        }
    },

    //obter os saques
    obterSaques: (avlTree) => async (req, res) => {
        try {
            // Obtém todos os clientes do Firestore
            const allClientes = avlTree.inOrderTraversal(avlTree.root);

            // Cria um array para armazenar todos os saques
            let todosSaques = [];

            // Itera sobre todos os clientes para adicionar seus saques ao array
            allClientes.forEach(cliente => {
                if (cliente.SAQUES && cliente.SAQUES.length > 0) {
                    const saques = cliente.SAQUES.map(saque => ({
                        ...saque,
                        CLIENT_NAME: cliente.NAME,  // Adiciona o nome do cliente a cada saque
                        CLIENT_CPF: cliente.CPF,    // Adiciona o CPF do cliente a cada saque
                        CLIENT_USERNAME: cliente.USERNAME
                    }));

                    // Adiciona os saques ao array de todos os saques
                    todosSaques = todosSaques.concat(saques);
                }
            });

            // Retorna todos os saques
            res.json(todosSaques);
        } catch (error) {
            console.error('Erro ao obter os saques:', error);
            res.status(500).send('Erro ao obter os saques.');
        }
    },


    getAdminData: (avlTree) => async (req, res) => {
        try {
            // Obtém todos os clientes do Firestore
            allClientes = avlTree.inOrderTraversal(avlTree.root);
            // const allClientes = usersSnapshot.docs.map(doc => doc.data());

            // Calcula totalCoinsPlataforma
            let totalCoinsPlataforma = 0;
            allClientes.forEach(cliente => {
                if (cliente.CONTRATOS) {
                    cliente.CONTRATOS.forEach(contrato => {
                        if (contrato.STATUS === 1 && contrato.COINS) {
                            totalCoinsPlataforma += parseFloat(contrato.COINS) || 0;
                        }
                    });
                }
            });

            // Calcula totalSaldoPlataforma
            let totalSaldoPlataforma = 0;
            allClientes.forEach(cliente => {
                if (cliente.CONTRATOS) {
                    cliente.CONTRATOS.forEach(contrato => {
                        if (contrato.STATUS === 1) {
                            const totalSpent = parseFloat(contrato.TOTALSPENT) || 0;
                            const rendimentoAtual = parseFloat(contrato.RENDIMENTO_ATUAL) || 0;
                            const rendimento = (rendimentoAtual / 100) * totalSpent;
                            totalSaldoPlataforma += totalSpent + rendimento;
                        }
                    });
                }
            });

            // Calcula totalSaldoPlataforma
            let totalDeGanhosPlataforma = 0;
            allClientes.forEach(cliente => {
                if (cliente.CONTRATOS) {
                    cliente.CONTRATOS.forEach(contrato => {
                        if (contrato.STATUS === 1 || contrato.STATUS === 2) {

                            const totalSpent = parseFloat(contrato.TOTALSPENT) || 0;
                            const rendimentoAtual = parseFloat(contrato.RENDIMENTO_ATUAL) || 0;
                            const rendimento = (rendimentoAtual / 100) * totalSpent;
                            totalDeGanhosPlataforma += rendimento;
                        }
                    });
                }
            });

            // Calcula totalDeValoresDeSaquesFeitos
            let totalDeValoresDeSaquesFeitos = 0;
            allClientes.forEach(cliente => {
                if (cliente.SAQUES) {
                    cliente.SAQUES.forEach(saque => {
                        if (saque.STATUS === 2 && saque.VALORSOLICITADO) {
                            totalDeValoresDeSaquesFeitos += parseFloat(saque.VALORSOLICITADO) || 0;
                        }
                    });
                }
            });

            // Calcula o saldo final
            const saldoFinal = totalSaldoPlataforma - totalDeValoresDeSaquesFeitos;

            const totalInvestimentos = totalSaldoPlataforma;

            totalSaldoPlataforma = saldoFinal;

            // Retorna os dados
            res.json({
                totalCoinsPlataforma,
                totalSaldoPlataforma,
                totalDeValoresDeSaquesFeitos,
                totalInvestimentos,
                totalDeGanhosPlataforma
            });
        } catch (error) {
            console.error('Erro ao obter dados administrativos:', error);
            res.status(500).send('Erro ao obter dados administrativos.');
        }
    },


    normalizeStateName: (stateName) => {
        // Normaliza a string e transforma em maiúsculas
        return stateName
            .normalize('NFD')                    // Normaliza a string para a forma de decomposição
            .replace(/[\u0300-\u036f]/g, '')    // Remove os acentos
            .toUpperCase();                     // Transforma em maiúsculas
    },



    getQttClientsByState: (avlTree) => async (req, res) => {
        try {
            const allClientes = avlTree.inOrderTraversal(avlTree.root);

            // Objeto para armazenar a contagem de clientes por estado
            const statesCount = {
                'AC': 0, 'AL': 0, 'AP': 0, 'AM': 0, 'BA': 0, 'CE': 0, 'DF': 0, 'ES': 0, 'GO': 0, 'MA': 0,
                'MG': 0, 'MS': 0, 'MT': 0, 'PA': 0, 'PB': 0, 'PE': 0, 'PI': 0, 'PR': 0, 'RJ': 0, 'RN': 0,
                'RO': 0, 'RR': 0, 'RS': 0, 'SC': 0, 'SE': 0, 'SP': 0, 'TO': 0
            };

            // Itera sobre todos os clientes para contar os estados
            allClientes.forEach(cliente => {
                if (cliente.STATE) {
                    // Normaliza o estado do cliente
                    const normalizedState = adminController.normalizeStateName(cliente.STATE);

                    // Verifica se o estado normalizado corresponde a uma sigla válida
                    if (statesCount.hasOwnProperty(normalizedState)) {
                        statesCount[normalizedState] += 1;
                    }
                }
            });

            // Retorna o objeto com a contagem de clientes por estado
            res.json(statesCount);
        } catch (error) {
            console.error('Erro ao obter a quantidade de clientes por estado:', error);
            res.status(500).send('Erro ao obter a quantidade de clientes por estado.');
        }
    },

    obterDatasDeCadastro: (avlTree) => async (req, res) => {
        try {
            // Obtém todos os clientes da árvore AVL
            const allClientes = avlTree.inOrderTraversal(avlTree.root);

            // Cria um array para armazenar as datas de criação
            const datasDeCadastro = allClientes.map(cliente => cliente.DATACRIACAO);

            // Retorna o array de datas de criação
            res.json(datasDeCadastro);
        } catch (error) {
            console.error('Erro ao obter datas de criação dos clientes:', error);
            res.status(500).send('Erro ao obter datas de criação dos clientes.');
        }
    },

    getMelhoresClientes: (avlTree) => async (req, res) => {
        try {
            // Obtém todos os clientes da árvore AVL
            const allClientes = avlTree.inOrderTraversal(avlTree.root);

            // Cria um array para armazenar os contratos filtrados
            const melhoresClientes = [];

            // Itera sobre todos os clientes
            allClientes.forEach(cliente => {
                if (cliente.CONTRATOS) {
                    // Filtra contratos com STATUS igual a 1 ou 2
                    const contratosFiltrados = cliente.CONTRATOS.filter(contrato =>
                        contrato.STATUS === 1 || contrato.STATUS === 2
                    );

                    // Mapeia os contratos para obter apenas PURCHASEDATE e TOTALSPENT
                    const contratosMapeados = contratosFiltrados.map(contrato => ({
                        PURCHASEDATE: contrato.PURCHASEDATE,
                        TOTALSPENT: contrato.TOTALSPENT
                    }));

                    // Adiciona os contratos mapeados ao array melhoresClientes
                    melhoresClientes.push(...contratosMapeados);
                }
            });

            // Retorna o array de contratos filtrados
            res.json(melhoresClientes);
        } catch (error) {
            console.error('Erro ao obter melhores clientes:', error);
            res.status(500).send('Erro ao obter melhores clientes.');
        }
    },


    getTopInvestors: (avlTree) => async (req, res) => {
        try {
            // Obtém todos os clientes da árvore AVL
            const allClientes = avlTree.inOrderTraversal(avlTree.root);

            // Array para armazenar o total gasto por cada cliente
            const clientesInvestimentos = allClientes.map(cliente => {
                let totalInvestido = 0;

                if (cliente.CONTRATOS) {
                    // Soma o TOTALSPENT de contratos com STATUS 1 ou 2
                    totalInvestido = cliente.CONTRATOS.reduce((total, contrato) => {
                        if (contrato.STATUS === 1 || contrato.STATUS === 2) {
                            return total + parseFloat(contrato.TOTALSPENT || 0);
                        }
                        return total;
                    }, 0);
                }

                return { cliente, totalInvestido };
            });

            // Ordena os clientes pelo total investido em ordem decrescente
            clientesInvestimentos.sort((a, b) => b.totalInvestido - a.totalInvestido);

            // Pega os 20 primeiros clientes
            const topInvestors = clientesInvestimentos.slice(0, 20);

            // Mapeia os dados para incluir apenas as informações relevantes
            const topInvestorsData = topInvestors.map(({ cliente, totalInvestido }) => ({
                name: cliente.NAME,
                cpf: cliente.CPF,
                totalInvestido
            }));

            // Retorna os dados dos 20 clientes que mais investiram
            res.json(topInvestorsData);
        } catch (error) {
            console.error('Erro ao obter os principais investidores:', error);
            res.status(500).send('Erro ao obter os principais investidores.');
        }
    },

    //clientes sem contratos
    clientsThatDidNotBought: (avlTree) => async (req, res) => {
        try {
            const allClientes = avlTree.inOrderTraversal(avlTree.root);
            const clientesSemCompras = allClientes.filter(cliente => !cliente.CONTRATOS || cliente.CONTRATOS.length === 0);
            res.json(clientesSemCompras);
        } catch (error) {
            console.error('Erro ao obter clientes sem compras:', error);
            res.status(500).send('Erro ao obter clientes sem compras.');
        }
    },

    createContratoAdmin: (avlTree) => async (req, res) => {
        const { docId, contratoData } = req.body;

        // Verifica se todos os parâmetros necessários estão presentes
        if (!docId || !contratoData) {
            return res.status(400).send('docId e contratoData são obrigatórios.');
        }
        console.log('Recebido:', { docId, contratoData });

        try {

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
                console.error('Erro ao criar o contrato:', error.message);

                res.status(404).send('Cliente não encontrado no Firestore.');
            }
        } catch (error) {

            console.error('Erro ao criar o contrato:', error);
            res.status(500).send('Erro ao criar o contrato.');
        }
    },

    // Nova função para atualizar a validação
    updateClienteValidacao: (avlTree) => async (req, res) => {
        const { docId, DOCSENVIADOS, DOCSVERIFICADOS } = req.body;

        if (docId == null || DOCSENVIADOS == null || DOCSVERIFICADOS == null) {
            return res.status(400).send('DocId, DOCSENVIADOS e DOCSVERIFICADOS são obrigatórios.');
        }

        try {
            // Atualiza o cliente no Firestore
            const clienteRef = db.collection('USERS').doc(docId);
            await clienteRef.update({ DOCSENVIADOS, DOCSVERIFICADOS });

            // Obtém o cliente atualizado do Firestore
            const clienteDoc = await clienteRef.get();
            if (clienteDoc.exists) {
                const updatedCliente = clienteDoc.data();

                // Atualiza o cliente no arquivo local data.json
                updateLocalDataFile(updatedCliente);

                // Remove o cliente antigo da AVL Tree e adiciona o cliente atualizado
                avlTree.removeNode(docId); // Remove o cliente antigo da AVL Tree
                avlTree.add(updatedCliente.CPF, updatedCliente); // Adiciona o cliente atualizado

                res.status(200).send('Cliente atualizado com sucesso.');
            } else {
                res.status(404).send('Cliente não encontrado no Firestore.');
            }
        } catch (error) {
            console.error('Erro ao atualizar o cliente:', error);
            res.status(500).send('Erro ao atualizar o cliente.');
        }
    },

    createSaqueAdmin: (avlTree) => async (req, res) => {
        const { docId, saqueData } = req.body;
        if (!docId || !saqueData) {
            return res.status(400).send('DocId e saqueData são obrigatórios.');
        }

        try {

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

    atualizarTodosContratosAtivos: (avlTree) => async (req, res) => {
        try {
            // Obtém todos os documentos da coleção 'USERS'
            const usersSnapshot = await db.collection('USERS').get();
    
            if (usersSnapshot.empty) {
                return res.status(200).send('Nenhum usuário encontrado.');
            }
    
            let totalUpdated = 0;
            const failedUpdates = []; // Array para armazenar contratos que não foram atualizados
    
            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();
    
                // Itera sobre os contratos do usuário
                if (userData.CONTRATOS && userData.CONTRATOS.length > 0) {
                    let updateNeeded = false;
    
                    userData.CONTRATOS.forEach((contrato) => {
                        if (contrato.STATUS === 1 && contrato.MAXIMUMQUOTAYIELD) {
                            const maxQuotaYield = parseFloat(contrato.MAXIMUMQUOTAYIELD);
                            const rendimentoAtual = parseFloat(contrato.RENDIMENTO_ATUAL);
    
                            if (rendimentoAtual < maxQuotaYield) {
                                const yieldPerDay = maxQuotaYield / (36 * 30);
                                const rendimentoNovo = rendimentoAtual + yieldPerDay;
                                contrato.RENDIMENTO_ATUAL = rendimentoNovo;
                                updateNeeded = true;
    
                                // Imprime a mensagem de atualização para cada contrato
                                console.log(`Contrato ${contrato.IDCOMPRA} do usuário ${userData.CPF} atualizado: Rendimento atual de ${rendimentoAtual.toFixed(2)} para ${rendimentoNovo.toFixed(2)}`);
                            }
                        }
                    });
    
                    // Se necessário, atualiza o documento no Firestore
                    if (updateNeeded) {
                        try {
                            await db.collection('USERS').doc(userDoc.id).update({ CONTRATOS: userData.CONTRATOS });
                            updateLocalDataFile(userData);
                            avlTree.removeNode(userData.CPF);
                            avlTree.add(userData.CPF, userData);
                            totalUpdated++;
                        } catch (updateError) {
                            // Adiciona ao array de falhas se a atualização falhar
                            userData.CONTRATOS.forEach((contrato) => {
                                if (contrato.STATUS === 1) {
                                    failedUpdates.push({
                                        NAME: userData.NAME,
                                        CPF: userData.CPF,
                                        IDCOMPRA: contrato.IDCOMPRA
                                    });
                                }
                            });
                        }
                    }
                }
            }

            const now = new Date();
            const timestamp = now.toISOString(); 
    
            await db.collection('SYSTEM_VARIABLES').doc('RENDIMENTOS').set({
                ULTIMO_RENDIMENTO: timestamp
            }, { merge: true });
    
            if (failedUpdates.length > 0) {
                return res.status(200).json({
                    message: `Contratos atualizados com sucesso. Total de documentos atualizados: ${totalUpdated}`,
                    failedUpdates
                });
            } else {
                return res.status(200).send(`Contratos atualizados com sucesso. Total de documentos atualizados: ${totalUpdated}`);
            }
        } catch (error) {
            console.error('Erro ao atualizar contratos ativos dos usuários:', error);
            return res.status(500).send('Erro ao atualizar contratos.');
        }
    },
    
    

    atualizarContratosAtivosUmUsuario: (avlTree) => async (req, res) => {
        const { docId } = req.body;
        if (!docId) {
            return res.status(400).send('DocId é obrigatório.');
        }
    
        try {
            // Obtém o documento do usuário específico pelo ID
            const userDoc = await db.collection('USERS').doc(docId).get();
    
            if (userDoc.exists) {
                const userData = userDoc.data();
    
                // Itera sobre os contratos do usuário
                if (userData.CONTRATOS && userData.CONTRATOS.length > 0) {
                    let updateNeeded = false;
    
                    userData.CONTRATOS.forEach((contrato) => {
                        if (contrato.STATUS === 1 && contrato.MAXIMUMQUOTAYIELD) {
                            const maxQuotaYield = parseFloat(contrato.MAXIMUMQUOTAYIELD);
                            const rendimentoAtual = parseFloat(contrato.RENDIMENTO_ATUAL);
    
                            if (rendimentoAtual < maxQuotaYield) {
                                const yieldPerDay = maxQuotaYield / (36 * 30);
                                const rendimentoNovo = rendimentoAtual + yieldPerDay;
                                contrato.RENDIMENTO_ATUAL = rendimentoNovo;
                                updateNeeded = true;
    
                                // Imprime a mensagem de atualização para cada contrato
                                console.log(`Contrato ${contrato.IDCOMPRA} atualizado: Rendimento atual de ${rendimentoAtual.toFixed(2)} para ${rendimentoNovo.toFixed(2)}`);
                            }
                        }
                    });
    
                    // Se necessário, atualiza o documento no Firestore
                    if (updateNeeded) {
                        await db.collection('USERS').doc(docId).update({ CONTRATOS: userData.CONTRATOS });
                        updateLocalDataFile(userData);
                        avlTree.removeNode(userData.CPF);
                        avlTree.add(userData.CPF, userData);
                    }
    
                    return res.status(200).send('Contratos atualizados com sucesso.');
                } else {
                    return res.status(200).send('Nenhum contrato para atualizar.');
                }
            } else {
                return res.status(404).send('Usuário não encontrado.');
            }
        } catch (error) {
            console.error('Erro ao atualizar contratos ativos do usuário:', docId, error);
            return res.status(500).send('Erro ao atualizar contratos.');
        }
    },
    



};

module.exports = adminController;
