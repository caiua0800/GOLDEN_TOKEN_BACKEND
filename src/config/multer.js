// config/multerConfig.js
const multer = require('multer');
const path = require('path');

// Configura o armazenamento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Pasta onde os arquivos serão salvos
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const fileName = `${Date.now()}${ext}`;
        cb(null, fileName); // Nome do arquivo
    }
});

// Filtra os tipos de arquivos permitidos
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo não suportado'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Tamanho máximo do arquivo (5MB)
});

module.exports = upload;
