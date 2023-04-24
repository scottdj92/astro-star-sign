import express, { Handler, Request } from "express";
import { MongoClient, ObjectId } from "mongodb";
import bodyParser from "body-parser";
import { personInfoSchema } from "./schema";
import { generateChart } from "./generate-chart";

const PORT = 3000;
const app = express();


// set up some authentication?

const mongoMiddleware: Handler = async (req, res, next) => {
    const client = new MongoClient("mongodb://localhost:27017/astro-star-sign");

    await client.connect();

    client.db().collection("charts").findOne({ _id: new ObjectId("6445f2456327069e944dccae") })

    // @ts-ignore
    req.db = client.db();

    next();
};

app.use(bodyParser.json());
app.use(mongoMiddleware);

app.post("/save", async (req, res) => {
    const schema = personInfoSchema.safeParse(req.body);

    if (!schema.success) {
        res.writeHead(500).end({ message: "There was an error, please check your data and try again" });
    }

    // @ts-ignore - fix types
    const document = await req.db.collection("charts").insertOne(req.body);

    res.writeHead(200).end(
        {
            message: "success",
            _id: document.insertedId,
            ...req.body
        }
    );
});

app.get("/chart/:id", async (req: Request<{ id: string }>, res) => {
    try {
        // @ts-ignore - fix types
        const doc = await req.db.collection("charts").findOne({ _id: new ObjectId(req.params.id) });
        if (!doc) {
            res.writeHead(404).end("The requested document was not found")
        } else {
            // @ts-ignore
            const chart = await generateChart(doc, req.db);
            res.writeHead(200).end(JSON.stringify(doc));
        }
    } catch (e) {
        console.log(e)
    }
});

app.get("*", (req, res) => res.writeHead(404).end());

app.listen(PORT, () => {
    console.log(`Server running on localhost:${PORT}`);
});
