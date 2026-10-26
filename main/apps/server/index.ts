import express, { Handler, Request } from "express";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { MongoClient, MongoServerError, ObjectId } from "mongodb";
import bodyParser from "body-parser";
import { Chart, chartInputSchema } from "schema";
import { generateChart, normalizeChartInput } from "./generate-chart";

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

// find-or-create: a chart is only computed the first time a birth moment and place is seen
app.post("/charts", async (req, res) => {
  const schema = chartInputSchema.safeParse(req.body);

  if (!schema.success) {
    return res.status(400).json({
      message: "There was an error, please check your data and try again",
      errors: schema.error.flatten(),
    });
  }

  const key = normalizeChartInput(schema.data);
  const charts = req.db.collection<Chart>("charts");
  // dotted paths match the unique index; an embedded-document match would be field-order sensitive
  const filter = {
    bornAt: key.bornAt,
    "location.lat": key.location.lat,
    "location.long": key.location.long,
  };

  try {
    const existing = await charts.findOne(filter);
    if (existing) {
      return res.status(200).json(existing);
    }

    const chart = generateChart(key);
    const { insertedId } = await charts.insertOne(chart);
    return res.status(201).json({ ...chart, _id: insertedId });
  } catch (e) {
    // a concurrent request inserted the same chart first; return that one
    if (e instanceof MongoServerError && e.code === 11000) {
      return res.status(200).json(await charts.findOne(filter));
    }

    console.error(e);
    return res
      .status(500)
      .json({ message: "There was an error creating the chart" });
  }
});

app.get("/charts/:id", async (req: Request<{ id: string }>, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid chart ID" });
  }

  try {
    const chart = await req.db
      .collection<Chart>("charts")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!chart) {
      return res
        .status(404)
        .json({ message: "The requested chart was not found" });
    }

    return res.status(200).json(chart);
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ message: "There was an error fetching the chart" });
  }
});

app.all("*", (_, res) => res.writeHead(404).end());

client
  .connect()
  // the db enforces one chart per birth moment and place; this is a no-op if the index exists
  .then(() =>
    db
      .collection("charts")
      .createIndex(
        { bornAt: 1, "location.lat": 1, "location.long": 1 },
        { unique: true },
      ),
  )
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on localhost:${PORT}`);
    });
  })
  .catch((e) => {
    console.error(`There was an error connecting: ${e}`);
    process.exit(1);
  });
