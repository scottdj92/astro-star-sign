import { z } from "zod";

export const chartInputSchema = z.object({
    // a full ISO datetime including a UTC offset, so the birth moment is unambiguous
    bornAt: z.string().datetime({ offset: true }),
    location: z.object({
        lat: z.number().min(-90).max(90),
        long: z.number().min(-180).max(180),
    }),
});

export type ChartInput = z.infer<typeof chartInputSchema>;
