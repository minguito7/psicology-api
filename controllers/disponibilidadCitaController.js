const express = require('express');
const router = express.Router();
const validate = require('./validate-token');
const WeeklyAvailability = require('../models/disponibilidadCitasSemanalModel');
const Cita = require('../models/citasCalendarioModel');
const AvailabilityException = require('../models/excepcionesDisponibilidadModel');


// 🔹 GET /api/disponibilidad/
router.get('/', validate.protegerRuta(), (req, res) => {
  WeeklyAvailability.find().populate('provider').then(data => {
    res.send({ ok: true, resultado: data });
  }).catch(err => {
    res.status(500).send({ ok: false, error: err });
  });
});

// 🔹 GET /api/disponibilidad/:id
router.get('/:id', validate.protegerRuta(), (req, res) => {
  WeeklyAvailability.find({ provider: req.params.id }).then(data => {
    if (data.length > 0) {
      res.send({ ok: true, resultado: data });
    } else {
      res.status(404).send({ ok: false, error: "No hay disponibilidad para este proveedor" });
    }
  }).catch(err => {
    res.status(500).send({ ok: false, error: err });
  });
});


// 🔹 GET /api/disponibilidad/por-dia/:id?fecha=2025-05-21
router.get('/por-dia/:id', validate.protegerRuta(), async (req, res) => {
try {
  const providerId = req.params.id;
  const fechaStr = req.query.fecha;

  if (!fechaStr) {
    return res.status(400).send({
      ok: false,
      error: "Fecha requerida en el query param (?fecha=YYYY-MM-DD)"
    });
  }

  const fecha = new Date(fechaStr);
  const diaSemana = fecha.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const inicioDia = new Date(fechaStr + 'T00:00:00');
  const finDia = new Date(fechaStr + 'T23:59:59');

  // 1. Obtener la disponibilidad semanal
  const disponibilidad = await WeeklyAvailability.findOne({
    provider: providerId,
    weekday: diaSemana
  });

  let horariosDisponibles = disponibilidad ? disponibilidad.timeSlots : [];

  // 2. Obtener excepción (horas bloqueadas)
  const excepcion = await AvailabilityException.findOne({
    provider: providerId,
    date: { $gte: inicioDia, $lte: finDia }
  });

  const horasBloqueadasPorExcepcion = excepcion?.overrideTimeSlots || [];

  // 3. Obtener citas agendadas con detalles
  const citas = await Cita.find({
    psicologoId: providerId,
    fecha_sesion: { $gte: inicioDia, $lte: finDia },
    status: { $in: ['pending', 'confirmed'] }
  }).populate('pacienteId').populate('psicologoId');

  const horasOcupadas = citas.map(cita => cita.hora);

  // 4. Eliminar tanto las citas como los bloques por excepción
  const horariosFinales = horariosDisponibles.filter(hora =>
    !horasOcupadas.includes(hora) && !horasBloqueadasPorExcepcion.includes(hora)
  );


  // 5. Preparar los detalles de las citas ocupadas
  const citasConDetalles = citas.map(cita => ({
    id: cita.id,
    hora: cita.hora,
    clientName: cita.pacienteId?.nombre ?? 'Paciente desconocido',
    notas: cita.notas ?? 'Sin Notas',
    status: cita.status
  }));
  
  //console.log(citas);
  res.status(200).send({
    ok: true,
    fecha: fechaStr,
    disponibilidad: horariosFinales,
    ocupadas: horasOcupadas,
    citas: citas
  });

} catch (err) {
  console.error(err);
  res.status(500).send({ ok: false, error: err.message });
}

});



// 🔹 POST /api/availability/
router.post('/', validate.protegerRuta(), async (req, res) => {
  try {
    const { provider, weekday, timeSlots } = req.body;

    const disponibilidadExistente = await WeeklyAvailability.findOne({ provider, weekday });

    if (disponibilidadExistente) {
      const existentes = disponibilidadExistente.timeSlots;
      const nuevosSlots = timeSlots.filter(slot => !existentes.includes(slot));
      const duplicados = timeSlots.filter(slot => existentes.includes(slot));

      if (nuevosSlots.length === 0) {
        return res.status(200).send({
          ok: false,
          mensaje: 'No se agregaron nuevos horarios.',
          agregados: 0,
          repetidos: duplicados.length,
        });
      }

      disponibilidadExistente.timeSlots.push(...nuevosSlots);
      const actualizado = await disponibilidadExistente.save();

      return res.status(200).send({
        ok: true,
        resultado: actualizado,
        mensaje: 'Horarios agregados parcialmente.',
        agregados: nuevosSlots.length,
        repetidos: duplicados.length,
      });
    }

    // Crear nuevo documento
    const nuevo = new WeeklyAvailability({ provider, weekday, timeSlots });
    const creado = await nuevo.save();

    return res.status(201).send({
      ok: true,
      resultado: creado,
      mensaje: 'Disponibilidad creada completamente.',
      agregados: timeSlots.length,
      repetidos: 0,
    });

  } catch (err) {
    res.status(400).send({ ok: false, error: err.message || err });
  }
});




module.exports = router;
