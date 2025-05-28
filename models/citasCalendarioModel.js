const mongoose = require('mongoose');

const citasCalendarioSchema = new mongoose.Schema({
  pacienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },  // Referencia al paciente
  psicologoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }, // Referencia al psicólogo
  fecha_sesion: { type: Date, required: true },  // Fecha de la sesión
  hora:  { type: String },
  duracion: { type: Number, required: true },  // Duración en minutos
  notas: { type: String },    // Notas de la sesión
  progreso: { type: String }, // Progreso observado (si es relevante)
  recomendaciones: { type: String }, // Recomendaciones para el paciente
  notas_ocultas: { type: String }, // notas que no puede ver el paciente
  puntuacion: { type: Number, default:0},  // Puntuación (si se implementa)
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Cita', citasCalendarioSchema);
