const mongoose = require('mongoose');

const registroClinicoSchema = new mongoose.Schema({
  paciente: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },

  motivoConsulta: { type: String, required: true },
  resumenSesion: { type: String },
  observaciones: { type: String },

  evaluacion: {
    testsAplicados: [{ nombre: String, resultado: String }],
    observacionesClinicas: String
  },

  diagnostico: {
    dsm: String,
    cie: String,
    notas: String
  },

  objetivosSesion: [{ type: String }],
  tecnicasUsadas: [{ type: String }],
  tareasAsignadas: [{ type: String }], // Tareas para el paciente
  seguimiento: String,
  createAt: {type: Date, default: Date.now},
  sesion: {
    type: Schema.Types.ObjectId,
    ref: 'Cita',
    required: true
  }
});

module.exports = mongoose.model('RegistroClinico', registroClinicoSchema);
