const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
var jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
// This is your test secret API key.

const app = express();
// middlewares
app.use(cors());
app.use(express.json());

// Database Connection
const uri = process.env.DB_URI;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
/**=======================================
                verifyJWT
  =====================================*/

function verifyJWT(req, res, next) {
  console.log("varifay", req.headers.authorization);
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send("unauthorized access");
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    console.log("token =>", token);
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    /**=======================================
                     mongodb start 
      ======================================*/
    const categoryCollection = client.db("tenleemediaprotal").collection("jwt");
    const usersCollection = client.db("tenleemediaprotal").collection("users");

    /**=======================================
                       mongodb End 
      ======================================*/

    /**=======================================
               verifyAdmin
  =====================================*/
    const verifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);

      if (user?.role !== "admin") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    /**=======================================
               verifySeller
  =====================================*/
    const verifySeller = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);

      if (user?.accountType !== "seller") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };
    //-------------------------------------------------------------------------------------
    /**=======================================
                update a admin role
      =======================================*/

    /**=======================================
                Put JSON Web Tokens api 
      =======================================*/
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      console.log("JSON Web Tokens result ", result);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      // console.log("token ", token, user);
      res.send({ result, token });
    });
    /**=======================================
                Put JSON Web Tokens api 
      =======================================*/

    app.get("/test", verifyJWT, (req, res) => {
      res.json({
        message: "It woeks",
      });
    });
  } finally {
  }
}

run().catch((err) => console.error(err));

app.get("/", async (req, res) => {
  res.send("Tenleemedia server  is running ....");
});

app.listen(port, () => console.log(`tenleemedia server running on ${port}`));
