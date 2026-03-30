import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.warn("[Auth Middleware] No token provided in header");
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error("[Auth Middleware] JWT Verification Error:", err.message);
      return res.status(403).json({ error: "Forbidden: Invalid or expired token" });
    }
    // user contains { userId, email, role, iat, exp }
    req.user = user;
    next();
  });
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: "Unauthorized: User not authenticated or role missing" });
    }
    
    const userRole = (req.user.role || "").toUpperCase();
    
    if (!roles.map(r => r.toUpperCase()).includes(userRole)) {
      console.warn(`[Auth Middleware] Access denied. Required: ${roles.join(", ")}, Found: ${userRole}`);
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }
    
    next();
  };
};
