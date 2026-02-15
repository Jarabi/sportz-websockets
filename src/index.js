import express from 'express';
import { eq } from 'drizzle-orm';
import { db, pool } from './db.js';
import { demoUsers } from './schema.js';

const app = express();
const PORT = 8000;

// Middleware
app.use(express.json());

// Root GET route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Sportz API!' });
});

// CRUD Routes for users
// CREATE: Add a new user
app.post('/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    const [newUser] = await db
      .insert(demoUsers)
      .values({ name, email })
      .returning();
    res.json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// READ: Get all users
app.get('/users', async (req, res) => {
  try {
    const users = await db.select().from(demoUsers);
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// READ: Get a specific user
app.get('/users/:id', async (req, res) => {
  try {
    const [user] = await db.select().from(demoUsers).where(eq(demoUsers.id, parseInt(req.params.id)));
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// UPDATE: Modify a user
app.put('/users/:id', async (req, res) => {
  try {
    const { name, email } = req.body;
    const [updatedUser] = await db
      .update(demoUsers)
      .set({ name, email })
      .where(eq(demoUsers.id, parseInt(req.params.id)))
      .returning();
    if (!updatedUser) return res.status(404).json({ error: 'User not found' });
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE: Remove a user
app.delete('/users/:id', async (req, res) => {
  try {
    const [deletedUser] = await db
      .delete(demoUsers)
      .where(eq(demoUsers.id, parseInt(req.params.id)))
      .returning();
    if (!deletedUser) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted', user: deletedUser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await pool.end();
    process.exit(0);
});
