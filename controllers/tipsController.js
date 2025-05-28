const express = require('express');
const router = express.Router();
const validate = require('./validate-token');
const Tips = require('../models/tipsModel.js');
const Usuario = require('../models/usuarioModel.js');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });  // Puedes configurar esto para que los archivos se guarden en la carpeta que prefieras


/* ENVIAR TODOS LOS TIPS */
router.get('/', (req, res) => {
    Tips.find()
        .populate('categoria', 'nombre') // Poblamos la categoría con el campo 'nombre'
        .then(x => {
            if (x.length > 0) {
                res.send({ ok: true, resultado: x });
            } else {
                res.status(500).send({ ok: false, error: "No se encontró ningún consejo" });
            }
        })
        .catch(err => {
            res.status(500).send({
                ok: false,
                error: err
            });
        });
});


/* ENVIAR ULTIMOS 12 LOS TIPS */
router.get('/ultTips', (req, res) => {
    Tips.find()
    .sort({ _id: -1 }) // Orden descendente: los más recientes primero
    .limit(12)
    .then(x => {
      if (x.length > 0) {
        res.send({ ok: true, resultado: x });
      } else {
        res.status(404).send({ ok: false, error: "No se encontraron tips" });
      }
    })
    .catch(err => {
      res.status(500).send({
        ok: false,
        error: err
      });
    });  
});

router.post('/', validate.protegerRuta(['admin', 'soid']), upload.single('contentVideo'), async (req, res) => {
    try {
        // Obtener los campos del body (formulario)
        const { description, titulo, points, categoria } = req.body;
        let contentVideo = '';

        // Si contentVideo es un archivo, será procesado por multer y estará disponible en req.file
        // Si contentVideo es una URL (string), estará en req.body
        if (req.file) {
            // Si contentVideo es un archivo, tomar la ruta del archivo guardado
            contentVideo = req.file.path;
        } else if (req.body.contentVideo) {
            // Si contentVideo es una URL, tomarla del body
            contentVideo = req.body.contentVideo;
        } else {
            return res.status(400).json({ mensaje: 'El campo contentVideo es obligatorio' });
        }

        console.log('Contenido del video:', contentVideo);
        console.log('Descripción:', description);
        console.log('Título:', titulo);

        // Acceder al usuario autenticado
        const usuario = await Usuario.findOne({ email: req.usuario.login });

        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        console.log('ID del usuario:', usuario._id);

        // Crear el nuevo "tip"
        const nuevoTip = new Tips({
            expecialist: usuario._id,
            contentVideo,
            description,
            titulo,
            points,
            categoria
        });

        await nuevoTip.save();
        res.status(201).json({ ok: true, tip: nuevoTip });

    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ mensaje: 'Error en el registro' });
    }
});

/* ELIMINAR UN TIP POR ID */
router.delete('/:id', async (req, res) => {
    try {
      const result = await Categoria.findByIdAndDelete(req.params.id);
      if (!result) {
        return res.status(404).json({ ok: false, mensaje: 'Categoría no encontrada' });
      }
      res.json({ ok: true, mensaje: 'Categoría eliminada correctamente' });
    } catch (error) {
      res.status(500).json({ ok: false, mensaje: 'Error al eliminar la categoría', error });
    }
  });

  // PUT /categoria/:id



module.exports = router;
