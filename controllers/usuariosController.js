
const Usuario = require('../models/usuarioModel.js');

const bcrypt = require('bcrypt');
const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');

let router = express.Router();
const validate = require('./validate-token');
const _ = require('underscore');
const cors = require('cors');
const mongoose = require('mongoose');
router.use(express.json());
const path = require('path');
const multer = require('multer');
const titulos = {
    'hombre': 'o',
    'mujer': 'a',
    'otro': 'e'
};
const directorioPadre = path.join(__dirname, '..');
let guardarImagen = path.join(directorioPadre+'/public/uploads/avatar/');

/* DETERMINAR NAMEAPP, SI EXISTE UNO IGUAL DARLE OPCIONES DISTINTAS */
async function obtenerVariantesNickname(nickName) {
    const variantes = [];
    const maxVariantes = 5; // Número máximo de variantes sugeridas
    let suffix = 1;

    // Genera variantes hasta encontrar algunas disponibles
    while (variantes.length < maxVariantes) {
        const nuevoNickname = `${nickName}${suffix}`;
        const existe = await Usuario.findOne({ NAMEAPP: nuevoNickname });

        if (!existe) {
            variantes.push(nuevoNickname);
        }

        suffix++;
    }

    return variantes;
}

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

/*REGISTRO USUARIO SIENDO ADMIN*/
// Crear un nuevo usuario
router.post('/registro-admin', validate.protegerRuta(), upload.single('myFile'), async (req, res) => {
  try {
    console.log('Body recibido:', req.body);
    console.log('Archivo recibido:', req.file?.path.split('/'));

    const { nombre, email, password, fecha_nac, gender, licenseNumber, especialidad, avatar } = req.body;

    // Verifica si ya existe el email
    const comprobacion_email = await Usuario.findOne({ email });
    if (comprobacion_email) {
      return res.status(400).send({
        ok: false,
        error: "Error, EL EMAIL YA EXISTE EN LA APP"
      });
    }

    // Codificar la contraseña
    const passwordCodificada = await codifyPassword(password);

    // Ruta del avatar
    const avatarPath = req.file ? `/uploads/avatar/${req.file.filename}` : '/uploads/avatar/prede.png';
    console.log(avatarPath)

    // Construcción del nuevo usuario
    const nuevoUsuario = new Usuario({
      nombre,
      fecha_nac,
      email: email.toLowerCase(),
      password: passwordCodificada,
      gender: gender?.toLowerCase(),
      avatar: avatarPath,
      psycologyProfile: {
        licenseNumber,
        especialidad
      }
    });

    // Guardar usuario
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




/* ENVIAR TODOS LOS USUARIOS */
router.get('/', validate.protegerRuta(''), (req, res) => {
    Usuario.find().then(x => {
        if (x.length > 0) {
            res.send({ ok: true, resultado: x });
        } else {
            res.status(500).send({ ok: false, error: "No se encontro ningun usuario" })
        }
    }).catch(err => {
        res.status(500).send({
            ok: false,
            error: err
        });
    });
});

/* ENVIAR TODOS LOS TRABAJADORES */
router.get('/getWorkers', validate.protegerRuta(), (req, res) => {
    Usuario.find({rol:'worker'}).then(x => {
        if (x.length > 0) {
            //console.log(x)
            res.send({ ok: true, resultado: x });
        } else {
            res.status(500).send({ ok: false, error: "No se encontro ningun usuario" })
        }
    }).catch(err => {
        res.status(500).send({
            ok: false,
            error: err
        });
    });
});

/* ENVIAR TODOS LOS TRABAJADORES */
router.get('/getPacientes', validate.protegerRuta(), (req, res) => {
    Usuario.find({rol:'paciente'}).then(x => {
        if (x.length > 0) {
            res.send({ ok: true, resultado: x });
        } else {
            res.status(500).send({ ok: false, error: "No se encontro ningun usuario" })
        }
    }).catch(err => {
        res.status(500).send({
            ok: false,
            error: err
        });
    });
});

//RECUPERAR TODOS LOS USUARIOS ACTIVOS
router.get('/activos', validate.protegerRuta(), async (req, res) => {
  try {
    const usuariosActivos = await Usuario.find({ activo: true });

    if (usuariosActivos.length === 0) {
      return res.status(404).send({
        ok: false,
        error: 'No se encontró ningún usuario activo'
      });
    }

    const workers = usuariosActivos.filter(u => u.rol == 'worker');
    const pacientes = usuariosActivos.filter(u => u.rol == 'paciente');
    const admins = usuariosActivos.filter(u => u.rol === 'admin' || u.rol=== 'soid');

    res.send({
      ok: true,
      resultado: {
        workers,
        pacientes,
        admins
      }
    });
  } catch (err) {
    res.status(500).send({
      ok: false,
      error: err.message || err
    });
  }
});

//RECUPERAR TODOS LOS USUARIOS NO ACTIVOS - false
router.get('/desactivos', validate.protegerRuta(''), (req, res) => {
    Usuario.find({ ACTIVO: false }).then(x => {
        if (x.length > 0) {
            res.send({ ok: guardarImagenrue, resultado: x });
        } else {
            res.status(500).send({ ok: false, error: "No se encontro ningun usuario" })
        }
    }).catch(err => {
        res.status(500).send({
            ok: false,
            error: err
        });
    });
});


//RECUPERAR UN USUARIO
router.get('/:id', validate.protegerRuta(''), async(req, res) => {
    try {
        const id = req.params._id;
        const usuario = await Usuario.findOne({ id });
        //console.log(usuario);
        if (usuario) {
            res.send({ ok: true, resultado: usuario });
        } else {
            res.status(404).send({ ok: false, error: "No se encontró ningún usuario" });
        }
    } catch (error) {
        res.status(500).send({ ok: false, error: "Error al buscar el usuario" });
    }
});

//MODIFICAR USUARIO (NAME / EMAIL)
router.put('/edit-profile/:id', validate.protegerRuta(''), async(req, res) => {
    try {
        const id = req.params.id;

        // Asegúrate de que el ID proporcionado es válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                error: 'ID de usuario no válido'
            });
        }

        // Selecciona solo los campos permitidos
        let body = _.pick(req.body, ['nombre', 'APELLIDOS', 'NAMEAPP', 'EMAIL', 'DIRECCION', 'ID_POBLACION', 'COD_POSTAL', 'SEXO']);

        // Filtrar propiedades no definidas
        Object.keys(body).forEach(key => {
            if (body[key] === undefined) {
                delete body[key];
            }
        });

        // Verificar si el NAMEAPP ya está en uso por otro usuario
        if (body.NAMEAPP) {
            const comprobacion_nickname = await Usuario.findOne({ NAMEAPP: body.NAMEAPP, _id: { $ne: id } });
            if (comprobacion_nickname) {
                const variantes = await obtenerVariantesNickname(body.NAMEAPP);
                return res.status(400).send({
                    ok: false,
                    error: "Error, este nickname ya existe",
                    sugerencias: variantes
                });
            }
        }

        // Actualizar el título según el sexo si se está actualizando
        if (body.gender) {
            const actualizarTitulo = titulos[body.SEXO.toLowerCase()] || 'Sre. ';
            body.TITULO1 = actualizarTitulo;
        }

        // Actualizar el usuario en la base de datos
        const usuarioActualizado = await Usuario.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();

        if (!usuarioActualizado) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        res.json({
            ok: true,
            usuario: usuarioActualizado
        });
    } catch (err) {
        console.error('Error al actualizar el perfil:', err);
        res.status(500).json({
            ok: false,
            error: 'Ocurrió un error al actualizar el perfil'
        });
    }
});

