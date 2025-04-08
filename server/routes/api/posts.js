// server/routes/api/posts.js
const express = require('express');
const mongodb = require('mongodb');

const router = express.Router();

// GET route (unchanged)
router.get('/', async (req, res) => {
  try {
    const postsCollection = await loadPostsCollection();
    const results = await postsCollection.find({}).toArray();
    res.send(results);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).send('Error fetching posts');
  }
});

// Updated POST route
router.post('/', async (req, res) => {
  try {
    console.log("Received POST data:", req.body); // Debug: see what data was sent
    const posts = await loadPostsCollection();
    await posts.insertOne({
      title: req.body.title,
      description: req.body.description,
      deadline: req.body.deadline, // Optionally convert to Date: new Date(req.body.deadline)
      priority: req.body.priority,
      completed: req.body.completed,
      createdAt: new Date()
    });
    res.status(201).send();
  } catch (err) {
    console.error('Error adding task:', err);
    res.status(500).send('Error adding task on server.');
  }
});


// DELETE route (unchanged)
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
  return client.db('vue').collection('posts');
}


module.exports = router;
