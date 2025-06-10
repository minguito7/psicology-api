const express = require('express');
const router = express.Router();
const validate = require('./validate-token');
const WeeklyAvailability = require('../models/disponibilidadCitasSemanalModel');
const Cita = require('../models/citasCalendarioModel');
const Usuario = require('../models/usuarioModel');
const AvailabilityException = require('../models/excepcionesDisponibilidadModel');

//GET DISPONIBILIDAD PARA USUARIOS
router.get('/disponibilidad-general', async (req, res) => {
  try {
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

    // 1. Psicólogos activos
    const psicologos = await Usuario.find({ rol: 'worker', activo: true });

    // 2. Mapa de hora - psicólogos disponibles
    const mapaDisponibilidad = {};

    for (const psicologo of psicologos) {
      const disponibilidad = await WeeklyAvailability.findOne({
        provider: psicologo._id,
        weekday: diaSemana
      });

      const excepcion = await AvailabilityException.findOne({
        provider: psicologo._id,
        date: { $gte: inicioDia, $lte: finDia }
      });

      const timeSlots = disponibilidad?.timeSlots || [];
      const bloqueadas = excepcion?.overrideTimeSlots || [];

      const horasDisponibles = timeSlots.filter(h => !bloqueadas.includes(h));

      for (const hora of horasDisponibles) {
        if (!mapaDisponibilidad[hora]) {
          mapaDisponibilidad[hora] = [];
        }


        mapaDisponibilidad[hora].push({
          id: psicologo._id,
          nombre: psicologo.nombre,
          especialidad: psicologo.especialidad,
          avatar: psicologo.avatar
        });
      }
    }

    // 3. Citas agendadas
    const citas = await Cita.find({
      fecha_sesion: { $gte: inicioDia, $lte: finDia },
      status: { $in: ['pending', 'confirmed'] }
    });

    // 4. Filtrar psicólogos ocupados por hora
    for (const cita of citas) {
      const hora = cita.hora;
      const psicologoId = cita.psicologoId.toString();

      if (mapaDisponibilidad[hora]) {
        mapaDisponibilidad[hora] = mapaDisponibilidad[hora].filter(
          p => p.id.toString() !== psicologoId
          
        );

      }
    }


    // 5. Construir respuesta final
    const disponibilidadFinal = Object.entries(mapaDisponibilidad)
      .filter(([_, psicologos]) => psicologos.length > 0)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([hora, psicologosDisponibles]) => ({
        hora,
        psicologosDisponibles
      }));
   
    
    res.status(200).send({
      ok: true,
      fecha: fechaStr,
      disponibilidad: disponibilidadFinal,
      mensaje: `Disponibilidad cargada correctamente para el ${fechaStr}`
    });

  } catch (err) {
    console.error(err);
    res.status(500).send({ ok: false, error: err.message });
  }
});


// Devuelve todos la disponibilidad
router.get('/', validate.protegerRuta(), (req, res) => {
  WeeklyAvailability.find().populate('provider').then(data => {
    res.send({ ok: true, resultado: data });
  }).catch(err => {
    res.status(500).send({ ok: false, error: err });
  });
});

// Devuelve la disponibilidad de un Psicologo
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


// Devuelve la disponibilidad de un dia de un psicologo
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


// 
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
