const express = require('express');
const router = express.Router();
const AvailabilityException = require('../models/excepcionesDisponibilidadModel');

// GET todas las excepciones
router.get('/', async (req, res) => {
  try {
    const exceptions = await AvailabilityException.find().populate('provider');
    res.json(exceptions);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener excepciones' });
  }
});

// POST nueva excepción
router.post('/', async (req, res) => {
  try {
    const newException = new AvailabilityException(req.body);
    await newException.save();
    res.status(201).json(newException);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE excepción por ID
router.delete('/:id', async (req, res) => {
  try {
    await AvailabilityException.findByIdAndDelete(req.params.id);
    res.json({ message: 'Excepción eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar excepción' });
  }
});

module.exports = router;
