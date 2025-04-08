const express = require('express');
const mongodb = require('mongodb');

const router = express.Router();

// GET: Retrieve all tasks
router.get('/', async (req, res) => {
  try {
    const postsCollection = await loadPostsCollection();
    const results = await postsCollection.find({}).toArray();
    res.send(results);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).send('Error fetching tasks');
  }
});

// POST: Add a new task
router.post('/', async (req, res) => {
  try {
    console.log("Received POST data:", req.body);
    const posts = await loadPostsCollection();
    const newTask = {
      title: req.body.title,
      description: req.body.description,
      // Convert deadline to Date if provided; otherwise, set to null
      deadline: req.body.deadline ? new Date(req.body.deadline) : null,
      priority: req.body.priority,
      completed: req.body.completed,
      createdAt: new Date()
    };
    await posts.insertOne(newTask);
    res.status(201).send(newTask);
  } catch (err) {
    console.error('Error adding task:', err);
    res.status(500).send('Error adding task on server.');
  }
});

// DELETE: Remove a task by its MongoDB _id
router.delete('/:id', async (req, res) => {
  try {
    const posts = await loadPostsCollection();
    await posts.deleteOne({ _id: new mongodb.ObjectId(req.params.id) });
    res.status(200).send();
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).send('Error deleting task on server.');
  }
});

async function loadPostsCollection() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable not set');
  }
  const client = await mongodb.MongoClient.connect(uri);
  // In this example the database name is "vue"
  return client.db('vue').collection('posts');
}

module.exports = router;
