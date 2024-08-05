const { db } = require('../database/firebaseConfig'); // Ajuste o caminho conforme necessário

async function updateRendimentoAtual() {
  try {
    const docId = '07541152161';
    const userRef = db.collection('USERS').doc(docId);

    const doc = await userRef.get();

    if (!doc.exists) {
      console.log('Nenhum documento encontrado com o ID:', docId);
      return;
    }

    const data = doc.data();
    const contratos = data.CONTRATOS;

    if (Array.isArray(contratos)) {
      const updatedContratos = contratos.map(contrato => {
        if (contrato.RENDIMENTO_ATUAL !== undefined && contrato.RENDIMENTO_ATUAL !== null) {
          // Converter RENDIMENTO_ATUAL para número
          const rendimentoAtual = Number(contrato.RENDIMENTO_ATUAL);
          
          // Verificar se a conversão foi bem-sucedida
          if (!isNaN(rendimentoAtual)) {
            console.log(`Atualizando RENDIMENTO_ATUAL de ${rendimentoAtual} para ${rendimentoAtual + 0.136986301}`);
            contrato.RENDIMENTO_ATUAL = rendimentoAtual + 0.1369863;
          } else {
            console.log('O valor de RENDIMENTO_ATUAL não é um número válido.');
          }
        }
        return contrato;
      });

      // Debug: Verificar o conteúdo atualizado dos contratos
      console.log('Contratos atualizados:', updatedContratos);

      await userRef.update({ CONTRATOS: updatedContratos });

      console.log('Contratos atualizados com sucesso.');
    } else {
      console.log('O campo CONTRATOS não é um array ou não existe.');
    }
  } catch (error) {
    console.error('Erro ao acessar o documento:', error);
  }
}

module.exports = { updateRendimentoAtual };
