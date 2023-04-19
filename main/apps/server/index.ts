import express from "express";
import { MongoClient } from "mongodb";

const PORT = 3000;
const app = express();

//connect to database
// set up saving astrology signs per customer
// set up some authentication?

// start server
app.get("/", (req, res) => {
    res.statusCode = 200;
    res.send("Hello world");
});

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});
