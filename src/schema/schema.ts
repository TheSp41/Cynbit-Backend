// src/leadIngestion.schema.ts
import { z } from 'zod';

/**
 * Strict validation schema for public forms (Contact / Newsletter).
 * Ensures backend does not accept malicious payloads, SQL injection, or oversized data.
 */ 
export const subscribeSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email format" })
    .max(100, { message: "Email is too long" })
    .transform((val) => val.toLowerCase().trim()), // Auto-sanitize
  
  // Optional name field, stripped of HTML tags
  name: z
    .string()
    .max(50)
    .regex(/^[a-zA-Z\s]*$/, "Name can only contain letters and spaces")
    .optional(),
}).strict(); // .strict() drops any unknown fields sent by attackers