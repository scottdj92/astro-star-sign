import type { NextApiRequest, NextApiResponse } from "next";
import { MongoServerError } from "mongodb";
import { getCharts } from "../../../lib/db";
import { generateChart, normalizeChartInput } from "../../../lib/generate-chart";
import { chartInputSchema } from "../../../lib/schema";

// find-or-create: a chart is only computed the first time a birth moment and place is seen
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  const schema = chartInputSchema.safeParse(req.body);

  if (!schema.success) {
    return res.status(400).json({
      message: "There was an error, please check your data and try again",
      errors: schema.error.flatten(),
    });
  }

  const key = normalizeChartInput(schema.data);
  // dotted paths match the unique index; an embedded-document match would be field-order sensitive
  const filter = {
    bornAt: key.bornAt,
    "location.lat": key.location.lat,
    "location.long": key.location.long,
  };

  try {
    const charts = await getCharts();

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
      throw e;
    }
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ message: "There was an error creating the chart" });
  }
}
