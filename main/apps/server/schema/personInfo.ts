import { z } from "zod";

export type PersonInfo = {
    dob: string;
    locationOfBirth?: {
        lat: number;
        long: number;
    };
    timeOfBirth?: string;
};

export const personInfoSchema = z.object({
    dob: z.string().datetime(),
    locationOfBirth: z.object({
        lat: z.number(),
        long: z.number(),
    }).nullish().optional(),
    timeOfBirth: z.string().nullish()
});
