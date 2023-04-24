// add the logic for determining charts based on user input
import { MongoClient } from "mongodb";
import { PersonInfo, Chart, Sign } from "./schema";

export const generateChart = async (person: PersonInfo, db: MongoClient): Promise<Chart> => {
    // example data

    // perform calculations

    // update the mongo document
    return {
        sun: Sign.Aries,
        moon: Sign.Libra,
        rising: Sign.Sagittarius
    };
};
