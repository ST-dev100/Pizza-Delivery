const jwt = require('jsonwebtoken');
        
const authenticateUser = () => (req, res, next) => {  
  const token = req.cookies.tokenPizza; // Get the token from cookies
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.user = user;  
    next();  
  });
};
 
module.exports = authenticateUser
