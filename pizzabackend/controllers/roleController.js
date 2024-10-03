// roleHandlers.js
const pool = require('../db/db'); // Assuming you have a db.js for the PostgreSQL connection setup
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
            `INSERT INTO roles (rolename, permissions, authorname, createdBy) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *`,
            [name, permissions, req.user.email, req.user.id]
          );

          return res.status(201).json(newRole.rows[0]);
        }
        else{
                const employeeResult = await pool.query(
                `SELECT createdBy FROM public.employees WHERE email = $1`,
                [req.user.email]
            );

            if (employeeResult.rows.length > 0) {
                // If found in employees, get the createdBy value from the found employee
                createdBy = employeeResult.rows[0].createdBy;
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
    const allRoles = await pool.query("SELECT * FROM roles");
    res.json(allRoles.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
};

// Get a role by UUID
const getRoleById = async (req, res) => {
  const { id } = req.params;

  try {
    const role = await pool.query("SELECT * FROM roles WHERE uuid = $1", [id]);

    if (role.rows.length === 0) {
      return res.status(404).json({ error: "Role not found" });
    }

    res.json(role.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch role" });
  }
};

// Update a role by UUID
const updateRoleById = async (req, res) => {
  const { id } = req.params;
  const { name, permissions, authorname, active } = req.body;

  try {
    const updatedRole = await pool.query(
      `UPDATE roles 
       SET rolename = $1, permissions = $2, authorname = $3, active = $4, updatedat = CURRENT_TIMESTAMP 
       WHERE uuid = $5 
       RETURNING *`,
      [name, permissions, authorname, active, id]
    );

    if (updatedRole.rows.length === 0) {
      return res.status(404).json({ error: "Role not found" });
    }

    res.json(updatedRole.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to update role" });
  }
};

// Delete a role by UUID
const deleteRoleById = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedRole = await pool.query(
      "DELETE FROM roles WHERE uuid = $1 RETURNING *",
      [id]
    );

    if (deletedRole.rows.length === 0) {
      return res.status(404).json({ error: "Role not found" });
    }

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
      const updatedRole = await pool.query(
        `UPDATE roles 
         SET active = $1, updatedat = CURRENT_TIMESTAMP 
         WHERE uuid = $2 
         RETURNING *`,
        [active, id]
      );
  
      if (updatedRole.rows.length === 0) {
        return res.status(404).json({ error: "Role not found" });
      }
  
      res.json(updatedRole.rows[0]);
    } catch (error) {
      console.error(error.message);
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
