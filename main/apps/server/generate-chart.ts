// add the logic for determining charts based on user input
import { Db, Document, WithId } from "mongodb";
import dayjs from "dayjs";
import inRange from "lodash.inrange";
import duration from "dayjs/plugin/duration";
import { PersonInfo, Chart, Sign } from "./schema";

dayjs.extend(duration);

export enum CelestialBody {
  Earth,
  Sun,
  Moon,
}

export const generateChart = async (
  doc: WithId<Chart>,
  db: Db,
): Promise<Chart> => {
  // check to see if we've generated the chart already. if so, return the document. If not, continue
  // const chart = db.collection<Chart>("charts").findOne({ $and: [{ _id: doc._id }, { sun: { $exists: true } }] })

  // if (chart) {
  //     return chart;
  // }

  const { dob } = doc;
  const sun = calculateSun(dob);
  const moon = calculateMoon(dob);
  // given the time of birth, calculate what constellation was being blocked by the given celestial body

  // update the mongo document
  return {
    dob: doc.dob,
    sun,
    moon: Sign.Libra,
    rising: Sign.Sagittarius,
  };
};

/**
 * calculate the central angle given that we know the arc length (days in a year) and the circumference (1 year)
 *
 * @param {string} dateTime
 * @returns {Sign}
 */
export const calculateSun = (dateTime: string): Sign => {
  // assume the sun is in the direct center (0,0) on the cartesian plane
  const daysInYear = dayjs
    .duration(dayjs.utc(dateTime).unix(), "days")
    .asDays();
  const yearRadius = dayjs.duration({ years: 1 }).asDays() / Math.PI / 2;
  const angleInDegrees = (daysInYear / yearRadius) * (180 / Math.PI);

  return calculateSignFromAngle(angleInDegrees);
};

const calculateMoon = (dateTime: string): number => {
  // the moon is at an angle of the sun, based on the existing sun calculation,
  // we can add the angle of the sun to calculate the moon sign

  // FIXME: stub data
  return 0;
};

export const calculateSignFromAngle = (angleInDegrees: number): Sign => {
  // normalize data to check wraparound
  const normalized = ((angleInDegrees % 360) + 360) % 360;
  return Math.floor(normalized / 30) as Sign;
};
