const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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
        })

        app.post('/order', async (req, res) => {
            const order = req.body;
            const query = { _id: order._id, status: order.status, name: order.name };
            const status = query.status;
            // re-order issue
            const exists = await orderCollection.findOne(query);
            if (exists && status === 'unpaid') {
                return res.send({ success: false, order: exists })
            } else {
                const result = orderCollection.insertOne(order);
                res.send({ success: true, result });
            }

        })


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