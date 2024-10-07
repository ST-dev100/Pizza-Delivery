// roleHandlers.js
const pool = require('../db/db'); // Assuming you have a db.js for the PostgreSQL connection setup
const { all } = require('../routes/pizzaRoutes');
 // PostgreSQL connection pool

// Create a new role
const createRole = async (req, res) => {
  const { name, permissions } = req.body;
  console.log(req.user)
  try {
    let createdBy = null;

    //     // First, check if the email exists in the users table with the role 'super-admin'
        const userResult = await pool.query(
            `SELECT email FROM public.users WHERE email = $1 AND rolename = 'super-admin'`,
            [req.user.email]
        );

        if (userResult.rows.length > 0) {
            // If email is found in users table with role 'super-admin', use it for createdBy
                const newRole = await pool.query(
            `INSERT INTO roles (rolename, permissions, authorname, createdby) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *`,
            [name, permissions, req.user.email, req.user.id]
          );

          return res.status(201).json(newRole.rows[0]);
        }
        else{
                const employeeResult = await pool.query(
                `SELECT createdby FROM public.employees WHERE email = $1`,
                [req.user.email]
            );

            if (employeeResult.rows.length > 0) {
                // If found in employees, get the createdBy value from the found employee
                createdBy = employeeResult.rows[0].createdby;
                const newRole = await pool.query(
                  `INSERT INTO roles (rolename, permissions, authorname, createdby) 
                   VALUES ($1, $2, $3, $4) 
                   RETURNING *`,
                  [name, permissions, req.user.email, createdBy]
                );
            
               return res.status(201).json(newRole.rows[0]);
            } else {
                // If the email is not found in either table, return an error
                return res.status(404).json({
                    message: "Email not found in users or employees tables",
                });
            }
        } 
  //   const newRole = await pool.query(
  //     `INSERT INTO roles (rolename, permissions, authorname, createdby, active) 
  //      VALUES ($1, $2, $3, $4, $5) 
  //      RETURNING *`,
  //     [name, permissions, authorname, createdby]
  //   );

  //   res.status(201).json(newRole.rows[0]);
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: "Failed to create role" });
    }
  };

