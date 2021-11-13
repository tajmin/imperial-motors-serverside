const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const admin = require("firebase-admin");
const ObjectId = require('mongodb').ObjectId;

const app = express();
const port = process.env.PORT || 5000;

//imperial-motors-firebase-adminsdk.json

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_TOKEN);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Middleware
app.use(cors());
app.use(express.json());

//Mongodb Connect
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7xlcz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyAuthToken(req, res, next) {

    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch { }
    }
    next();
}

async function run() {
    try {
        await client.connect();
        const database = client.db('imperial');
        const userCollection = database.collection('users');
        const orderCollection = database.collection('orders');
        const carCollection = database.collection('cars');
        const reviewCollection = database.collection('reviews');
        console.log('db connected');

        //GET: Get all Cars
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

        //GET: Get Orders by email
        app.get('/orders/:email', verifyAuthToken, async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const cursor = orderCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        //Get: admin role by email
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            const result = { admin: isAdmin }
            res.send(result);
        });

        // POST: Add a new car
        app.post('/cars', async (req, res) => {
            const car = req.body;
            const result = await carCollection.insertOne(car);
            res.json(result);
        })

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

        //Post: New Review
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.json(result);
        });

        //Put: Make user admin
        app.put('/users/admin', verifyAuthToken, async (req, res) => {
            const user = req.body;
            const requestingEmail = req.decodedEmail;
            if (requestingEmail) {
                const requestingUser = await userCollection.findOne({ email: requestingEmail });
                if (requestingUser.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await userCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            } else {
                res.status(403).json({ message: 'You do not have sufficient permission to perform this operation' })
            }

        });

        //Delete: Delete car by id
        app.delete('/cars/:id', verifyAuthToken, async (req, res) => {
            const id = req.params.id;
            const requestingEmail = req.decodedEmail;
            if (requestingEmail) {
                const requestingUser = await userCollection.findOne({ email: requestingEmail });
                if (requestingUser.role === 'admin') {
                    const query = { _id: ObjectId(id) };
                    const result = await carCollection.deleteOne(query);
                    res.json(result);
                }
            } else {
                res.status(403).json({ message: 'You do not have sufficient permission to perform this operation' })
            }

        });

        //DELETE: Cancel Order by id
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
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