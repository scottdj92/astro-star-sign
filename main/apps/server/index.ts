import express, { Handler } from "express";
import { MongoClient } from "mongodb";

const PORT = 3000;
const app = express();


// set up some authentication?

const mongoMiddleware: Handler = async (req, res, next) => {
    const client = new MongoClient("mongodb://localhost:27017/local");

    await client.connect();

    // @ts-ignore
    req.db = client.db();

    next();
};

app.use(mongoMiddleware);

// start server
app.get("/", async (req, res) => {
    res.statusCode = 200;
    // @ts-ignore - need to fix types
    const data = await req.db.collection("local").find().toArray();
    res.send(JSON.stringify(data));
});

app.post("/save", async (req, res) => {
    // validate input

    // throw error if input does not pass validation

    // otherwise, save to db
});

app.get("/:id", async (req, res) => {
    // authenticate user? - doesn't seem necessary

    // fetch from database by id - should come in from the client route

    // const doc = await req.db.findOne({ _id: req.id })
});

app.listen(PORT, () => {
    console.log(`Server running on localhost:${PORT}`);
});
