const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    dni:{type:String, unique:true, required: true},
    password: { type: String, required: true },
    avatar: { type: String},
    fecha_nac : { type: Date},
    rol: { 
        type: String,
        enum: ['soid','admin','worker', 'paciente'],
        default: 'paciente'
    },
    gender: {type: String},
    puntos: { type: Number, default: 0 },
    telefono: String,
    direccion: String,
    createAt: { type: Date, default: Date.now },
    ultimo_login: { type: Date },
    psycologyProfile:{
        licenseNumber: String,
        especialidad: String
    },
    activo: {type: Boolean, default: true}
});

module.exports = mongoose.model('Usuario', usuarioSchema);
