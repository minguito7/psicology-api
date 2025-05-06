require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const citasRoutes = require('./routes/citasCalendarioRoutes');
const disponibilidadCitasRoutes = require('./routes/disponibilidadCitasSemanalRoutes');
const excepcionesCitasRoutes = require('./routes/excepcionesDisponibilidadRoutes');
const usuariosRoutes = require('./routes/usuariosRoute');

const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');

app.use(cors()); // Habilita CORS para todas las rutas
app.use(express.json());

// Conexión MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado a MongoDB Atlas'))
.catch(err => console.error('❌ Error de conexión:', err));

// Rutas
app.use('/api/citas-calendario', citasRoutes);
app.use('/api/weekly', disponibilidadCitasRoutes);
app.use('/api/exceptions', excepcionesCitasRoutes);
app.use('/api/users', usuariosRoutes);


app.get('/', (req, res) => {
  res.send('API de Psicología funcionando correctamente 🚀');
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
