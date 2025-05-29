const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoice_number: {
    type: String,
    required: true,
    unique: true,
  },
  issue_date: {
    type: Date,
    required: true,
  },
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario', // paciente
    required: true,
  },
  sessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cita',
    required: true,
  }],
  base_amount: {
    type: Number,
    required: true,
  },
  vat: {
    type: Number,
    default: 0,
  },
  irpf: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
  paid: {
    type: Boolean,
    default: false,
  },
  citaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cita',
    default: null,
  },
  payment_method: {
    type: String,
    enum: ['efectivo', 'transferencia', 'tarjeta', 'bizum'],
    default: 'efectivo'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Invoice', invoiceSchema);
