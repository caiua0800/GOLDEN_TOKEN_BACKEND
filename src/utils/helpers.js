// utils/helpers.js
const fs = require('fs');
const path = require('path');
const AVLTree = require('./avlTree');
const SECRET_ENCRYPTION_KEY = process.env.SECRET_ENCRYPTION_KEY || 'default_secret_key';
const crypto = require('crypto');

const dataPath = path.join(__dirname, '../database/data.json');

// Função para carregar dados no AVL Tree
function loadDataIntoAVLTree(dataPath) {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const avlTree = new AVLTree();
    data.forEach(cliente => avlTree.add(cliente.CPF, cliente));
    console.log("Dados carregados na árvore AVL");
    return avlTree;
}

// Função para atualizar o arquivo local data.json
function updateLocalDataFile(updatedClient) {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    const index = data.findIndex(client => client.CPF === updatedClient.CPF);
    if (index !== -1) {
        data[index] = updatedClient;
    } else {
        data.push(updatedClient); // Adiciona o cliente se não existir
    }

    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
}

// Função para recarregar a AVL Tree
function reloadAVLTree() {
    return loadDataIntoAVLTree(dataPath);
}


const processClientData = (cliente) => {
    // Inicializa os valores que serão calculados
    const totals = (cliente.CONTRATOS || []).reduce((acc, contrato) => {
        // Adiciona verificação para ignorar contratos com STATUS 3 ou 4
        if (contrato.STATUS === 3 || contrato.STATUS === 4) {
            return acc;
        }

        // Calcula o rendimento atual
        const rendimentoContrato = contrato.RENDIMENTO_ATUAL && typeof contrato.RENDIMENTO_ATUAL === 'number'
            ? contrato.RENDIMENTO_ATUAL / 100
            : 0;

        // Inicializa lucroTotal para este contrato
        let lucroTotal = 0;

        if (contrato.TOTALSPENT) {
            const amountSpent = parseFloat(contrato.TOTALSPENT.replace(',', '.'));
            lucroTotal = amountSpent * rendimentoContrato;
            acc.LUCRO_CONTRATOS += lucroTotal;
            acc.TOTAL_SPENT += amountSpent;
        }

        let valorAReceber = 0;
        if (contrato.MAXIMUMQUOTAYIELD && contrato.TOTALSPENT) {
            valorAReceber = parseFloat(contrato.TOTALSPENT.replace(',', '.')) * (parseFloat(contrato.MAXIMUMQUOTAYIELD)/100);
        }

        if ((contrato.STATUS) == 1) {
            const coins = parseFloat(contrato.COINS);
            !isNaN(coins) && (acc.TOTAL_COINS += coins);
            acc.DISPONIVEL_SAQUE += lucroTotal;
        } else {
            acc.DISPONIVEL_SAQUE += lucroTotal + parseFloat(contrato.TOTALSPENT.replace(',', '.'));
        }

        acc.VALOR_A_RECEBER += valorAReceber;
        return acc;
    }, { TOTAL_SPENT: 0, DISPONIVEL_SAQUE: 0, TOTAL_COINS: 0, LUCRO_CONTRATOS: 0, VALOR_A_RECEBER: 0 });

    // Adiciona os valores calculados ao objeto do cliente
    cliente.TOTAL_SPENT = totals.TOTAL_SPENT;
    cliente.DISPONIVEL_SAQUE = totals.DISPONIVEL_SAQUE;
    cliente.TOTAL_COINS = totals.TOTAL_COINS;
    cliente.LUCRO_CONTRATOS = totals.LUCRO_CONTRATOS;

    // Adiciona o valor total de indicações (se aplicável)
    const indicacaoArray = cliente.INDICACAO || [];
    const totalIndicacaoValue = indicacaoArray.reduce((sum, indicacao) => {
        if (indicacao.VALOR) {
            const value = parseFloat(indicacao.VALOR);
            !isNaN(value) && (sum += value);
        }
        return sum;
    }, 0);

    cliente.TOTAL_INDICACAO = totalIndicacaoValue;

    // Calcula o TOTAL_PLATAFORMA
    cliente.TOTAL_PLATAFORMA = cliente.LUCRO_CONTRATOS + cliente.TOTAL_SPENT + cliente.TOTAL_INDICACAO;

    // Calcula o VALOR_SACADO
    const saquesArray = cliente.SAQUES || [];
    const valorSacado = saquesArray
        .filter(saque => saque.STATUS === 1)
        .reduce((sum, saque) => {
            if (saque.VALORSOLICITADO) {
                // const value = parseFloat(saque.VALORSOLICITADO.replace(',', '.'));
                const value = parseFloat(saque.VALORSOLICITADO);

                !isNaN(value) && (sum += value);
            }
            return sum;
        }, 0);

    cliente.VALOR_SACADO = valorSacado;
    cliente.VALOR_A_RECEBER = (totals.VALOR_A_RECEBER -valorSacado);

    return cliente;
};


const encryptPassword = (password) => {
    return crypto.createHmac('md5', SECRET_ENCRYPTION_KEY)
        .update(password)
        .digest('hex')
        .toUpperCase();
};

const confirmIdentity = async (USERNAME, PASSWORD, DocId, avlTree) => {

    // Verifica se USERNAME, PASSWORD e DocId foram fornecidos
    if (!USERNAME || !PASSWORD || !DocId) {
        return res.status(400).json({ message: 'USERNAME, PASSWORD e DocId são obrigatórios' });
    }

    try {
        const encryptedPassword = encryptPassword(PASSWORD);
        const cliente = avlTree.search(DocId);

        if (cliente) {
            if (cliente.USERNAME === USERNAME && cliente.PASSWORD === encryptedPassword) {
                return true
            } else {
                return false;
            }
        } else {
            return false;
        }
    } catch (error) {
        console.error('Erro ao confirmar identidade:', error);
        return false;
    }
}


function getCurrentTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Mês começa em 0
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}


module.exports = { loadDataIntoAVLTree, updateLocalDataFile, reloadAVLTree, processClientData, encryptPassword, confirmIdentity, getCurrentTimestamp };