// Get all roles 
const getAllRoles = async (req, res) => {
  try {
    // Step 1: Retrieve roles created by the user
    let allRoles = await pool.query(
      "SELECT * FROM roles WHERE createdby = $1",
      [req.user.id]
    );

    // Step 2: If no roles are found, search for the createdby field in the employees table
    if (allRoles.rows.length === 0) {
      const employeeResult = await pool.query(
        "SELECT createdby FROM employees WHERE uuid = $1",
        [req.user.id]
      );

      // Step 3: Check if the createdby field was found for this user
      if (employeeResult.rows.length > 0) {
        const createdBy = employeeResult.rows[0].createdby;

        // Step 4: Fetch roles using the retrieved createdby value
        allRoles = await pool.query(
          "SELECT * FROM roles WHERE createdby = $1",
          [createdBy]
        );

        // If still no roles are found, return an appropriate message
        if (allRoles.rows.length === 0) {
          return res.status(404).json({ message: 'No roles found for this user' });
        }
      } else {
        return res.status(200).json({ message: 'no users found' });
      }
    }

    // Step 5: Return the roles found
    res.status(200).json(allRoles.rows);
  } catch (error) {
    console.error("Error fetching roles:", error.message);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
};



// Get a role by UUID
const getRoleById = async (req, res) => {
  const { id } = req.params;

  try {
    // Initial query to find the role created by the user
    let role = await pool.query(
      "SELECT * FROM roles WHERE uuid = $1 AND createdby = $2", 
      [id, req.user.id]
    );

    // If no role is found, search for the user's creator in the employees table
    if (role.rows.length === 0) {
      const employeeResult = await pool.query(
        "SELECT createdby FROM employees WHERE uuid = $1", 
        [req.user.id]
      );

      // Check if there's a result from the employees table
      if (employeeResult.rows.length > 0) {
        const createdBy = employeeResult.rows[0].createdby;

        // Query again with the found createdby value
        role = await pool.query(
          "SELECT * FROM roles WHERE uuid = $1 AND createdby = $2",
          [id, createdBy]
        );

        // If still no role is found, return an error
        if (role.rows.length === 0) {
          return res.status(404).json({ error: "Role not found or not created by the user or their creator" });
        }
      } else {
        return res.status(404).json({ error: "User not found in employees table" });
      }
    }

    // If the role is found, return it
    res.json(role.rows[0]);
  } catch (error) {
    console.error("Error fetching role:", error.message);
    res.status(500).json({ error: "Failed to fetch role" });
  }
};


// Update a role by UUID
const updateRoleById = async (req, res) => {
  const { id } = req.params;
  const { name, permissions, active } = req.body;

  try {
    // Step 1: Attempt to update the role with createdby = req.user.id
    let updatedRole = await pool.query(
      `UPDATE roles 
       SET rolename = $1, permissions = $2, active = $3, updatedat = CURRENT_TIMESTAMP 
       WHERE uuid = $4 AND createdby = $5 
       RETURNING *`,
      [name, permissions, active, id, req.user.id]
    );

    // Step 2: If no role was updated, check the employees table for createdby field
    if (updatedRole.rows.length === 0) {
      const employeeResult = await pool.query(
        `SELECT createdby FROM employees WHERE uuid = $1`,
        [req.user.id]
      );

      // Step 3: If a createdby field is found, use it to attempt the update again
      if (employeeResult.rows.length > 0) {
        const createdBy = employeeResult.rows[0].createdby;

        updatedRole = await pool.query(
          `UPDATE roles 
           SET rolename = $1, permissions = $2, active = $3, updatedat = CURRENT_TIMESTAMP 
           WHERE uuid = $4 AND createdby = $5 
           RETURNING *`,
          [name, permissions, active, id, createdBy]
        );

        // Step 4: If still no role was updated, return a not found message
        if (updatedRole.rows.length === 0) {
          return res.status(404).json({ error: "Role not found or not created by the user or their creator" });
        }
      } else {
        // If no createdby field is found in the employees table, return a not found message
        return res.status(404).json({ error: "User not found in employees table" });
      }
    }

    // Step 5: Return the updated role if successful
    res.json(updatedRole.rows[0]);
  } catch (error) {
    console.error("Error updating role:", error.message);
    res.status(500).json({ error: "Failed to update role" });
  }
};


// Delete a role by UUID
const deleteRoleById = async (req, res) => {
  const { id } = req.params;

  try {
    // Step 1: Attempt to delete the role where the uuid matches and the role is created by the user
    let deletedRole = await pool.query(
      "DELETE FROM roles WHERE uuid = $1 AND createdby = $2 RETURNING *",
      [id, req.user.id]
    );

    // Step 2: If no role was deleted, check the employees table for the createdby field
    if (deletedRole.rows.length === 0) {
      const employeeResult = await pool.query(
        "SELECT createdby FROM employees WHERE uuid = $1",
        [req.user.id]
      );

      // Step 3: If a createdby field is found, use it to attempt the deletion again
      if (employeeResult.rows.length > 0) {
        const createdBy = employeeResult.rows[0].createdby;

        deletedRole = await pool.query(
          "DELETE FROM roles WHERE uuid = $1 AND createdby = $2 RETURNING *",
          [id, createdBy]
        );

        // Step 4: If still no role was deleted, return a not found message
        if (deletedRole.rows.length === 0) {
          return res.status(404).json({ error: "Role not found or not created by the user or their creator" });
        }
      } else {
        // If no createdby field is found in the employees table, return a not found message
        return res.status(404).json({ error: "User not found in employees table" });
      }
    }

    // Step 5: Return success message if the role was successfully deleted
    res.json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to delete role" });
  }
};

const updateRoleActiveStatus = async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;

  try {
      // First attempt to update using req.user.id as createdby
      let updatedRole = await pool.query(
          `UPDATE roles 
           SET active = $1, updatedat = CURRENT_TIMESTAMP 
           WHERE uuid = $2 AND createdby = $3 
           RETURNING *`,
          [active, id, req.user.id]
      );

      // If no role is found, look up createdby in the employees table
      if (updatedRole.rows.length === 0) {
          const employeeResult = await pool.query(
              "SELECT createdby FROM employees WHERE uuid = $1",
              [req.user.id]
          );

          // Check if there's a result from the employees table
          if (employeeResult.rows.length > 0) {
              const createdBy = employeeResult.rows[0].createdby;

              // Retry the update query with the found createdby value
              updatedRole = await pool.query(
                  `UPDATE roles 
                   SET active = $1, updatedat = CURRENT_TIMESTAMP 
                   WHERE uuid = $2 AND createdby = $3 
                   RETURNING *`,
                  [active, id, createdBy]
              );
          }

          // If still no role is found, return a 404 error
          if (updatedRole.rows.length === 0) {
              return res.status(404).json({ error: "Role not found or not created by the user or their creator" });
          }
      }

      // If the role is updated successfully, return it
      res.json(updatedRole.rows[0]);
  } catch (error) {
      console.error("Error updating role active status:", error.message);
      res.status(500).json({ error: "Failed to update active status" });
  }
};


 
module.exports = {
  createRole,
  updateRoleActiveStatus,
  getAllRoles,
  getRoleById,
  updateRoleById,
  deleteRoleById,
};
