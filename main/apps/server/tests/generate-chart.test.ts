import {
  calculateAscendant,
  calculateMoon,
  calculateMoonLongitude,
  calculateRising,
  calculateSunLongitude,
  calculateSignFromAngle,
  calculateSun,
  generateChart,
  normalizeChartInput,
} from "../generate-chart";
import { Sign } from "../schema";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("generate-chart tests", () => {
  describe("calculateSignFromAngle", () => {
    it("should map the start of each 30° segment to its sign", () => {
      Object.values(Sign).forEach((sign, index) => {
        assert.equal(calculateSignFromAngle(index * 30), sign);
      });
    });

    it("should keep the end of a segment in the same sign", () => {
      assert.equal(calculateSignFromAngle(29.99), Sign.Aries);
      assert.equal(calculateSignFromAngle(359.99), Sign.Pisces);
    });

    it("should wrap angles of 360° and above", () => {
      assert.equal(calculateSignFromAngle(360), Sign.Aries);
      assert.equal(calculateSignFromAngle(400), Sign.Taurus);
      assert.equal(calculateSignFromAngle(720 + 95), Sign.Cancer);
    });

    it("should wrap negative angles", () => {
      assert.equal(calculateSignFromAngle(-10), Sign.Pisces);
      assert.equal(calculateSignFromAngle(-3155.9), Sign.Gemini);
    });
  });

  describe("calculateSun", () => {
    it("should calculate the correct sun sign for dates after 2000", () => {
      assert.equal(calculateSun("2000-01-01T12:00:00Z"), Sign.Capricorn);
      assert.equal(calculateSun("2010-07-30T12:00:00Z"), Sign.Leo);
    });

    it("should calculate the correct sun sign for dates before 2000", () => {
      assert.equal(calculateSun("1990-06-15T12:00:00Z"), Sign.Gemini);
      assert.equal(calculateSun("1955-02-24T12:00:00Z"), Sign.Pisces);
      assert.equal(calculateSun("1920-08-15T12:00:00Z"), Sign.Leo);
      assert.equal(calculateSun("1850-12-25T12:00:00Z"), Sign.Capricorn);
    });

    it("should change sign around the march equinox", () => {
      assert.equal(calculateSun("2026-03-19T12:00:00Z"), Sign.Pisces);
      assert.equal(calculateSun("2026-03-21T12:00:00Z"), Sign.Aries);
    });

    it("should accept a Date as well as a string", () => {
      assert.equal(calculateSun(new Date("1990-06-15T12:00:00Z")), Sign.Gemini);
    });
  });

  describe("normalizeChartInput", () => {
    const location = { lat: 40.7128, long: -74.006 };

    it("should produce the same key for the same moment in different offsets", () => {
      const utc = normalizeChartInput({ bornAt: "1990-06-15T12:00:00Z", location });
      const newYork = normalizeChartInput({ bornAt: "1990-06-15T08:00:00-04:00", location });
      assert.deepEqual(newYork, utc);
    });

    it("should truncate the time to the minute", () => {
      const key = normalizeChartInput({ bornAt: "1990-06-15T12:00:45.500Z", location });
      assert.equal(key.bornAt.toISOString(), "1990-06-15T12:00:00.000Z");
    });

    it("should round coordinates to 4 decimal places", () => {
      const key = normalizeChartInput({
        bornAt: "1990-06-15T12:00:00Z",
        location: { lat: 40.712800001, long: -74.00604 },
      });
      assert.deepEqual(key.location, { lat: 40.7128, long: -74.006 });
    });
  });

  describe("calculateMoon", () => {
    // signed difference between two angles, in (-180°, 180°]
    const angleBetween = (a: number, b: number) => (((a - b) % 360) + 540) % 360 - 180;

    it("should line up with the sun at solar eclipses", () => {
      for (const dateTime of [
        "2000-01-06T18:14:00Z",
        "2017-08-21T18:30:00Z",
        "2024-04-08T18:21:00Z",
      ]) {
        const offset = angleBetween(
          calculateMoonLongitude(dateTime),
          calculateSunLongitude(dateTime),
        );
        assert.ok(Math.abs(offset) < 0.5, `${dateTime}: moon is ${offset}° from the sun`);
      }
    });

    it("should be opposite the sun at lunar eclipses", () => {
      for (const dateTime of [
        "2000-01-21T04:40:00Z",
        "2022-11-08T11:02:00Z",
        "2025-03-14T06:55:00Z",
      ]) {
        const offset = angleBetween(
          calculateMoonLongitude(dateTime),
          calculateSunLongitude(dateTime) + 180,
        );
        assert.ok(Math.abs(offset) < 0.5, `${dateTime}: moon is ${offset}° from opposition`);
      }
    });

    it("should pass through all twelve signs in a lunar month, ~2.5 days each", () => {
      const start = new Date("2026-06-01T00:00:00Z").getTime();
      const hoursInSign = new Map<Sign, number>();
      for (let hours = 0; hours < 27.32 * 24; hours++) {
        const sign = calculateMoon(new Date(start + hours * 3_600_000));
        hoursInSign.set(sign, (hoursInSign.get(sign) ?? 0) + 1);
      }

      assert.equal(hoursInSign.size, 12);
      hoursInSign.forEach((hours, sign) => {
        assert.ok(hours > 1.5 * 24 && hours < 3.5 * 24, `${sign}: ${hours} hours`);
      });
    });
  });

  describe("calculateAscendant", () => {
    const assertClose = (actual: number, expected: number) =>
      assert.ok(
        Math.abs(actual - expected) < 0.1,
        `expected ${actual} to be within 0.1° of ${expected}`,
      );

    it("should match known values at the equator", () => {
      assertClose(calculateAscendant(0, 0), 90);
      assertClose(calculateAscendant(90, 0), 180);
    });

    it("should match the table of houses for London", () => {
      // 26°36′ Cancer
      assertClose(calculateAscendant(0, 51.5), 116.6);
    });

    it("should mirror around RAMC 90°", () => {
      for (const ramc of [0, 30, 75, 120]) {
        const sum = calculateAscendant(ramc, 40) + calculateAscendant(180 - ramc, 40);
        // compare on the circle, so 359.99… counts as 0
        const offset = ((sum + 180) % 360) - 180;
        assertClose(offset, 0);
      }
    });
  });

  describe("calculateRising", () => {
    const newYork = { lat: 40.7128, long: -74.006 };
    const london = { lat: 51.5074, long: -0.1278 };
    const sydney = { lat: -33.8688, long: 151.2093 };

    it("should match the sun sign at sunrise, when the sun is on the ascendant", () => {
      // sunrise times, mid-sign so a few minutes of error can't cross a boundary
      const sunrises: [string, typeof london][] = [
        ["2026-08-07T04:28:00Z", london], // sun ~15° Leo
        ["2026-11-15T11:40:00Z", newYork], // sun ~23° Scorpio
        ["2026-01-09T18:53:00Z", sydney], // sun ~19° Capricorn
      ];

      for (const [dateTime, location] of sunrises) {
        assert.equal(calculateRising(dateTime, location), calculateSun(dateTime));
      }
    });

    it("should pass through all twelve signs over a day", () => {
      const start = new Date("2026-06-01T00:00:00Z").getTime();
      const signs = new Set<Sign>();
      for (let minutes = 0; minutes < 24 * 60; minutes += 10) {
        signs.add(calculateRising(new Date(start + minutes * 60_000), newYork));
      }
      assert.equal(signs.size, 12);
    });

    it("should depend on the longitude of birth", () => {
      const moment = "2026-06-01T12:00:00Z";
      assert.notEqual(
        calculateRising(moment, { lat: 40, long: 0 }),
        calculateRising(moment, { lat: 40, long: 90 }),
      );
    });
  });

  describe("generateChart", () => {
    it("should include the key alongside the calculated signs", () => {
      const key = normalizeChartInput({
        bornAt: "1990-06-15T12:00:00Z",
        location: { lat: 40.7128, long: -74.006 },
      });
      const chart = generateChart(key);

      assert.deepEqual(chart.bornAt, key.bornAt);
      assert.deepEqual(chart.location, key.location);
      assert.equal(chart.sun, Sign.Gemini);
    });
  });
});
