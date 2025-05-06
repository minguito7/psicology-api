const express = require('express');
const router = express.Router();
const WeeklyAvailability = require('../models/disponibilidadCitasSemanalModel');

// GET todas las disponibilidades semanales
router.get('/', async (req, res) => {
  try {
    const availabilities = await WeeklyAvailability.find().populate('provider');
    res.json(availabilities);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener disponibilidades semanales' });
  }
});

// POST nueva disponibilidad semanal
router.post('/', async (req, res) => {
  try {
    const newAvailability = new WeeklyAvailability(req.body);
    await newAvailability.save();
    res.status(201).json(newAvailability);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE disponibilidad por ID
router.delete('/:id', async (req, res) => {
  try {
    await WeeklyAvailability.findByIdAndDelete(req.params.id);
    res.json({ message: 'Disponibilidad eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

module.exports = router;
