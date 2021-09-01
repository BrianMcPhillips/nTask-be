const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const morgan = require('morgan');
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev')); // http logging

const authRoutes = createAuthRoutes();

app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this proctected route, we get the user's id like so: ${req.userId}`
  });
});

app.get('/api/tasks', async(req, res) => {
  try {
    const data = await client.query(`SELECT * from tasks WHERE tasks.owner_id=${req.userId}`);
    
    res.json(data.rows);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/tasks', async(req, res) => {
  try {
    const newTask = {
      todo: req.body.todo,
      completed: req.body.completed
    };
    const data = await client.query(`
      INSERT INTO tasks(todo, completed, owner_id)
      VALUES($1, $2, $3)
      RETURNING *`, [newTask.todo, newTask.completed, req.userId]);
    
    res.json(data.rows[0]);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/tasks/:id', async(req, res) => {
  try {
    const taskId = req.params.id;
    const updatedTask = {
      todo: req.body.todo,
      completed: req.body.completed
    };
    const data = await client.query(`
      UPDATE tasks
      SET todo=$1, completed=$2
      WHERE tasks.id=$3 AND tasks.owner_id=$4
      RETURNING *`, [updatedTask.todo, updatedTask.completed, taskId, req.userId]);
    
    res.json(data.rows[0]);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.use(require('./middleware/error'));

module.exports = app;
