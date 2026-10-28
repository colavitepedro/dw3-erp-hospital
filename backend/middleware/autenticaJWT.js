const jwt = require("jsonwebtoken");

function AutenticaJWT(req, res, next) {
   const authorization = req.headers.authorization;
   if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({ auth: false, message: "Token não informado." });
   }
   try {
      req.usuario = jwt.verify(authorization.slice(7), process.env.JWT_SECRET);
      return next();
   } catch {
      return res.status(401).json({ auth: false, message: "Token inválido ou expirado." });
   }
}

module.exports = AutenticaJWT;
