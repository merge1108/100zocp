import { defineCollection, z } from "astro:content";

const cases = defineCollection({
  type: "data",
  schema: z.object({
    title: z.string(),
    kicker: z.string(),
    image: z.string(),
    alt: z.string(),
    summary: z.string().optional(),
  }),
});

export const collections = { cases };
