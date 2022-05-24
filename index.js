const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

//middleware
app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0xhsj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const productsCollection = client.db('manufacturer-website').collection('products');
        const orderCollection = client.db('manufacturer-website').collection('orders');
        const paymentCollection = client.db('manufacturer-website').collection('payments');
        const reviewCollection = client.db('manufacturer-website').collection('reviews');



        app.get('/products', async (req, res) => {
            const query = {};
            const cursor = productsCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });

        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productsCollection.findOne(query);
            res.send(product);
        });

        app.post('/order', async (req, res) => {
            const order = req.body;
            const query = { productId: order.productId, name: order.name };
            const status = query.status;
            const exists = await orderCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, order: exists })
            } else {
                const result = orderCollection.insertOne(order);
                res.send({ success: true, result });
            }

        });
        app.get('/order', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const orders = await orderCollection.find(query).toArray();
            res.send(orders);
        });

        app.get('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await orderCollection.findOne(query);
            res.send(order);
        });

        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(filter);
            res.send(result);
        });

        app.patch('/order/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: 'paid',
                    transactionId: payment.transactionId
                }
            }
            const result = await paymentCollection.insertOne(payment);
            const updatedOrder = await orderCollection.updateOne(filter, updatedDoc)
            res.send(updatedDoc);

        })



        app.post('/create-payment-intent', async (req, res) => {
            const order = req.body;
            const amount = order.amount * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']

            });
            res.send({ clientSecret: paymentIntent.client_secret });
        })

        //review
        app.post('/reviews', async (req, res) => {
            const userReviews = req.body;
            const query = { reviewId: userReviews._id };
            const exists = await reviewCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, userReviews: exists })
            } else {
                const result = reviewCollection.insertOne(userReviews);
                res.send({ success: true, result });
            }

        });
    }
    finally {

    }
}

run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('Nano Computers server')
})









app.listen(port, () => {
    console.log('Listening to port', port);
})