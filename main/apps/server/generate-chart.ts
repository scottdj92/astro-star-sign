// add the logic for determining charts based on user input
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { Chart, ChartInput, ChartKey, Sign } from "./schema";

dayjs.extend(utc);

// J2000.0 epoch, the reference point for the solar position formula
const J2000 = dayjs.utc("2000-01-01T12:00:00Z");

// string enum values keep their declaration order, so each 30° segment maps to an index
const ZODIAC = Object.values(Sign);

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

// days since J2000; negative for dates before 2000
const daysSinceJ2000 = (dateTime: Date | string): number =>
  dayjs.utc(dateTime).diff(J2000, "day", true);

export enum CelestialBody {
  Earth,
  Sun,
  Moon,
}

/**
 * normalize the input so the same birth moment and place always produce the same key:
 * the time is converted to UTC and truncated to the minute, and coordinates are
 * rounded to 4 decimal places (~11m)
 *
 * @param {ChartInput} input
 * @returns {ChartKey}
 */
export const normalizeChartInput = (input: ChartInput): ChartKey => ({
  bornAt: dayjs.utc(input.bornAt).startOf("minute").toDate(),
  location: {
    lat: Number(input.location.lat.toFixed(4)),
    long: Number(input.location.long.toFixed(4)),
  },
});

export const generateChart = (key: ChartKey): Chart => {
  const sun = calculateSun(key.bornAt);
  const moon = calculateMoon(key.bornAt);
  const rising = calculateRising(key.bornAt, key.location);

  return {
    ...key,
    sun,
    moon,
    rising,
  };
};

/**
 * calculate the sun's apparent ecliptic longitude as seen from earth, using the
 * USNO low-precision formula (accurate to ~0.01° within a couple of centuries of 2000)
 *
 * @param {Date | string} dateTime
 * @returns {Sign}
 */
export const calculateSun = (dateTime: Date | string): Sign =>
  calculateSignFromAngle(calculateSunLongitude(dateTime));

/**
 * @param {Date | string} dateTime
 * @returns {number} the sun's ecliptic longitude, in degrees (not wrapped)
 */
export const calculateSunLongitude = (dateTime: Date | string): number => {
  const d = daysSinceJ2000(dateTime);

  // where the sun would be if it moved at a constant speed
  const meanLongitude = 280.46 + 0.9856474 * d;
  const meanAnomaly = (357.528 + 0.9856003 * d) * DEG_TO_RAD;

  // correct for the earth's elliptical orbit
  return (
    meanLongitude +
    1.915 * Math.sin(meanAnomaly) +
    0.02 * Math.sin(2 * meanAnomaly)
  );
};

/**
 * calculate the moon sign from its ecliptic longitude as seen from earth
 *
 * @param {Date | string} dateTime
 * @returns {Sign}
 */
export const calculateMoon = (dateTime: Date | string): Sign =>
  calculateSignFromAngle(calculateMoonLongitude(dateTime));

/**
 * calculate the moon's ecliptic longitude using the largest periodic terms of the
 * ELP-2000/82 series from Meeus, "Astronomical Algorithms" ch. 47 (accurate to ~0.3°,
 * about 30 minutes of the moon's motion)
 *
 * @param {Date | string} dateTime
 * @returns {number} the moon's ecliptic longitude, in degrees (not wrapped)
 */
export const calculateMoonLongitude = (dateTime: Date | string): number => {
  const d = daysSinceJ2000(dateTime);

  // where the moon would be if it moved at a constant speed
  const meanLongitude = 218.3164477 + 13.17639648 * d;
  // angles that drive the periodic corrections, in radians
  const elongation = (297.8501921 + 12.19074912 * d) * DEG_TO_RAD; // moon's distance from the sun
  const sunAnomaly = (357.5291092 + 0.98560028 * d) * DEG_TO_RAD; // sun's position in earth's orbit
  const moonAnomaly = (134.9633964 + 13.06499295 * d) * DEG_TO_RAD; // moon's position in its orbit
  const latitudeArg = (93.272095 + 13.22935024 * d) * DEG_TO_RAD; // moon's distance from its node

  const D = elongation;
  const M = sunAnomaly;
  const Mp = moonAnomaly;
  const F = latitudeArg;

  // each term is [amplitude in degrees, argument]
  const terms: [number, number][] = [
    [6.288774, Mp], // elliptical orbit
    [1.274027, 2 * D - Mp], // evection: the sun stretching the moon's orbit
    [0.658314, 2 * D], // variation: the sun speeding up and slowing down the moon
    [0.213618, 2 * Mp],
    [-0.185116, M], // annual equation: earth's changing distance from the sun
    [-0.114332, 2 * F], // reduction to the ecliptic
    [0.058793, 2 * D - 2 * Mp],
    [0.057066, 2 * D - M - Mp],
    [0.053322, 2 * D + Mp],
    [0.045758, 2 * D - M],
    [-0.040923, M - Mp],
    [-0.03472, D],
    [-0.030383, M + Mp],
  ];

  return terms.reduce(
    (longitude, [amplitude, argument]) => longitude + amplitude * Math.sin(argument),
    meanLongitude,
  );
};

/**
 * calculate the ecliptic longitude crossing the eastern horizon, given the local
 * sidereal time (RAMC) and latitude. unreliable above the polar circles (|lat| > ~66.5°),
 * where some signs never rise
 *
 * @param {number} ramc local sidereal time, in degrees
 * @param {number} lat latitude of birth, in degrees
 * @param {number} obliquity tilt of the earth's axis, in degrees
 * @returns {number} the ascendant, in degrees [0, 360)
 */
export const calculateAscendant = (
  ramc: number,
  lat: number,
  obliquity = 23.4393,
): number => {
  const theta = ramc * DEG_TO_RAD;
  const phi = lat * DEG_TO_RAD;
  const epsilon = obliquity * DEG_TO_RAD;

  const ascendant =
    Math.atan2(
      Math.cos(theta),
      -(Math.sin(theta) * Math.cos(epsilon) + Math.tan(phi) * Math.sin(epsilon)),
    ) * RAD_TO_DEG;

  return ((ascendant % 360) + 360) % 360;
};

/**
 * calculate the rising sign: the zodiac sign on the eastern horizon at the moment
 * and place of birth
 *
 * @param {Date | string} dateTime
 * @param {ChartKey["location"]} location
 * @returns {Sign}
 */
export const calculateRising = (
  dateTime: Date | string,
  location: ChartKey["location"],
): Sign => {
  const d = daysSinceJ2000(dateTime);
  const centuries = d / 36525;

  // sidereal time at greenwich: the earth's rotation measured against the stars
  const gmst = 280.46061837 + 360.98564736629 * d;
  // local sidereal time; east longitude is positive
  const ramc = gmst + location.long;
  // the tilt of the earth's axis, which drifts slowly over centuries
  const obliquity = 23.4393 - 0.0130042 * centuries;

  return calculateSignFromAngle(calculateAscendant(ramc, location.lat, obliquity));
};

export const calculateSignFromAngle = (angleInDegrees: number): Sign => {
  // normalize data to check wraparound
  const normalized = ((angleInDegrees % 360) + 360) % 360;
  return ZODIAC[Math.floor(normalized / 30)];
};
