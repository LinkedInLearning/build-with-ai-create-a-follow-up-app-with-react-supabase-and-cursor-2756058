import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase, logAuditEvent } from "@/lib/supabase";
import type { LeadInsert } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

// Zod schema for form validation
const leadFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  source: z.enum(["Google", "Referral", "Other"]),
  otherSource: z.string().optional(),
  interest: z.string().min(1, "Please tell us about your interest"),
  note: z.string().optional(),
  consent_marketing: z.boolean().refine((val) => val === true, {
    message: "Marketing consent is required",
  }),
  consent_privacy: z.boolean().refine((val) => val === true, {
    message: "Privacy consent is required",
  }),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

export const LeadForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      source: "Google",
    },
  });

  const selectedSource = watch("source");

  const handleFormSubmit = async (data: LeadFormData) => {
    setIsLoading(true);

    try {
      // If source is "Other", use the otherSource value
      const finalData: LeadInsert = {
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        source:
          data.source === "Other" ? data.otherSource || "Other" : data.source,
        interest: data.interest,
        note: data.note || undefined,
        consent_marketing: data.consent_marketing,
        consent_privacy: data.consent_privacy,
        user_agent: navigator.userAgent,
      };

      const { data: insertedLead, error } = await supabase.from("leads").insert([finalData]).select();

      if (error) {
        if (error.message === "Supabase not configured") {
          // Show a helpful message for development
          toast({
            variant: "destructive",
            title: "Configuration Required",
            description:
              "Please set up your Supabase environment variables in the .env file.",
          });
          return;
        }
        throw error;
      }

      // Log audit event for lead creation
      if (insertedLead && insertedLead[0]) {
        await logAuditEvent(
          "create",
          "leads",
          insertedLead[0].id,
          {
            lead_name: finalData.name,
            lead_email: finalData.email,
            source: finalData.source
          }
        );
      }

      // Show success toast
      toast({
        variant: "success",
        title: "Success!",
        description:
          "Your information has been submitted successfully. We'll get back to you soon!",
      });

      // Reset form
      reset();
    } catch (err) {
      console.error("Error submitting lead:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit your information. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Name Field */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Name *
          </label>
          <input
            {...register("name")}
            type="text"
            id="name"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.name ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter your full name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email *
          </label>
          <input
            {...register("email")}
            type="email"
            id="email"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.email ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter your email address"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Phone Field */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Phone Number
          </label>
          <input
            {...register("phone")}
            type="tel"
            id="phone"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your phone number (optional)"
          />
        </div>

        {/* Source Field */}
        <div>
          <label
            htmlFor="source"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            How did you hear about us? *
          </label>
          <select
            {...register("source")}
            id="source"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Google">Google</option>
            <option value="Referral">Referral</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Other Source Field - Conditional */}
        {selectedSource === "Other" && (
          <div>
            <label
              htmlFor="otherSource"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Please specify *
            </label>
            <input
              {...register("otherSource")}
              type="text"
              id="otherSource"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="How did you hear about us?"
            />
          </div>
        )}

        {/* Interest Field */}
        <div>
          <label
            htmlFor="interest"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            What are you interested in? *
          </label>
          <textarea
            {...register("interest")}
            id="interest"
            rows={4}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.interest ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Tell us about your interests or what you're looking for..."
          />
          {errors.interest && (
            <p className="mt-1 text-sm text-red-600">
              {errors.interest.message}
            </p>
          )}
        </div>

        {/* Note Field */}
        <div>
          <label
            htmlFor="note"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Additional Notes
          </label>
          <textarea
            {...register("note")}
            id="note"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Any additional information you'd like to share..."
          />
        </div>

        {/* Consent Fields */}
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <input
              id="consent_marketing"
              type="checkbox"
              {...register("consent_marketing")}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
            />
            <div className="flex-1">
              <label
                htmlFor="consent_marketing"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                I agree to receive marketing emails
              </label>
              {errors.consent_marketing && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.consent_marketing.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <input
              id="consent_privacy"
              type="checkbox"
              {...register("consent_privacy")}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
            />
            <div className="flex-1">
              <label
                htmlFor="consent_privacy"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                I have read the privacy policy
              </label>
              {errors.consent_privacy && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.consent_privacy.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
};
