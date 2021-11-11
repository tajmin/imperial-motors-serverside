const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

//Mongodb Connect
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7xlcz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db('imperial');
        const userCollection = database.collection('users');
        const orderCollection = database.collection('orders');
        const carCollection = database.collection('cars');
        console.log('db connected');

        //GET: Get Cars
        app.get('/cars', async (req, res) => {
            const cursor = carCollection.find({});
            const result = await cursor.toArray();
            res.send(result);
        });

        //Get: Car by Id
        app.get('/cars/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await carCollection.findOne(query);
            res.json(result);
        });

        // POST: Save User
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.json(result);
        })

        //Post: New Order
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.json(result);
        });

    } finally {

    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Ah, here We Go!')
})

app.listen(port, () => {
    console.log('Listening at: ', port)
})