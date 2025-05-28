const jwt = require('jsonwebtoken');
require('dotenv').config();

// middleware to validate token (rutas protegidas)
let validaToken = (token) => {
    try {
      // Verificar el token usando la clave secreta
      return jwt.verify(token, process.env.SECRET_KEY);

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        // Si el token ha expirado, puedes devolver un error específico
        return { error: 'Token ha expirado' };
      }
      // Otros posibles errores de token
      return { error: 'Token inválido' };
    }
  };



const protegerRuta = (rolesPermitidos) => {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];

    // Validar que el token exista y tenga el prefijo correcto
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, error: 'Token no proporcionado o malformado' });
    }

    const token = authHeader.split(' ')[1];
    const resultado = validaToken(token);

    // Validación del resultado del token
    if (!resultado || resultado.error) {
      return res.status(401).json({ ok: false, error: resultado.error || 'Token inválido' });
    }

    req.usuario = resultado; // Usuario decodificado

    // Validar rol SOLO si rolesPermitidos está definido y no está vacío
    if (
      rolesPermitidos &&
      ((Array.isArray(rolesPermitidos) && rolesPermitidos.length > 0) ||
       (typeof rolesPermitidos === 'string' && rolesPermitidos.trim() !== ''))
    ) {
      if (Array.isArray(rolesPermitidos)) {
        if (!rolesPermitidos.includes(resultado.role)) {
          return res.status(403).json({
            ok: false,
            error: `Usuario no autorizado, roles necesarios: ${rolesPermitidos.join(', ')}`
          });
        }
      } else {
        if (rolesPermitidos !== resultado.role) {
          return res.status(403).json({
            ok: false,
            error: `Usuario no autorizado, rol necesario: ${rolesPermitidos}`
          });
        }
      }
    }

    next(); // Continuar si todo está bien
  };
};

  
  


function obtenerUsuarioDesdeToken(token) {
    try {
        const decoded = jwt.verify(token, TOKEN_SECRET); // Verifica y decodifica el token

        //console.log(decoded); // Esto te mostrará todo el payload del token

        // Accede al campo correcto. Por ejemplo, si deseas obtener el login:
        return decoded.login; // O el campo que necesites, por ejemplo, decoded.role

    } catch (error) {
        console.error('Error al decodificar el token:', error);
        return null; // Devuelve null si hay un error al decodificar el token
    }
}



module.exports = { protegerRuta: protegerRuta, obtenerUsuarioDesdeToken: obtenerUsuarioDesdeToken};