const express = require('express');
const router = express.Router();
const Usuario = require('../models/usuarioModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/auth.middleware'); // Middleware de autenticación
const adminMiddleware = require('../middlewares/admin.middleware'); // Middleware para verificar si es admin o soid

// Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password, fecha_nac, rol, gender, telefono, direccion, avatar } = req.body;

    // Verifica si el usuario ya existe
    const existingUser = await Usuario.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'El usuario ya existe con ese correo' });

    // Hashea la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Usuario({
      nombre,
      email,
      password: hashedPassword,
      fecha_nac,
      rol : 'paciente',
      gender,
      telefono,
      direccion,
      avatar,
      status: true // Por defecto, el usuario puede estar activo
    });

    await newUser.save();

    res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hubo un error al registrar el usuario' });
  }
});

// Inicio de sesión
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verifica si el usuario existe
    const user = await Usuario.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });

    // Verifica la contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Contraseña incorrecta' });

    // Genera el token JWT
    const token = jwt.sign({ id: user._id }, 'secreto', { expiresIn: '1d' });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al intentar iniciar sesión' });
  }
});

// Obtener perfil del usuario
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // Asumimos que `req.user` es un objeto con la información del usuario obtenida del token JWT.
    const user = await Usuario.findById(userId).select('-password'); // No devolvemos la contraseña

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el perfil del usuario' });
  }
});

// Editar perfil del usuario
router.put('/me', authMiddleware ,async (req, res) => {
  try {
    const userId = req.user.id;
    const updatedData = req.body;

    // Actualiza el usuario con los nuevos datos
    const updatedUser = await Usuario.findByIdAndUpdate(userId, updatedData, { new: true }).select('-password');

    if (!updatedUser) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al editar el perfil' });
  }
});

// Eliminar cuenta
router.delete('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Elimina el usuario de la base de datos
    const deletedUser = await Usuario.findByIdAndDelete(userId);

    if (!deletedUser) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json({ message: 'Cuenta eliminada exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar la cuenta' });
  }
});

// Obtener perfil de otro usuario (requiere autenticación y permisos de admin o soid)
router.get('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const user = await Usuario.findById(req.params.id).select('-password'); // No devolvemos la contraseña
  
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  
      res.json(user);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener el perfil del usuario' });
    }
  });
  
  // Editar perfil de otro usuario (requiere autenticación y permisos de admin o soid)
  router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const updatedData = req.body;
      const updatedUser = await Usuario.findByIdAndUpdate(req.params.id, updatedData, { new: true }).select('-password');
  
      if (!updatedUser) return res.status(404).json({ error: 'Usuario no encontrado' });
  
      res.json(updatedUser);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al editar el perfil del usuario' });
    }
  });
  
  // Eliminar perfil de otro usuario (requiere autenticación y permisos de admin o soid)
  router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const deletedUser = await Usuario.findByIdAndDelete(req.params.id);
  
      if (!deletedUser) return res.status(404).json({ error: 'Usuario no encontrado' });
  
      res.json({ message: 'Cuenta eliminada exitosamente' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al eliminar la cuenta del usuario' });
    }
  });

module.exports = router;
