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
    Moon
}

export const generateChart = async (doc: WithId<Chart>, db: Db): Promise<Chart> => {
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
        rising: Sign.Sagittarius
    };
};

/**
 * calculate the central angle given that we know the arc length (days in a year) and the circumference (1 year)
 *
 * @param {string} dateTime
 * @returns {Sign}
 */
const calculateSun = (dateTime: string): Sign => {
    // assume the sun is in the direct center (0,0) on the cartesian plane
    const daysInYear = dayjs.duration(dayjs.utc(dateTime).unix(), "days").asDays();
    const yearRadius = (dayjs.duration({ years: 1 }).asDays() / Math.PI) / 2;
    const angleInDegrees = (daysInYear / yearRadius) * (180 / Math.PI);

    return calculateSignFromAngle(angleInDegrees);
};

const calculateMoon = (dateTime: string): number => {
    // the moon is at an angle of the sun, based on the existing sun calculation,
    // we can add the angle of the sun to calculate the moon sign

    // FIXME: stub data
    return 0;
}

const calculateSignFromAngle = (angleInDegrees: number): Sign => {
    if (inRange(angleInDegrees, 0, 31)) {
        return Sign.Aries;
    } else if (inRange(angleInDegrees, 30, 61)) {
        return Sign.Taurus;
    } else if (inRange(angleInDegrees, 60, 91)) {
        return Sign.Gemini;
    } else if (inRange(angleInDegrees, 90, 121)) {
        return Sign.Cancer;
    } else if (inRange(angleInDegrees, 120, 151)) {
        return Sign.Leo;
    } else if (inRange(angleInDegrees, 150, 181)) {
        return Sign.Virgo;
    } else if (inRange(angleInDegrees, 180, 211)) {
        return Sign.Libra;
    } else if (inRange(angleInDegrees, 210, 241)) {
        return Sign.Scorpio;
    } else if (inRange(angleInDegrees, 240, 271)) {
        return Sign.Sagittarius;
    } else if (inRange(angleInDegrees, 270, 301)) {
        return Sign.Capricorn;
    } else if (inRange(angleInDegrees, 300, 331)) {
        return Sign.Aquarius;
    } else {
        return Sign.Pisces;
    }
}
