const express = require("express");
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion,  } = require("mongodb");
const cors = require("cors");
const port = process.env.PORT || 5000;
app.use(express.static("public"));
app.use(express.json());

// midale ware 
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_pass}@cluster0.bkdyuro.mongodb.net/?retryWrites=true&w=majority`;
console.log(process.env.DB_user);
console.log(process.env.DB_pass);
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    const UserCollectoin = client.db('E-commerce').collection('users');
   // user data post in database with email, name, role
    app.post('/users', async (req, res) => {
        const user = req.body
        const query = { email: user.email }
        const exsitingUser = await UserCollectoin.findOne(query)
        if (exsitingUser) {
          return res.send({ massage: 'user already exists', insertedId: null })
        }
        const result = await UserCollectoin.insertOne(user)
        res.send(result)
        console.log(user);
      })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('boss is sitting')
})

app.listen(port, () => {
  console.log(`bistro boss is sitting on port ${port}`);
})