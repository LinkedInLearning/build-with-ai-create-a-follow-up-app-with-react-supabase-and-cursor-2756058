import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { type OnboardingStep1 } from "../../lib/onboarding-schema";

interface Step1FieldsProps {
  form: UseFormReturn<OnboardingStep1>;
}

export const Step1Fields: React.FC<Step1FieldsProps> = ({ form }) => {
  const { register, formState } = form;
  const { errors } = formState;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Basic Information
        </h2>
        <p className="text-gray-600">Let's start with your basic details</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Full Name *
          </Label>
          <Input
            id="name"
            type="text"
            {...register("name")}
            placeholder="Enter your full name"
            className={`mt-1 ${
              errors.name ? "border-red-500 focus:border-red-500" : ""
            }`}
            aria-describedby={errors.name ? "name-error" : undefined}
            aria-invalid={!!errors.name}
            autoComplete="name"
          />
          {errors.name && (
            <p
              id="name-error"
              className="text-red-500 text-sm mt-1"
              role="alert"
            >
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="Enter your email address"
            className={`mt-1 ${
              errors.email ? "border-red-500 focus:border-red-500" : ""
            }`}
            aria-describedby={errors.email ? "email-error" : undefined}
            aria-invalid={!!errors.email}
            autoComplete="email"
          />
          {errors.email && (
            <p
              id="email-error"
              className="text-red-500 text-sm mt-1"
              role="alert"
            >
              {errors.email.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
