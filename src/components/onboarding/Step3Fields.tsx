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
      </div>
    </div>
  );
};
