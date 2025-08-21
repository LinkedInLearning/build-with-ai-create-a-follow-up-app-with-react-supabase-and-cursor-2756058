import { useState } from "react";
import { LeadForm } from "./LeadForm";
import { LeadsTable } from "./LeadsTable";
import { Toaster } from "@/components/ui/toaster";

export const LeadsDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"form" | "table">("form");

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Lead Management System
            </h1>
            <p className="text-lg text-gray-600">
              Submit new leads and view existing ones
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
              <button
                onClick={() => setActiveTab("form")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "form"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Submit Lead
              </button>
              <button
                onClick={() => setActiveTab("table")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "table"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                View Leads
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="max-w-6xl mx-auto">
            {activeTab === "form" && (
              <div className="mb-8">
                <LeadForm />
              </div>
            )}

            {activeTab === "table" && (
              <div>
                <LeadsTable />
              </div>
            )}
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
};
