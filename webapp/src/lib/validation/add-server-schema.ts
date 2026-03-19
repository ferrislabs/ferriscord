import { z } from 'zod'

export const addServerFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Server name must be at least 2 characters' })
    .max(100, { message: 'Server name must not exceed 100 characters' }),
})

export type AddServerFormValues = z.infer<typeof addServerFormSchema>
