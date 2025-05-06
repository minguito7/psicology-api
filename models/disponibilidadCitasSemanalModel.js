const mongoose = require('mongoose');

const weeklyAvailabilitySchema = new mongoose.Schema({
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario', // referencia al profesional
      required: true
    },
    weekday: {
      type: String,
      enum: [
        'monday', 'tuesday', 'wednesday', 'thursday',
        'friday', 'saturday', 'sunday'
      ],
      required: true
    },
    timeSlots: [{
      type: String, // formato 'HH:mm'
      validate: {
        validator: (v) => /^\d{2}:\d{2}$/.test(v),
        message: props => `${props.value} no es un horario válido (debe ser HH:mm)`
      }
    }]
  });
  module.exports = mongoose.model('WeeklyAvailability', weeklyAvailabilitySchema);
  