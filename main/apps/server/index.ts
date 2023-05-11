import express, { Handler, Request } from "express";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { MongoClient, ObjectId } from "mongodb";
import bodyParser from "body-parser";
import { Chart, personInfoSchema } from "./schema";
import { generateChart } from "./generate-chart";

dayjs.extend(utc);

const PORT = 3000;
const app = express();


// set up some authentication?

const mongoMiddleware: Handler = async (req, _, next) => {
    const client = new MongoClient("mongodb://localhost:27017/astro-star-sign");
    await client.connect();
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
        const doc = await req.db.collection<Chart>("charts").findOne({ _id: new ObjectId(req.params.id) });
        if (!doc) {
            res.writeHead(404).end("The requested document was not found")
        } else {
            const chart = await generateChart(doc, req.db);
            res.writeHead(200).end(JSON.stringify(chart));
        }
    } catch (e) {
        console.log(e)
    }
});

app.get("*", (_, res) => res.writeHead(404).end());

app.listen(PORT, () => {
    console.log(`Server running on localhost:${PORT}`);
});
