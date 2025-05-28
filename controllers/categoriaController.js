const express = require('express');
const router = express.Router();
const Categoria = require('../models/categoriaModel'); // Ajusta la ruta si es necesario

// Crear nueva categoría
router.post('/', async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const nuevaCategoria = new Categoria({ nombre });
    const guardada = await nuevaCategoria.save();

    res.status(201).json({
      ok: true,
      categoria: guardada
    });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

// Obtener todas las categorías
router.get('/', async (req, res) => {
  try {
    const categorias = await Categoria.find();
    res.status(200).json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// Obtener una categoría por ID
router.get('/:id', async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);

    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    res.json(categoria);
  } catch (error) {
    console.error('Error al obtener la categoría:', error);
    res.status(500).json({ error: 'Error al obtener la categoría' });
  }
});

// Eliminar una categoría por ID
router.delete('/:id', async (req, res) => {
  try {
    const resultado = await Categoria.findByIdAndDelete(req.params.id);

    if (!resultado) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    res.json({ ok: true, mensaje: 'Categoría eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar la categoría:', error);
    res.status(500).json({ error: 'Error al eliminar la categoría' });
  }
});

// Actualizar una categoría
router.put('/:id', async (req, res) => {
    try {
      const { nombre } = req.body;
      const categoriaActualizada = await Categoria.findByIdAndUpdate(
        req.params.id,
        { nombre },
        { new: true } // para devolver la nueva versión
      );
  
      if (!categoriaActualizada) {
        return res.status(404).json({ ok: false, mensaje: 'Categoría no encontrada' });
      }
  
      res.json({ ok: true, categoria: categoriaActualizada });
    } catch (error) {
      console.error('Error al actualizar la categoría:', error);
      res.status(500).json({ ok: false, mensaje: 'Error al actualizar' });
    }
  });
  

module.exports = router;
