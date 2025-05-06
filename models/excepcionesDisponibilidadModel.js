const mongoose = require('mongoose');

const availabilityExceptionSchema = new mongoose.Schema({
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    overrideTimeSlots: [{
      type: String, // formato 'HH:mm'
      validate: {
        validator: (v) => /^\d{2}:\d{2}$/.test(v),
        message: props => `${props.value} no es un horario válido (debe ser HH:mm)`
      }
    }]
  });
  
  module.exports = mongoose.model('AvailabilityException', availabilityExceptionSchema);
  