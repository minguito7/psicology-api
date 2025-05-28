const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
//
let router = express.Router();
const _ = require('underscore');
const Usuario = require('../models/usuarioModel.js');
const multer = require('multer');
router.use(express.json());
let TOKEN_SECRET = process.env.SECRET_KEY;
const titulos = {
    'hombre': 'o',
    'mujer': 'a',
    'otro': 'e'
};
const validateController = require  ('./validate-token.js');

const directorioPadre = path.join(__dirname, '..');
let guardarImagen = path.join('/public/uploads/avatar/');



/* CODIFICAR EL PASSWORD */
async function codifyPassword(passwordBody) {
    try {
        if (!passwordBody) {
            throw new Error('No hay contraseña');
        }
        const saltos = await bcrypt.genSalt(10);
        const password = await bcrypt.hash(passwordBody, saltos);

        return password;
    } catch (error) {
        throw error;
    }
}

/* DETERMINAR EL ULTIMO NUMERO DE USUARIO REGISTRADO EN LA APP */



//-- lOGIN// Método para generar el token tras login correcto
let generarToken = (login, role) => {
    //console.log(role);
    return jwt.sign({ login: login, role: role },
        TOKEN_SECRET, { expiresIn: 86400 });
};

/* SUBIR EL AVATAR A UNA CARPETA */
const storage = multer.diskStorage({

    destination: function(req, file, cb) {
        cb(null, guardarImagen)
    },
    filename: function(req, file, cb) {
        // console.log(file);

        cb(null, `${Date.now()}-${file.originalname}`)
    }
})

const upload = multer({ storage: storage });
//upload.single('myFile');

const uploadAvatar = (req, res) => {
    res.send({ data: 'Enviar un archivo' })
}

function calcularLetraDNI(dniNumeros) {
    // Tabla de letras
    const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';

    // Asegurarse de que dniNumeros tiene 8 dígitos y es un número
    if (!/^\d{8}$/.test(dniNumeros)) {
        throw new Error('El número del DNI debe tener 8 dígitos.');
    }

    // Convertir a número entero y calcular el módulo 23
    const modulo = parseInt(dniNumeros, 10) % 23;

    // Devolver la letra correspondiente
    return letras.charAt(modulo);
}

/*REGISTRO USUARIO*/

router.post('/registro', upload.single('myFile'), async (req, res) => {
    try {
        //console.log('Request Body:', req.body);
//console.log('Uploaded File:', req.file);

        const { nombre, email, fecha_nac ,password, gender } = req.body;




        // Codificar la contraseña
        const passwordCodificada = await codifyPassword(password);

 
        // Si se envía un archivo de imagen
        if (req.file && req.file.mimetype.startsWith('image')) {
            const imageData = fs.readFileSync(req.file.path);
            imagenBase64 = `data:${req.file.mimetype};base64,${imageData.toString('base64')}`;
            fs.unlinkSync(req.file.path);
        } else if (req.body.imagen && req.body.imagen.startsWith('data:image')) {
            imagenBase64 = req.body.imagen;
        }

        // Determinar el título según el sexo

        // Determinar la ruta del avatar
        const avatarPath = req.file ? req.file.path : 'public/uploads/avatar/prede.png';

        // Crear un nuevo usuario
        const nuevoUsuario = new Usuario({
            nombre:nombre,
            email: email.toLowerCase(),
            fecha_nac: fecha_nac,
            password: passwordCodificada,        
            sexo: gender.toLowerCase(),           
            avatar: avatarPath
        });
        //console.log(ID_POBLACION)
        // Guardar el nuevo usuario en la base de datos
        const usuarioGuardado = await nuevoUsuario.save();
        res.status(200).send({
            ok: true,
            resultado: usuarioGuardado
        });

    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ mensaje: 'Error en el registro' });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario por correo electrónico o nameapp
        const usuario = await Usuario.findOne({ email: email });

        if (!usuario) {
            return res.status(400).json({ error: 'Usuario no encontrado' });
        }

        // Verificar la contraseña
        const passValida = await bcrypt.compare(password, usuario.password);
        if (!passValida) {
            return res.status(400).json({ error: 'Contraseña no válida' });
        }

        // Si las credenciales son válidas, generar y devolver el token
        const token = generarToken(usuario.email, usuario.rol, usuario._id);
        res.send({
            ok: true,
            token,
            usuario: {
              id: usuario._id,
              nombre: usuario.nombre,
              email: usuario.email,
              rol: usuario.rol,
              avatar: usuario.avatar // o AVATAR, según cómo lo tengas guardado
            }
          });
          

    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ mensaje: 'Error en el login' });
    }
});

// Ruta para validar el token
router.get('/validate-token', (req, res) => {
    // Obtener el token del encabezado Authorization
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      return res.status(401).json({ valid: false, message: 'Token no proporcionado' });
    }
  
    // Extraer el token (quitar 'Bearer ' del encabezado)
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    
    // Verificar y decodificar el token
    jwt.verify(token, TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        // Token inválido o expirado
        return res.status(401).json({ valid: false, message: 'Token inválido' });
      }
      const usuarioLogged = await Usuario.findOne({email: decoded.login});
      // Token válido
      //console.log(usuarioLogged);
      res.json({ valid: true, usuarioLogged });
    });
  });

module.exports = router;
