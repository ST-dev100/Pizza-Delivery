const db = require("./db/db")
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const pizzaRoutes = require('./routes/pizzaRoutes');
const roleRoutes = require("./routes/roleRoutes"); 
require('dotenv').config();             

const userRoutes = require('./routes/userRoutes'); // Import user routes

const orderRoutes = require('./routes/orders'); // Import order routes

const employeeRoutes = require('./routes/employeeRoutes');// Import Employee routes

const app = express();
 
// Middleware 
app.use(cookieParser());  
// CORS configuration  
const corsOptions = {     
  origin: ['http://localhost:3000','https://pizza-order-kappa.vercel.app'], // Replace with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'], // Specify allowed methods
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
};
  
// Use the CORS middleware
app.use(cors(corsOptions));  
app.use(bodyParser.json()); // For parsing application/json

//test route
app.get('',(req,res)=>{
    res.json({name:"simon"})
})
// User routes
app.use('/api/users', userRoutes);
// Register the pizza routes
app.use('/api/pizzas', pizzaRoutes);                           
//order
app.use('/api/orders', orderRoutes);  
        
app.use('/api/employees', employeeRoutes);

app.use('/api',roleRoutes);
// Start the server   
const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);  
}); 
