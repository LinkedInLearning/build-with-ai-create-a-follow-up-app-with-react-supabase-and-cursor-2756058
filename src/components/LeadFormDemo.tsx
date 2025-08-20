import React from "react";
import { LeadForm } from "./LeadForm";
import { Toaster } from "@/components/ui/toaster";

export const LeadFormDemo: React.FC = () => {
  return (
    <>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Lead Form Demo
            </h1>
            <p className="text-lg text-gray-600">
              This is a public-facing lead form for website visitors
            </p>
          </div>

          <LeadForm />
        </div>
      </div>
      <Toaster />
    </>
  );
};
