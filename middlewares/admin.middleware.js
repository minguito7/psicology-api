// middlewares/admin.middleware.js
module.exports = (req, res, next) => {
    const userRole = req.user.rol; // El rol del usuario autenticado se guarda en `req.user` desde el middleware de autenticación
  
    if (userRole !== 'admin' && userRole !== 'soid') {
      return res.status(403).json({ error: 'No tienes permisos para acceder a esta acción' });
    }
  
    next(); // Si el rol es adecuado, pasamos al siguiente middleware o ruta
  };
  