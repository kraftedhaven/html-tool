import { z } from 'zod'

export const LoginSchema = z.object({
  username: z.string().min(1, 'username required'),
  password: z.string().min(1, 'password required'),
})

export const InsightsSchema = z.object({
  title: z.string().min(1, 'title required'),
  description: z.string().max(5000).optional(),
  categoryName: z.string().max(200).optional(),
})

// Permissive schemas for inventory since fields are flexible
export const InventoryCreateSchema = z.record(z.any())
export const InventoryUpdateSchema = z.record(z.any())

// Express helper: validate req.body against a Zod schema
export function validateBody(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.safeParse(req.body)
      if (!parsed.success) {
        const msg = parsed.error.issues.map(i => i.message).join(', ')
        return res.status(400).json({ error: msg })
      }
      req.validated = { ...(req.validated || {}), body: parsed.data }
      next()
    } catch (e) {
      return res.status(400).json({ error: 'Invalid request payload' })
    }
  }
}

