const mongoose = require('mongoose');

const tipsSchema = new mongoose.Schema({
    expecialist: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Usuario', // referencia al profesional
          required: true
    },
    contentVideo: {type:String},
    description: {type:String},
    titulo: {type:String, required: true},
    createAt: {type: Date, default: Date.now },
    likes : [{
        usuario: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario'
        }
    }],
    points: { type:Number, required: true},
    categoria: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categoria', // referencia al profesional
        required: true
    }
})


module.exports = mongoose.model('Tips', tipsSchema);
