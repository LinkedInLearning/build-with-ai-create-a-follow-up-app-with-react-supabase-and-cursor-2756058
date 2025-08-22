import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  OnboardingSchema,
  OnboardingStep1Schema,
  OnboardingStep2Schema,
  OnboardingStep3Schema,
  type OnboardingData,
  type OnboardingStep1,
  type OnboardingStep2,
  type OnboardingStep3,
} from "../lib/onboarding-schema";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { Step1Fields, Step2Fields, Step3Fields } from "./onboarding";

interface OnboardingFlowProps {
  onComplete?: (data: OnboardingData) => void;
  onCancel?: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Form for step 1
  const step1Form = useForm<OnboardingStep1>({
    resolver: zodResolver(OnboardingStep1Schema),
    mode: "onChange",
  });

  // Form for step 2
  const step2Form = useForm<OnboardingStep2>({
    resolver: zodResolver(OnboardingStep2Schema),
    mode: "onChange",
  });

  // Form for step 3
  const step3Form = useForm<OnboardingStep3>({
    resolver: zodResolver(OnboardingStep3Schema),
    mode: "onChange",
  });

  const [step1Data, setStep1Data] = useState<OnboardingStep1 | null>(null);
  const [step2Data, setStep2Data] = useState<OnboardingStep2 | null>(null);
  const [step3Data, setStep3Data] = useState<OnboardingStep3 | null>(null);

  const handleStep1Submit = async (data: OnboardingStep1) => {
    setStep1Data(data);
    setCompletedSteps((prev) => new Set([...prev, 1]));
    setCurrentStep(2);
  };

  const handleStep2Submit = async (data: OnboardingStep2) => {
    setStep2Data(data);
    setCompletedSteps((prev) => new Set([...prev, 2]));
    setCurrentStep(3);
  };

  const handleStep3Submit = async (data: OnboardingStep3) => {
    setStep3Data(data);
    setCompletedSteps((prev) => new Set([...prev, 3]));

    // Complete the onboarding
    const completeData: OnboardingData = {
      step1: step1Data!,
      step2: step2Data!,
      step3: data,
    };

    onComplete?.(completeData);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStep1Valid = step1Form.formState.isValid;
  const isStep2Valid = step2Form.formState.isValid;
  const isStep3Valid = step3Form.formState.isValid;

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-semibold text-sm ${
                step === currentStep
                  ? "bg-blue-600 text-white border-blue-600"
                  : completedSteps.has(step)
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-gray-100 text-gray-400 border-gray-300"
              }`}
            >
              {completedSteps.has(step) ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                step
              )}
            </div>
            {step < 3 && (
              <div
                className={`w-16 h-0.5 mx-2 ${
                  completedSteps.has(step) ? "bg-green-600" : "bg-gray-300"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="ml-4 text-sm text-gray-600">Step {currentStep} of 3</div>
    </div>
  );

  const renderStep1 = () => <Step1Fields form={step1Form} />;

  const renderStep2 = () => <Step2Fields form={step2Form} />;

  const renderStep3 = () => <Step3Fields form={step3Form} />;

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  const getCurrentForm = () => {
    switch (currentStep) {
      case 1:
        return step1Form;
      case 2:
        return step2Form;
      case 3:
        return step3Form;
      default:
        return step1Form;
    }
  };

  const getCurrentValidation = () => {
    switch (currentStep) {
      case 1:
        return isStep1Valid;
      case 2:
        return isStep2Valid;
      case 3:
        return isStep3Valid;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const currentForm = getCurrentForm();

    switch (currentStep) {
      case 1:
        currentForm.handleSubmit(handleStep1Submit)();
        break;
      case 2:
        currentForm.handleSubmit(handleStep2Submit)();
        break;
      case 3:
        currentForm.handleSubmit(handleStep3Submit)();
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {renderStepIndicator()}

          <form className="space-y-8">
            {renderCurrentStep()}

            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center space-x-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>

              <div className="flex space-x-3">
                {onCancel && (
                  <Button type="button" variant="ghost" onClick={onCancel}>
                    Cancel
                  </Button>
                )}

                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!getCurrentValidation()}
                  className="flex items-center space-x-2"
                >
                  {currentStep === 3 ? "Complete" : "Next"}
                  {currentStep !== 3 && <ChevronRight className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
