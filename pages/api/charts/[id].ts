import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { getCharts } from "../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method not allowed" });
  }

  const id = req.query.id as string;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid chart ID" });
  }

  try {
    const chart = await (await getCharts()).findOne({ _id: new ObjectId(id) });

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
}
