import { z } from "zod";

export const addServerFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Server name must be at least 2 characters" })
    .max(100, { message: "Server name must not exceed 100 characters" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters" })
    .max(500, { message: "Description must not exceed 500 characters" }),
  picture_url: z.string().optional(),
  banner_url: z.string().optional(),
  visibility: z.enum(["Public", "Private"]),
});

export type AddServerFormValues = z.infer<typeof addServerFormSchema>;
