const mongoose = require('mongoose');

const citasCalendarioSchema = new mongoose.Schema({
  pacienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  psicologoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  fecha_sesion: { type: Date, required: true },
  hora: { type: String },
  duracion: { type: Number, required: true },
  notas: { type: String },
  progreso: { type: String },
  recomendaciones: { type: String },
  notas_ocultas: { type: String },
  puntuacion: { type: Number, default: 0 },
  tipo_consulta: { type: String },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  precio_bruto: { type: Number, default: 30 },
  invoice: { type: Boolean, default: false },
  facturaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null }
}, {
  timestamps: true
});

module.exports = mongoose.model('Cita', citasCalendarioSchema);
