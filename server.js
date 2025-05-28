require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const auth = require('./controllers/authController');
const usuario = require('./controllers/usuariosController');
const tip = require('./controllers/tipsController');
const categoria = require('./controllers/categoriaController');
const cita = require('./controllers/citasController');
const disponibilidadCita = require('./controllers/disponibilidadCitaController');
const excepcionesCita = require('./controllers/excepcionesCitasController');


const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');

app.use(cors()); // Habilita CORS para todas las rutas
app.use(express.json());
const path = require('path');

// Ruta pública para acceder a los archivos subidos
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

console.log(path.join(__dirname, 'public/uploads'))
// función middleware para servir archivos estáticos
//app.use(express.static(path.join(__dirname, 'public/uploads')));

app.use(cors({
    origin: 'http://localhost:4200',
    optionsSuccessStatus: 200, 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-Kuma-Revision'], 
}));
// Conexión MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado a MongoDB Atlas'))
.catch(err => console.error('❌ Error de conexión:', err));

// Rutas
app.use('/auth', auth);
app.use('/usuario', usuario);
app.use('/tip', tip);
app.use('/categoria', categoria);
app.use('/cita', cita);
app.use('/disponibilidad-cita', disponibilidadCita);
app.use('/excepciones-cita', excepcionesCita);



app.get('/', (req, res) => {
  res.send('API de Psicología funcionando correctamente 🚀');
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
