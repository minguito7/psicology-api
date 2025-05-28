const express = require('express');
const {verificarToken, verificarAdmin } = require('../middlewares/authMiddleware.js');
const { uploadImageUser } = require('../middleware/multerConfig.js');
//const verificarToken = require('../middleware/middleware.js');
const router = express.Router();
const CategoriaController = require('../controllers/categoriaController.js');

router.get('/' ,CategoriaController.getAllTips);

router.post('/', verificarToken, verificarAdmin,CategoriaController.addCategoria);

module.exports = router;
