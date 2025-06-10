const express = require('express');
const router = express.Router();
const validate = require('./validate-token');
const Cita = require('../models/citasCalendarioModel');
const Usuario = require('../models/usuarioModel');
const mongoose = require('mongoose');

// GET /api/citas/getAll
router.get('/', validate.protegerRuta(), (req, res) => {
  Cita.find().populate('pacienteId psicologoId').then(citas => {
    if (citas.length > 0) {
      res.send({ ok: true, resultado: citas });
    } else {
      res.status(404).send({ ok: false, error: "No se encontraron citas" });
    }
  }).catch(err => {
    res.status(500).send({ ok: false, error: err });
  });
});



router.get('/getCitasTablaBack', validate.protegerRuta(), async (req, res) => {
  try {
    const psicologos = await Usuario.find({ rol: 'worker' });


    if (!psicologos.length) {
      return res.status(404).json({ message: 'No se encontraron psicólogos' });
    }

    const psicologoIds = psicologos.map(p => p._id);


    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Establece hora 00:00 para comparar solo fecha

    const citas = await Cita.find({
      psicologoId: { $in: psicologoIds },
      fecha_sesion: { $gte: hoy }  // 🔹 Solo citas desde hoy
    })
    .populate('pacienteId')
    .populate('psicologoId')
    .sort({ fecha_sesion: 1, hora: 1 });


    res.json(citas);
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ message: 'Error al obtener citas' });
  }
});

router.get('/:psicologoId/getCitasTablaBack', validate.protegerRuta(), async (req, res) => {
  try {
    const psicologoId = req.params.psicologoId;
    const psicologo = await Usuario.findById({_id:psicologoId});

    if (!psicologo) {
      return res.status(404).json({ message: 'No se encontraron psicólogos' });
    }


    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Establece hora 00:00 para comparar solo fecha

    const citas = await Cita.find({
      psicologoId: { $in: psicologoId },
      fecha_sesion: { $gte: hoy }  // 🔹 Solo citas desde hoy
    })
    .populate('pacienteId')
    .populate('psicologoId')
    .sort({ fecha_sesion: 1, hora: 1 });


    res.json(citas);
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ message: 'Error al obtener citas' });
  }
});



// 
router.get('/getByPsicologo/:psicologoId', validate.protegerRuta(), (req, res) => {
  const psicologoId = req.params.psicologoId;

  // Obtener la fecha actual (solo fecha, sin hora)
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); // Ajustamos para solo considerar la fecha (sin la hora)

  // Buscamos todas las citas donde el psicólogo sea el especificado y cuya fecha sea >= hoy
  Cita.find({ psicologoId, fecha_sesion: { $gte: hoy } })
    .populate('pacienteId psicologoId') // Si necesitas información sobre paciente y psicólogo
    .sort({ fecha_sesion: -1 }) // Ordenar en orden descendente por fecha (más reciente primero)
    .then(citas => {
      if (citas.length > 0) {
        res.send({ ok: true, resultado: citas });
      } else {
        res.status(404).send({ ok: false, error: "No se encontraron citas para este psicólogo" });
      }
    })
    .catch(err => {
      res.status(500).send({ ok: false, error: err });
    });
});

router.get('/get/:citaId', validate.protegerRuta(), async (req, res) => {
  const id = req.params.citaId;

  // Verifica si es un ObjectId válido
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({ ok: false, error: 'ID de cita no válido' });
  }

  try {
    console.log('Buscando cita con ID:', id);
    
    const cita = await Cita.findById(new mongoose.Types.ObjectId(id))
    console.log('Conectado a la CITA en:',cita);
    

    if (!cita) {
      console.warn('No se encontró la cita para ID:', id);
      return res.status(404).send({ ok: false, error: 'Cita no encontrada' });
    }

    console.log('Cita encontrada:', cita);
    res.send({ ok: true, resultado: cita });
  } catch (err) {
    console.error('Error al buscar cita:', err);
    res.status(500).send({ ok: false, error: err.message });
  }
});




//PUT
router.put('/:id/estado', validate.protegerRuta(), async (req, res) => {
  try {
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({ ok: false, error: 'Estado es requerido' });
    }

    const citaActualizada = await Cita.findByIdAndUpdate(
      req.params.id,
      { status: estado },
      { new: true }
    );

    if (!citaActualizada) {
      return res.status(404).json({ ok: false, error: 'Cita no encontrada' });
    }

    res.json({ ok: true, resultado: citaActualizada });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ ok: false, error: 'Error del servidor' });
  }
});



// POST 
router.post('/', validate.protegerRuta(), (req, res) => {
  const nuevaCita = new Cita(req.body);
  nuevaCita.save().then(citaGuardada => {
    res.status(201).send({ ok: true, resultado: citaGuardada });
  }).catch(err => {
    res.status(400).send({ ok: false, error: err });
  });
});


module.exports = router;

