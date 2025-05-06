const express = require('express');
const router = express.Router();
const CitasCalendario = require('../models/citasCalendarioModel.js');
const DisponibilidadCitas = require('../models/disponibilidadCitasSemanalModel');
const ExcepcionesCitas = require('../models/excepcionesDisponibilidadModel');

// Obtener todas las citas
router.get('/', async (req, res) => {
  try {
    const appointments = await Citas.find();
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener citas', error: err.message });
  }
});

// Crear nueva cita
router.post('/', async (req, res) => {
  try {
    const newAppointment = new Citas(req.body);
    const saved = await newAppointment.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: 'Error al crear cita', error: err.message });
  }
});

// Ruta para obtener disponibilidad y citas para un día específico
router.get('/:date', async (req, res) => {
    const { date } = req.params;
  
    try {
      // Convertir la fecha para comparar (sin hora) y obtener el día de la semana
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.toLocaleString('en-us', { weekday: 'long' }).toLowerCase(); // monday, tuesday, etc.
      
      // Obtener las disponibilidades semanales para ese día
      const weeklyAvailability = await DisponibilidadCitas.find({ weekday: dayOfWeek }).populate('provider');
  
      // Obtener las excepciones de disponibilidad para esa fecha
      const availabilityException = await ExcepcionesCitas.findOne({ date: targetDate }).populate('provider');
  
      // Obtener las citas programadas para ese día
      const appointments = await CitasCalendario.find({ date: targetDate }).populate('provider client');
  
      // Si hay una excepción para ese día, sobreponer las horas bloqueadas
      let availableHours = [];
      let occupiedHours = {};
      if (availabilityException) {
        // Usamos las horas de la excepción para bloquear esas horas
        availableHours = weeklyAvailability.flatMap((weekAvail) => {
          return weekAvail.timeSlots.filter(hour => !availabilityException.overrideTimeSlots.includes(hour));
        });
      } else {
        // Si no hay excepción, solo se devuelven las horas de la disponibilidad semanal
        availableHours = weeklyAvailability.flatMap((weekAvail) => weekAvail.timeSlots);
      }
  
      // Marcar las horas ocupadas por las citas programadas
      appointments.forEach((appointment) => {
        const appointmentTime = appointment.time;
        if (!occupiedHours[appointmentTime]) {
          occupiedHours[appointmentTime] = [];
        }
        occupiedHours[appointmentTime].push({
          clientName: appointment.client.clientName,
          service: appointment.service,
          status: appointment.status
        });
      });
  
      // Filtrar las horas disponibles, eliminando las horas que ya están ocupadas
      availableHours = availableHours.filter(hour => !occupiedHours[hour]);
  
      // Responder con la disponibilidad real para ese día y las citas
      res.json({
        date: targetDate.toISOString().split('T')[0],
        dayOfWeek,
        availableHours,
        exception: availabilityException ? availabilityException.overrideTimeSlots : [],
        occupiedHours
      });
    } catch (error) {
      console.error('Error al obtener disponibilidad real:', error);
      res.status(500).json({ error: 'Error al obtener disponibilidad' });
    }
  });

module.exports = router;
