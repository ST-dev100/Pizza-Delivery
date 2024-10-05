const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },  // If you are using SSL in production         
});        
                           
// Check if the connection is successful                  
pool.connect((err, client, release) => {               
  if (err) {             
    return console.error('Error acquiring client', err.stack);
  }  
  client.query('SELECT NOW()', (err, result) => {   
    release(); 
    if (err) { 
      return console.error('Error executing query', err.stack);
    }
    console.log('Connection successful, server time:', result.rows[0].now); 
  });
}); 
 
module.exports = pool;   
 