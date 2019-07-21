const express = require('express');
const mongodb = require('mongodb');
const router = express.Router();

router.get('/', async (req,res)=>{
    const posts = await ambilPosts();
    res.send(await posts.find({}).toArray());
});

router.post('/', async (req,res)=>{
    const posts = await ambilPosts();
    posts.insertOne({
        text: req.body.text,
        tgl_dibuat: new Date()
    });
    res.status(201).send();
});

router.delete('/:id', async (req,res)=>{
    const posts = await ambilPosts();
    posts.deleteOne({_id: new mongodb.ObjectID(req.params.id)});
    res.status(200).send();
});

async function ambilPosts(){
    const client = await mongodb.MongoClient.connect('mongodb://localhost:27017/vue_express', {useNewUrlParser:true});
    return client.db('vue_express').collection('posts');
}

module.exports = router;