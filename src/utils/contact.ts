'use server'
import { subscribeSchema } from '../leadIngestion.schema';
// Assume a generic Redis-backed rate limiter utility exists in the project
import { checkRateLimit } from '../utils/rateLimiter'; 

export type ActionState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

/**
 * Secure Next.js Server Action for Contact/Discovery Ingestion.
 * Implements strict Zod validation, rate limiting, and safe error handling.
 */
export async function submitContact(prevState: ActionState, formData: FormData): Promise<ActionState> {
  // 1. Rate Limiting (Protects against the missing bot protection found in audit)
  // In a real scenario, we pass the user's IP or a session token
  const rateLimit = await checkRateLimit('contact_form_submission');
  if (!rateLimit.allowed) {
    return { success: false, message: "Too many requests. Please try again later." };
  }

  // 2. Extract and Validate Payload
  const rawData = {
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    company: formData.get('company'),
    industry: formData.get('industry'),
    message: formData.get('message'),
  };

  const validatedFields = subscribeSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid form data.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    // 3. Database Ingestion & Queueing (e.g., Prisma + BullMQ)
    // await db.lead.create({ data: validatedFields.data });
    // await emailQueue.add('sendWelcome', { email: validatedFields.data.email });

    return { success: true, message: "Inquiry submitted successfully." };
  } catch (error) {
    // 4. Safe Error Handling (Fixes the opaque "Something went wrong" error)
    console.error('[Contact Action Error]', error);
    // Never leak actual database/SMTP error strings to the client
    return { success: false, message: "An internal server error occurred. Our team has been notified." };
  }
}