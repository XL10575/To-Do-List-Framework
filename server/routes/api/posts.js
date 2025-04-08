const express = require('express');
const mongodb = require('mongodb');

const router = express.Router();

//get post
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
  
//add post
router.post('/',async (req, res) => {
  const posts = await loadPostsCollection();
  await posts.insertOne({
    text: req.body.text,
    createdAt: new Date()
  });
  res.status(201).send;
})
//delete post
router.delete('/:id', async (req, res) => {
  const posts = await loadPostsCollection();
  await posts.deleteOne({ _id: new mongodb.ObjectId(req.params.id) });
  res.status(200).send();
})
async function loadPostsCollection() {
  const client = await mongodb.MongoClient.connect
  ('mongodb+srv://XL10575:Eco7JFtCi3Ghb8bb@cluster0.cexujgy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',);

  return client.db('vue').collection('posts');
}

module.exports = router;