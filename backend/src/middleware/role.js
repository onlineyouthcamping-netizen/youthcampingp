const authorize = (...roles) => {
  return (req, res, next) => {
    const user = req.admin || req.user;
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // Super admins and admins have access to everything
    if (user.role === 'admin' || user.role === 'superadmin') {
      return next();
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role ${user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};

module.exports = authorize;
