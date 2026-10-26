// in zodiac order, starting at 0° (the march equinox)
export enum Sign {
    Aries = "Aries",
    Taurus = "Taurus",
    Gemini = "Gemini",
    Cancer = "Cancer",
    Leo = "Leo",
    Virgo = "Virgo",
    Libra = "Libra",
    Scorpio = "Scorpio",
    Sagittarius = "Sagittarius",
    Capricorn = "Capricorn",
    Aquarius = "Aquarius",
    Pisces = "Pisces"
}

// the normalized birth moment and place; unique per chart in the db
export type ChartKey = {
    bornAt: Date;
    location: {
        lat: number;
        long: number;
    };
};

export type Chart = {
    sun: Sign;
    moon: Sign;
    rising: Sign;
} & ChartKey;

// a chart as the api returns it: JSON has no Date or ObjectId, so both become strings
export type ChartResponse = Omit<Chart, "bornAt"> & {
    _id: string;
    bornAt: string;
};
