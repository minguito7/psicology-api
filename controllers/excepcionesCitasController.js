const express = require('express');
const router = express.Router();

const validate = require('./validate-token');
const AvailabilityException = require('../models/excepcionesDisponibilidadModel');

// 🔹 GET /api/exceptions/getAll
router.get('/', validate.protegerRuta(), (req, res) => {
  AvailabilityException.find().populate('provider').then(data => {
    res.send({ ok: true, resultado: data });
  }).catch(err => {
    res.status(500).send({ ok: false, error: err });
  });
});

// 🔹 GET /api/exceptions/getByProvider/:id
router.get('/:id', validate.protegerRuta(), (req, res) => {
  AvailabilityException.find({ provider: req.params.id }).then(data => {
    if (data.length > 0) {
      res.send({ ok: true, resultado: data });
    } else {
      res.status(404).send({ ok: false, error: "No hay excepciones para este proveedor" });
    }
  }).catch(err => {
    res.status(500).send({ ok: false, error: err });
  });
});

// 🔹 POST /api/exceptions/create
router.post('/', validate.protegerRuta(), async (req, res) => {
  try {
    const { provider, date, overrideTimeSlots } = req.body;

    const existente = await AvailabilityException.findOne({ provider, date });

    if (existente) {
      const nuevosSlots = overrideTimeSlots.filter(slot => !existente.overrideTimeSlots.includes(slot));

      if (nuevosSlots.length === 0) {
        return res.status(400).send({
          ok: false,
          error: 'Todos los horarios ya están registrados como excepción para esa fecha.'
        });
      }

      existente.overrideTimeSlots.push(...nuevosSlots);
      const actualizado = await existente.save();

      return res.status(200).send({
        ok: true,
        resultado: actualizado,
        mensaje: `Se agregaron ${nuevosSlots.length} nuevo(s) horario(s) a la excepción existente.`
      });
    }

    // No existe aún, creamos nueva excepción
    const nuevaExcepcion = new AvailabilityException(req.body);
    const guardado = await nuevaExcepcion.save();

    res.status(201).send({
      ok: true,
      resultado: guardado,
      mensaje: 'Excepción creada exitosamente.'
    });

  } catch (err) {
    res.status(400).send({ ok: false, error: err.message || err });
  }
});




module.exports = router;