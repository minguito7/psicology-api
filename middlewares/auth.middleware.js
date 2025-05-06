// middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuarioModel');

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Asumimos que el token está en el encabezado `Authorization`

  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const decoded = jwt.verify(token, 'secreto');
    req.user = await Usuario.findById(decoded.id).select('-password'); // Guardamos el usuario en `req.user`
    next(); // Si todo es correcto, pasamos al siguiente middleware o ruta
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};