//MODIFICAR USUARIO (PASSWORD)
router.post('/edit-password/:id', cors(), validate.protegerRuta(''), async(req, res) => {
    let id = req.params.id;
    let passEncriptada = await codifyPassword(req.body.PASSWORD);

    try {
        const passActualizadaUsu = await Usuario.findByIdAndUpdate(id, { $set: { PASSWORD: passEncriptada } }, { new: true, runValidators: true }).lean();
        if (!passActualizadaUsu) {
            console.log('Usuario no encontrado')
            return res.status(404).json({
                ok: false,
                mensaje: 'Usuario no encontrado'
            });
        }
        console.log('ambiada la password correctamente')

        res.json({
            ok: true,
            usuario: passActualizadaUsu,
            mensaje: 'Cambiada la password correctamente'
        });
    } catch (err) {
        res.status(400).json({
            ok: false,
            error: err
        });
    }

});

/* BORRAR USUARIO - ACTUALIZAR ESTADO ACTIVO A false */
router.put('/edit-activo/:id', validate.protegerRuta(''), async(req, res) => {
    try {
        const usuarioActualizado = await Usuario.findByIdAndUpdate(
            req.params.id, { $set: { ACTIVO: false } }, { new: true, runValidators: true }
        ).lean();

        if (!usuarioActualizado) {
            return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
        }
        res.json({ ok: true, mensaje: 'Usuario desactivado correctamente', usuario: usuarioActualizado });
    } catch (error) {
        console.error('Error desactivando el usuario:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al desactivar el usuario', error });
    }
});


//MODIFICAR USUARIO (AVATAR)
router.post('/modify-avatar/:id', upload.single('myFile'), async(req, res) => {
    try {
        // Validar que se haya enviado un archivo
        if (!req.file) {
            return res.status(400).send({
                ok: false,
                error: "Por favor, sube un archivo"
            });
        }

        // Buscar al usuario por su DNI o por algún identificador único
        const usuario = await Usuario.findOne({ id: req.body.id });
        console.log(req.body.id);
        if (!usuario) {
            return res.status(404).send({
                ok: false,
                error: "Usuario no encontrado"
            });
        }

        // Actualizar el avatar del usuario
        usuario.AVATAR = req.file.path;
        if(usuario.AVATAR){
            const baseDir2 = 'avatar';
                const baseDirIndex2 = usuario.AVATAR.indexOf(baseDir2);

                if (baseDirIndex2 !== -1) {
                    const relativePath2 = usuario.AVATAR.substring(baseDirIndex2 + baseDir2.length);

                    console.log("Pruebaaa: " + relativePath2);

                    usuario.AVATAR = path.join(baseDir2, relativePath2);
                    usuario.AVATAR = usuario.AVATAR.replace(/\\/g, '/');

                    console.log("Archivo subida: " + usuario.AVATAR);
                }
            
        }else{
            res.status(400).json({ mensaje: 'Error no has enviado un AVATAR' });

        }
        console.log("ruta reemplazada avatar: "+usuario.AVATAR);

        await usuario.save();

        res.status(200).send({
            ok: true,
            mensaje: "Avatar actualizado correctamente",
            resultado: usuario
        });
    } catch (error) {
        console.error('Error al cambiar el avatar:', error);
        res.status(500).json({ mensaje: 'Error al cambiar el avatar' });
    }
});

module.exports = router;