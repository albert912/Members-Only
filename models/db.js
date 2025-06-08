require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

exports.getUserByEmail = async (email) => {
  const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows[0];
};

exports.getUserById = async (id) => {
  const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return res.rows[0];
};

exports.createUser = async ({ first_name, last_name, email, password, membershipStatus, admin }) => {
  const res = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password, member, admin) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [first_name, last_name, email, password, membershipStatus, admin]
  );
  return res.rows[0];
};

exports.setMemberStatus = async (userId) => {
  await pool.query('UPDATE users SET member = true WHERE id = $1', [userId]);
};

exports.setAdminStatus = async (userId) => {
  await pool.query('UPDATE users SET admin = true WHERE id = $1', [userId]);
};

// New method to get all users for admin panel
exports.getAllUsers = async () => {
  const res = await pool.query(`
    SELECT id, first_name, last_name, email, member, admin
    FROM users
    ORDER BY id ASC
  `);
  return res.rows;
};

exports.createMessage = async ({ user_id, title, content }) => {
  await pool.query(
    `INSERT INTO messages (user_id, title, content) VALUES ($1, $2, $3)`,
    [user_id, title, content]
  );
};

exports.getMessages = async () => {
  const res = await pool.query(`
    SELECT messages.*, users.first_name, users.last_name
    FROM messages
    JOIN users ON messages.user_id = users.id
    ORDER BY timestamp DESC
  `);
  return res.rows;
};

exports.deleteMessage = async (id) => {
  await pool.query('DELETE FROM messages WHERE id = $1', [id]);
};
