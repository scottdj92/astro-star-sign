import { PersonInfo } from "./personInfo";

export enum Sign {
    Aries,
    Taurus,
    Gemini,
    Cancer,
    Leo,
    Virgo,
    Libra,
    Scorpio,
    Sagittarius,
    Capricorn,
    Aquarius,
    Pisces
}

export type Chart = {
    sun: Sign;
    moon: Sign;
    rising: Sign;
} & PersonInfo;
