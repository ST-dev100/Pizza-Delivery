const pool = require('../db/db'); // Assuming you have a db.js for the PostgreSQL connection setup

// Function to create a pizza
exports.createPizza = async (req, res) => {
  try {
    let { name, price, toppings, pizzaPhoto } = req.body;

    // Ensure `topping` is an array with truthy values
    toppings = Object.keys(toppings).filter(key => toppings[key]);

    let createdBy = null;
    // Check if the logged-in user is a 'super-admin'
    const userResult = await pool.query(
      `SELECT email, uuid FROM public.users WHERE email = $1 AND rolename = 'super-admin'`,
      [req.user.email]
    );

    if (userResult.rows.length > 0) {
      // If user is 'super-admin', create the pizza with their user_id and email
      const result = await pool.query(
        `INSERT INTO pizza (pizza_name, topping, price, pizza_url, user_id, authored_by, createdby)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [name, toppings, price, pizzaPhoto, userResult.rows[0].uuid, req.user.email, userResult.rows[0].uuid]
      );
      return res.status(201).json(result.rows[0]);
    } else {
      // If not a 'super-admin', check if the user exists in the employees table
      const employeeResult = await pool.query(
        `SELECT createdBy FROM public.employees WHERE email = $1`,
        [req.user.email]
      );

      if (employeeResult.rows.length > 0) {
        createdBy = employeeResult.rows[0].createdBy;

        const result = await pool.query(
          `INSERT INTO pizza (pizza_name, topping, price, pizza_url, user_id, authored_by, createdby)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [name, toppings, price, pizzaPhoto, createdBy, req.user.email, createdBy]
        );
        return res.status(201).json(result.rows[0]);
      } else {
        return res.status(404).json({
          message: "Email not found in users or employees tables",
        });
      }
    }
  } catch (error) {
    console.error('Error creating pizza:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }    
};

// Function to get all pizzas
// Function to get all pizzas or search pizzas by name, restaurant name, or toppings
exports.getAllPizzas = async (req, res) => {
  try {
    const { pizza_name, restaurant_name} = req.query;

    // Base query to fetch pizzas with user details
    let query = `
      SELECT 
        pizza.*, 
        users.image_url, 
        users.restaurant_name 
      FROM 
        pizza                  
      JOIN 
        users  
      ON 
        pizza.createdby = users.uuid
    `;

    // Initialize an array for query parameters
    const queryParams = [];
    
    // Append conditions based on the presence of query parameters
    let conditions = [];

    if (pizza_name) {
      conditions.push(`pizza.pizza_name ILIKE $${queryParams.length + 1}`); // Pizza name search
      queryParams.push(`%${pizza_name}%`); // Add to query parameters
    }
    
    if (restaurant_name) {
      conditions.push(`users.restaurant_name ILIKE $${queryParams.length + 1}`); // Restaurant name search
      queryParams.push(`%${restaurant_name}%`); // Add to query parameters
    }
    
    

    // If there are any conditions, append them to the query
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await pool.query(query, queryParams); // Execute query with parameters
    return res.status(200).json(result.rows); // Return the result
  } catch (error) {
    console.error('Error retrieving pizzas:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};



// Function to get a pizza by ID
exports.getPizzaById = async (req, res) => {
  const { id } = req.params; // Get the pizza ID from the request parameters
  try {
    const result = await pool.query(`SELECT * FROM pizza WHERE uuid = $1`, [id]); // Use parameterized query for security
    if (result.rows.length > 0) {
      return res.status(200).json(result.rows[0]); // Return the pizza if found
    } else {
      return res.status(404).json({ 
        success: false,
        message: 'Pizza not found',
      });
    }
  } catch (error) {
    console.error('Error retrieving pizza:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};



