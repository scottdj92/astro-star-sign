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

// a single client is shared across requests; MongoClient pools connections internally
const client = new MongoClient("mongodb://localhost:27017/astro-star-sign");
const db = client.db();

const mongoMiddleware: Handler = (req, _, next) => {
  req.db = db;
  next();
};

app.use(bodyParser.json());
app.use(mongoMiddleware);

app.post("/save", async (req, res) => {
  const schema = personInfoSchema.safeParse(req.body);

  if (!schema.success) {
    return res.status(400).json({
      message: "There was an error, please check your data and try again",
      errors: schema.error.flatten(),
    });
  }

  const document = await req.db.collection("charts").insertOne(schema.data);

  res.status(200).json({
    message: "success",
    _id: document.insertedId,
    ...schema.data,
  });
});

app.get("/chart/:id", async (req: Request<{ id: string }>, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid chart ID" });
  }

  try {
    const doc = await req.db
      .collection<Chart>("charts")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!doc) {
      res.status(404).end("The requested document was not found");
    } else {
      const chart = await generateChart(doc, req.db);
      res.status(200).json(chart);
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Invalid chart ID" });
  }
});

app.get("*", (_, res) => res.writeHead(404).end());

client
  .connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on localhost:${PORT}`);
    });
  })
  .catch((e) => {
    console.error(`There was an error connecting: ${e.message}`);
    process.exit(1);
  });
