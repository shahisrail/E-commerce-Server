const express = require("express");
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const port = process.env.PORT || 5000;
app.use(express.static("public"));
app.use(express.json());
const jwt = require("jsonwebtoken");

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
  },
});

async function run() {
  try {
    // make collectoin
    const UserCollectoin = client.db("E-commerce").collection("users");
    const productCollectoin = client.db("E-commerce").collection("product");

    // jwt api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(
        user,
        "d547bc644dfb8fa06eb6a24690665052c47aaaf0986f667542dc78208cedfe1334cabd2200107ad7923846a499535a4bdfcd6b1d1cb4dace3e17a22147f6b899",
        { expiresIn: "365h" }
      );
      res.send({ token });
    });

    //  middale wares
    const verifyToken = (req, res, next) => {
      // console.log('inside veryfied token ', req.headers.authorizatoin);
      // next()
      if (!req.headers.authorizatoin) {
        return res.status(401).send({ massage: "forbidden access" });
      }
      const token = req.headers.authorizatoin.split(" ")[1];
      jwt.verify(
        token,
        "d547bc644dfb8fa06eb6a24690665052c47aaaf0986f667542dc78208cedfe1334cabd2200107ad7923846a499535a4bdfcd6b1d1cb4dace3e17a22147f6b899",
        (err, decoded) => {
          console.log("verify", decoded);
          if (err) {
            return res.status(401).send({ massage: "forbiden accsess" });
          }
          req.decoded = decoded;
          next();
        }
      );
    };

    // user data post in database with email, name, role
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const exsitingUser = await UserCollectoin.findOne(query);
      if (exsitingUser) {
        return res.send({ massage: "user already exists", insertedId: null });
      }
      const result = await UserCollectoin.insertOne(user);
      res.send(result);
      console.log(user);
    });

    // check verify admin after verify token
    const verifyAdmin = async (req, res, next) => {
      console.log("request decoded", req.decoded);
      const email = req.decoded.email;
      const query = { email: email };
      const user = await UserCollectoin.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ massage: "forbiden accsess " });
      }
      next();
    };

    /* admin role check admin or normal user  */
    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "unauthorized access" });
      }
      const query = { email: email };
      const user = await UserCollectoin.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });
    /* saller role check admin or normal user  */
    app.get("/users/saller/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "unauthorized access" });
      }
      const query = { email: email };
      const user = await UserCollectoin.findOne(query);
      let saller = false;
      if (user) {
        saller = user?.role === "saller";
      }
      res.send({ saller });
    });

    // user  data get for admin show all user
    app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
      const result = await UserCollectoin.find().toArray();
      res.send(result);
    });

    // delete  user
    app.delete("/users/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await UserCollectoin.deleteOne(query);
      res.send(result);
    });

    //  make saller or user to admin
    app.patch(
      "/users/admin/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            role: "admin",
          },
        };
        const result = await UserCollectoin.updateOne(filter, updatedDoc);
        res.send(result);
      }
    );
    // make user to  saller
    app.patch(
      "/users/admin/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            role: "saller",
          },
        };
        const result = await UserCollectoin.updateOne(filter, updatedDoc);
        res.send(result);
      }
    );
    // make saller to User
    app.patch(
      "/users/admin/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            role: "user",
          },
        };
        const result = await UserCollectoin.updateOne(filter, updatedDoc);
        res.send(result);
      }
    );

    // saller data post in databse
    app.post("/products", async (req, res) => {
      const peoduct = req.body;
      const result = await productCollectoin.insertOne(peoduct);
      res.send(result);
    });
    //  get the data  in ui filter in publised data
    app.get("/products", async (req, res) => {
      const result = await productCollectoin
        .find({ status: "published" })
        .toArray();
      res.send(result);
    });

    // product details spaficik id
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productCollectoin.find(query).toArray();
      res.send(result);
    });

    // admin show all saller request data
    app.get("/adminSaller", verifyToken, verifyAdmin, async (req, res) => {
      const result = await productCollectoin.find().toArray();
      res.send(result);
    });
 
    // Publised a product 
    // unpublisede product with a message 

    //  myproduct show spesific saller his product 
    app.get("/myProduct", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await productCollectoin.find(query).toArray();
      res.send(result);
    });


    // spesific data update and rote data get 
    app.get("/myProduct/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productCollectoin.findOne(query);
      res.send(result);
    });
    // spesific data update 
    app.patch('/myProduct/:id', async (req, res) => {
      const item = req.body
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          category: item.category,
          titale: item.titale,
          Descriptoin: item.Descriptoin,
          Dedline: item.Dedline
        }
      }
      const result = await productCollectoin.updateOne(filter, updatedDoc)
      res.send(result)
    })


    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("E-comerce server is running");
});

app.listen(port, () => {
  console.log(`E-comerce server is on port ${port}`);
});
