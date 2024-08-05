const { loadDataIntoAVLTree } = require('./utils/helpers');
const dataPath = path.join(__dirname, 'database/data.json');

const avlTree = loadDataIntoAVLTree(dataPath);