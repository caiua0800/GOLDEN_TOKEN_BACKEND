// avlTree.js
const fs = require('fs');
const path = require('path');

class Node {
    constructor(key, value) {
        this.key = key; // Este será o CPF ou qualquer outro campo único
        this.value = value; // Dados do cliente
        this.left = null;
        this.right = null;
        this.height = 1;
    }
}

class AVLTree {
    constructor() {
        this.root = null;
    }

    // Função auxiliar para obter a altura do nó
    getHeight(node) {
        return node ? node.height : 0;
    }

    // Função auxiliar para obter o fator de balanceamento
    getBalanceFactor(node) {
        return node ? this.getHeight(node.left) - this.getHeight(node.right) : 0;
    }

    // Função para rodar à direita
    rotateRight(y) {
        const x = y.left;
        const T2 = x.right;

        x.right = y;
        y.left = T2;

        y.height = Math.max(this.getHeight(y.left), this.getHeight(y.right)) + 1;
        x.height = Math.max(this.getHeight(x.left), this.getHeight(x.right)) + 1;

        return x;
    }

    // Função para rodar à esquerda
    rotateLeft(x) {
        const y = x.right;
        const T2 = y.left;

        y.left = x;
        x.right = T2;

        x.height = Math.max(this.getHeight(x.left), this.getHeight(x.right)) + 1;
        y.height = Math.max(this.getHeight(y.left), this.getHeight(y.right)) + 1;

        return y;
    }

    // Função para inserir um nó na árvore AVL
    insert(node, key, value) {
        if (!node) {
            return new Node(key, value);
        }

        if (key < node.key) {
            node.left = this.insert(node.left, key, value);
        } else if (key > node.key) {
            node.right = this.insert(node.right, key, value);
        } else {
            return node; // Chaves duplicadas não são permitidas
        }

        node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));

        const balanceFactor = this.getBalanceFactor(node);

        if (balanceFactor > 1 && key < node.left.key) {
            return this.rotateRight(node);
        }

        if (balanceFactor < -1 && key > node.right.key) {
            return this.rotateLeft(node);
        }

        if (balanceFactor > 1 && key > node.left.key) {
            node.left = this.rotateLeft(node.left);
            return this.rotateRight(node);
        }

        if (balanceFactor < -1 && key < node.right.key) {
            node.right = this.rotateRight(node.right);
            return this.rotateLeft(node);
        }

        return node;
    }

    // Função para adicionar um nó
    add(key, value) {
        this.root = this.insert(this.root, key, value);
    }

    // Função auxiliar para encontrar o menor valor no subárvore direita
    minValueNode(node) {
        let current = node;
        while (current.left !== null) {
            current = current.left;
        }
        return current;
    }

    // Função auxiliar para remover um nó
    remove(node, key) {
        if (!node) return node;

        if (key < node.key) {
            node.left = this.remove(node.left, key);
        } else if (key > node.key) {
            node.right = this.remove(node.right, key);
        } else {
            // Nodo a ser removido encontrado
            if (!node.left) {
                return node.right;
            } else if (!node.right) {
                return node.left;
            }

            // Nodo com dois filhos: obtenha o menor valor no subárvore direita
            const temp = this.minValueNode(node.right);
            node.key = temp.key;
            node.value = temp.value;
            node.right = this.remove(node.right, temp.key);
        }

        if (!node) return node;

        node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));

        const balanceFactor = this.getBalanceFactor(node);

        if (balanceFactor > 1 && this.getBalanceFactor(node.left) >= 0) {
            return this.rotateRight(node);
        }

        if (balanceFactor > 1 && this.getBalanceFactor(node.left) < 0) {
            node.left = this.rotateLeft(node.left);
            return this.rotateRight(node);
        }

        if (balanceFactor < -1 && this.getBalanceFactor(node.right) <= 0) {
            return this.rotateLeft(node);
        }

        if (balanceFactor < -1 && this.getBalanceFactor(node.right) > 0) {
            node.right = this.rotateRight(node.right);
            return this.rotateLeft(node);
        }

        return node;
    }

    // Função para remover um nó
    removeNode(key) {
        this.root = this.remove(this.root, key);
    }

    // Função para encontrar um nó
    find(node, key) {
        if (!node) return null;

        if (key === node.key) return node;
        if (key < node.key) return this.find(node.left, key);
        return this.find(node.right, key);
    }

    // Função para buscar um nó
    search(key) {
        const node = this.find(this.root, key);
        return node ? node.value : null;
    }

    searchByUsername(node, username) {
        if (!node) return null;

        if (node.value.USERNAME === username) return node;

        if (username < node.value.USERNAME) {
            return this.searchByUsername(node.left, username);
        } else {
            return this.searchByUsername(node.right, username);
        }
    }

    // Função para percorrer a árvore em ordem
    inOrderTraversal(node, result = []) {
        if (node) {
            this.inOrderTraversal(node.left, result);
            result.push({ key: node.key, ...node.value });
            this.inOrderTraversal(node.right, result);
        }
        return result;
    }

    // Função para imprimir a árvore
    printTree() {
        const nodes = this.inOrderTraversal(this.root);
        console.log("Árvore AVL:");
        nodes.forEach(node => {
            console.log(`Key: ${node.key}, Value: ${JSON.stringify(node.value)}`);
        });
    }

    // Função para atualizar um campo específico no documento
    updateDoc(docId, field, newValue) {
        const node = this.find(this.root, docId);
        if (node) {
            node.value[field] = newValue; // Atualiza o campo específico
            this.saveToFile(); // Salva o novo estado da árvore no arquivo
            return true;
        }
        return false;
    }

    // Função auxiliar para salvar a árvore AVL em data.json
    saveToFile() {
        const data = this.inOrderTraversal(this.root);
        const filePath = path.join(__dirname, 'src/database/data.json');
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }
}

module.exports = AVLTree;
