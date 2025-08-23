import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { type OnboardingStep2 } from "../../lib/onboarding-schema";

interface Step2FieldsProps {
  form: UseFormReturn<OnboardingStep2>;
}

export const Step2Fields: React.FC<Step2FieldsProps> = ({ form }) => {
  const { register, control, formState } = form;
  const { errors } = formState;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Contact & Source
        </h2>
        <p className="text-gray-600">Tell us how you heard about us</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Phone Number (Optional)
          </Label>
          <Input
            id="phone"
            type="tel"
            {...register("phone")}
            placeholder="Enter your phone number"
            className="mt-1"
            autoComplete="tel"
            aria-describedby="phone-help"
          />
          <p id="phone-help" className="text-gray-500 text-sm mt-1">
            We'll use this to contact you if needed
          </p>
        </div>

        <div>
          <Label htmlFor="source" className="text-sm font-medium text-gray-700">
            How did you hear about us? *
          </Label>
          <Controller
            name="source"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger
                  id="source"
                  className={`mt-1 ${
                    errors.source ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  aria-describedby={errors.source ? "source-error" : undefined}
                  aria-invalid={!!errors.source}
                >
                  <SelectValue placeholder="Select a source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Google">Google</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.source && (
            <p
              id="source-error"
              className="text-red-500 text-sm mt-1"
              role="alert"
            >
              {errors.source.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
