import { z } from "zod";

// Step 1: Basic information
export const OnboardingStep1Schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

// Step 2: Contact and source information
export const OnboardingStep2Schema = z.object({
  phone: z.string().optional(),
  source: z.enum(["Google", "Referral", "Other"]),
});

// Step 3: Interest, notes, and consent
export const OnboardingStep3Schema = z.object({
  interest: z.string().min(1, "Interest is required"),
  note: z.string().optional(),
  consent_marketing: z.boolean(),
  consent_privacy: z.boolean(),
});

// Combined schema that enforces step order
export const OnboardingSchema = z
  .object({
    step1: OnboardingStep1Schema,
    step2: OnboardingStep2Schema.optional(),
    step3: OnboardingStep3Schema.optional(),
  })
  .refine(
    (data) => {
      // Step 2 can only be completed if Step 1 is completed
      if (data.step2 && !data.step1) {
        return false;
      }
      // Step 3 can only be completed if Step 2 is completed
      if (data.step3 && !data.step2) {
        return false;
      }
      return true;
    },
    {
      message: "Steps must be completed in order",
      path: ["stepOrder"],
    }
  );

// Type exports for TypeScript
export type OnboardingStep1 = z.infer<typeof OnboardingStep1Schema>;
export type OnboardingStep2 = z.infer<typeof OnboardingStep2Schema>;
export type OnboardingStep3 = z.infer<typeof OnboardingStep3Schema>;
export type OnboardingData = z.infer<typeof OnboardingSchema>;

// Helper functions for step validation
export const validateStep1 = (data: unknown): OnboardingStep1 => {
  return OnboardingStep1Schema.parse(data);
};

export const validateStep2 = (
  data: unknown,
  step1Data: OnboardingStep1
): OnboardingStep2 => {
  // Ensure step 1 is completed before step 2
  if (!step1Data) {
    throw new Error("Step 1 must be completed before Step 2");
  }
  return OnboardingStep2Schema.parse(data);
};

export const validateStep3 = (
  data: unknown,
  step2Data: OnboardingStep2
): OnboardingStep3 => {
  // Ensure step 2 is completed before step 3
  if (!step2Data) {
    throw new Error("Step 2 must be completed before Step 3");
  }
  return OnboardingStep3Schema.parse(data);
};

// Complete onboarding validation
export const validateCompleteOnboarding = (data: unknown): OnboardingData => {
  return OnboardingSchema.parse(data);
};
