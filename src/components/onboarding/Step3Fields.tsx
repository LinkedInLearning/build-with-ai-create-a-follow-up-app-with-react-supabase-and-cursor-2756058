import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { type OnboardingStep3 } from "../../lib/onboarding-schema";

interface Step3FieldsProps {
  form: UseFormReturn<OnboardingStep3>;
}

export const Step3Fields: React.FC<Step3FieldsProps> = ({ form }) => {
  const { register, formState } = form;
  const { errors } = formState;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Interests & Notes
        </h2>
        <p className="text-gray-600">Tell us what interests you</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label
            htmlFor="interest"
            className="text-sm font-medium text-gray-700"
          >
            What interests you? *
          </Label>
          <Input
            id="interest"
            type="text"
            {...register("interest")}
            placeholder="e.g., React Development, UI/UX Design"
            className={`mt-1 ${
              errors.interest ? "border-red-500 focus:border-red-500" : ""
            }`}
            aria-describedby={
              errors.interest ? "interest-error" : "interest-help"
            }
            aria-invalid={!!errors.interest}
            autoComplete="off"
          />
          <p id="interest-help" className="text-gray-500 text-sm mt-1">
            This helps us personalize your experience
          </p>
          {errors.interest && (
            <p
              id="interest-error"
              className="text-red-500 text-sm mt-1"
              role="alert"
            >
              {errors.interest.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="note" className="text-sm font-medium text-gray-700">
            Additional Notes (Optional)
          </Label>
          <Textarea
            id="note"
            {...register("note")}
            placeholder="Any additional information you'd like to share..."
            rows={4}
            className="mt-1"
            aria-describedby="note-help"
          />
          <p id="note-help" className="text-gray-500 text-sm mt-1">
            Feel free to share any other details that might be relevant
          </p>
        </div>

        {/* Consent Fields */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Consent & Privacy
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Please review and accept our terms before proceeding
          </p>

          <div className="flex items-start space-x-3">
            <input
              id="consent_marketing"
              type="checkbox"
              {...register("consent_marketing")}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
              aria-describedby={
                errors.consent_marketing ? "consent-marketing-error" : undefined
              }
              aria-invalid={!!errors.consent_marketing}
            />
            <div className="flex-1">
              <Label
                htmlFor="consent_marketing"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                I agree to receive marketing emails
              </Label>
              {errors.consent_marketing && (
                <p
                  id="consent-marketing-error"
                  className="text-red-500 text-sm mt-1"
                  role="alert"
                >
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
              aria-describedby={
                errors.consent_privacy ? "consent-privacy-error" : undefined
              }
              aria-invalid={!!errors.consent_privacy}
            />
            <div className="flex-1">
              <Label
                htmlFor="consent_privacy"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                I have read the privacy policy
              </Label>
              {errors.consent_privacy && (
                <p
                  id="consent-privacy-error"
                  className="text-red-500 text-sm mt-1"
                  role="alert"
                >
                  {errors.consent_privacy.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
