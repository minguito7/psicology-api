const express = require('express');
const {verificarToken, verificarAdmin } = require('../middlewares/authMiddleware.js');
const { uploadImageUser } = require('../middleware/multerConfig.js');
//const verificarToken = require('../middleware/middleware.js');
const router = express.Router();
const TipsController = require('../controllers/tipsController.js');

router.get('/' ,TipsController.getAllTips);

router.get('/ultTips' ,TipsController.ultTips);

router.post('/', verificarToken, verificarAdmin,TipsController.addTip);

// Ruta para actualizar un tip existente
router.put('/:userId',verificarToken, TipsController.editTip);

// Ruta para eliminar un tip existente
router.delete('/:userId',verificarToken, TipsController.deleteTip);
