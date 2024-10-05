const pool = require('../db/db'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 
const { use } = require('../routes/pizzaRoutes');
// Function to sign up a Super Admin
const signupSuperAdmin = async (req, res) => {
  const { name, email, password, phone_number, restaurant_name, location, image_url } = req.body;
  //  console.log({name,email,password,phone_number,restaurant_name,location,image_url})
  try { 
    // Validate the required fields
    if (!name || !email || !password || !restaurant_name) {
      return res.status(400).json({ error: "Please provide all required fields." });
    }
    
    // Check if email already exists
    const emailExistsQuery = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(emailExistsQuery, [email]);

    if (result.rows.length > 0) {
      return res.status(400).json({ error: "Email is already registered." });
    }

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new super admin user in the database
    const insertUserQuery = `
      INSERT INTO users (name, email, password, phone_number, restaurant_name, location, image_url, roleName, grantedRole, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'super-admin', '{super-admin}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `; 

    const newUser = await pool.query(insertUserQuery, [
      name,   
      email,
      hashedPassword, 
      phone_number, 
      restaurant_name,
      location,
      image_url,
    ]);

    // Send back the created user (excluding the password)
    res.status(201).json({
      message: "Super Admin created successfully.",
      user: {
        id: newUser.rows[0].uuid,
        name: newUser.rows[0].name,
        email: newUser.rows[0].email,
        phone_number: newUser.rows[0].phone_number,
        restaurant_name: newUser.rows[0].restaurant_name,
        roleName: newUser.rows[0].roleName,
        grantedRole: newUser.rows[0].grantedRole,
        created_at: newUser.rows[0].created_at,
      }, 
    });
  } catch (error) {
    console.error("Error creating super admin user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }   
};
// Signup function
const signupUser = async (req, res) => {
  const { email, password, phone_number, location, roleName, grantedRole } = req.body;

  try {
    // Check if the email already exists
    const userExistsQuery = 'SELECT * FROM users WHERE email = $1';
    const userExistsResult = await pool.query(userExistsQuery, [email]);

    if (userExistsResult.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into the database
    const insertUserQuery = `
      INSERT INTO users (email, password, phone_number, location, roleName, grantedRole)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING uuid, email, roleName, grantedRole
    `;

    const newUserResult = await pool.query(insertUserQuery, [
      email,
      hashedPassword,
      phone_number,
      location,
      roleName,
      grantedRole
    ]);

    const newUser = newUserResult.rows[0];

    // Respond with the new user details (excluding password)
    res.status(201).json({
      message: 'User created successfully',
      user: newUser,
    });     
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
// Signup function
const signupNormalUser = async (req, res) => {
    const { email, password, phone_number, location, roleName, grantedRole } = req.body;
  
    try {
      // Check if the email already exists
      const userExistsQuery = 'SELECT * FROM users WHERE email = $1';
      const userExistsResult = await pool.query(userExistsQuery, [email]);
  
      if (userExistsResult.rows.length > 0) {
        return res.status(400).json({ message: 'Email already exists' });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Insert new user into the database
      const insertUserQuery = `
        INSERT INTO users (email, password, phone_number, location, roleName, grantedRole)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, roleName, grantedRole
      `;
  
      const newUserResult = await pool.query(insertUserQuery, [
        email,
        hashedPassword,
        phone_number,
        location,
        roleName,
        grantedRole
      ]);   
  
      const newUser = newUserResult.rows[0];
  
      // Respond with the new user details (excluding password)
      res.status(201).json({
        message: 'User created successfully',
        user: newUser,
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
   
// Login function
const loginUser = async (req, res) => {
    const { email, password } = req.body; 
  
    try {
      // Check if user exists
      const userQuery = 'SELECT * FROM users WHERE email = $1';
      const userResult = await pool.query(userQuery, [email]);
  
      if (userResult.rows.length === 0) {
        const userQuery = `
        SELECT e.*, r.rolename, r.permissions
        FROM employees e
        LEFT JOIN roles r ON e.role_id = r.uuid
        WHERE e.email = $1
      `;
      
      const userResult = await pool.query(userQuery, [email]);
      console.log(userResult.rows[0]);
      
      if (userResult.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
      
      const user = userResult.rows[0];
      
      // Check if the password is correct
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
      if(!user.active){
        return res.status(400).json({ message: 'The user isnot activated' });
      }
      const payload = {
        id: user.uuid,
        email: user.email,
        roleName: user.rolename,
        grantedRole: user.grantedrole
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
      
      // If login is successful, send user details along with role
      return res.status(200).json({
        message: 'Login successful',
        user: {
          id: user.uuid,
          name: user.name,
          email: user.email,
          phone_number: user.phone_number,
          active: user.active,
          rolename: user.rolename,
          grantedRole: user.grantedrole,
          permissions: user.permissions, // Role-related data from the roles table
        },
      });
      
      }
  
      const user = userResult.rows[0];
  
      // Check if the password is correct
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
  
      // Create JWT payload
      const payload = {
        id: user.uuid,
        email: user.email,
        roleName: user.rolename,
        active:user.active,
        createdby:user.createdby,
        grantedRole: user.grantedrole,
        permissions:user.permissions,
        role_id:use. role_id
      };
  
      // Generate JWT
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
  
      // Set JWT in an HTTP-only cookie
      res.cookie('tokenPizza', token, {
        httpOnly: true,  // Prevents client-side access to the cookie
        secure: process.env.NODE_ENV === 'production',  // Use secure cookies in production
        maxAge: 24 * 60 * 60 * 1000  // 1 day in milliseconds
      });
  
      // Send response
      return res.status(200).json({
        message: 'Login successful',
        user: {
          id: user.uuid,
          email: user.email,
          roleName: user.rolename,
          grantedRole: user.grantedrole
        }
      });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  // Get all users
const getUsers = async (req, res) => {
    try {
      const usersResult = await pool.query('SELECT uuid, email, phone_number,roleName, grantedRole,active FROM users');
      res.status(200).json(usersResult.rows);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
// Get a single user by ID
const getUserById = async (req, res) => {
    const { id } = req.params;
  
    try {
      const userResult = await pool.query('SELECT id, email, roleName, grantedRole FROM users WHERE id = $1', [id]);
  
      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json(userResult.rows[0]);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  // Update a user
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { email, phone_number, location, roleName, grantedRole } = req.body;
  
    try {
      const updateUserQuery = `
        UPDATE users
        SET email = $1, phone_number = $2, location = $3, roleName = $4, grantedRole = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6 RETURNING id, email, roleName, grantedRole
      `;
      const updatedUserResult = await pool.query(updateUserQuery, [
        email,
        phone_number,
        location,
        roleName,
        grantedRole,
        id
      ]);
  
      if (updatedUserResult.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json({
        message: 'User updated successfully',
        user: updatedUserResult.rows[0]
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  // Delete a user
const deleteUser = async (req, res) => {
    const { id } = req.params;   
  
    try {
      const deleteUserQuery = 'DELETE FROM users WHERE id = $1 RETURNING id';
      const deleteUserResult = await pool.query(deleteUserQuery, [id]);
  
      if (deleteUserResult.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  const logoutUser = (req, res) => {
    try {
      // Clear the JWT token cookie
      res.clearCookie('tokenPizza', {
        httpOnly: true,  // Ensure the cookie cannot be accessed via client-side JavaScript
        secure: process.env.NODE_ENV === 'production',  // Use secure cookies in production
        sameSite: 'strict'  // Protect against CSRF attacks
      });
      
      // Send response to confirm logout
      return res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Error logging out:', error);
      return res.status(500).json({ message: 'Server error during logout' });
    }
  };
  module.exports = {
    signupSuperAdmin,
    signupUser,
    signupNormalUser,
    loginUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    logoutUser
  };
