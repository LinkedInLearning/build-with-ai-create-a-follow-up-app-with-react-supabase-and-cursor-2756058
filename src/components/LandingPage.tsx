import React, { useState } from "react";
import { OnboardingFlow } from "./OnboardingFlow";
import { type OnboardingData } from "../lib/onboarding-schema";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { LoadingOverlay } from "./ui/loading";
import {
  ArrowRight,
  CheckCircle,
  Users,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async (data: OnboardingData) => {
    setIsLoading(true);
    try {
      // Optionally save to Supabase if configured
      if (supabase) {
        try {
          const leadData = {
            name: data.step1.name,
            email: data.step1.email,
            phone: data.step2?.phone || null,
            source: data.step2?.source || "Other",
            interest: data.step3?.interest || "",
            note: data.step3?.note || null,
            consent_marketing: data.step3?.consent_marketing || false,
            consent_privacy: data.step3?.consent_privacy || false,
            user_agent: navigator.userAgent,
          };

          const { error } = await supabase.from("leads").insert([leadData]);

          if (error) {
            console.error("Supabase error:", error);
            if (error.message === "Supabase not configured") {
              // Show a helpful message for development
              alert(
                "Database not configured. Please set up your Supabase environment variables."
              );
              return;
            }
            throw error;
          }

          // Show success message
          console.log("Lead submitted successfully:", leadData);
        } catch (supabaseError) {
          console.error("Supabase connection error:", supabaseError);
          alert("Failed to connect to database. Please try again.");
          return;
        }
      }

      // Simulate a brief delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsSubmitted(true);
      setShowOnboarding(false);
    } catch (error) {
      console.error("Error processing onboarding:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowOnboarding(false);
  };

  const handleStartOnboarding = () => {
    setShowOnboarding(true);
    setIsSubmitted(false);
  };

  if (showOnboarding) {
    return (
      <OnboardingFlow onComplete={handleComplete} onCancel={handleCancel} />
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Thank You! 🎉
            </CardTitle>
            <CardDescription className="text-lg">
              Your information has been submitted successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              We'll review your information and get back to you soon with
              personalized recommendations.
            </p>
            <Button
              onClick={() => setIsSubmitted(false)}
              className="w-full"
              size="lg"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <LoadingOverlay
        isVisible={isLoading}
        text="Submitting your information..."
      />
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">
                FollowUp Pro
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/login")}
              >
                Login
              </Button>
              <Button size="sm" onClick={handleStartOnboarding}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Streamline Your
              <span className="text-blue-600"> Follow-up Process</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Transform your lead management with our intelligent follow-up
              system. Never miss an opportunity to connect with potential
              clients.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleStartOnboarding}
                size="lg"
                className="text-lg px-8 py-3"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose FollowUp Pro?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to help you close more deals and build
              stronger relationships.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-8 border-0 shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl mb-3">
                Smart Lead Management
              </CardTitle>
              <CardDescription className="text-gray-600">
                Automatically categorize and prioritize leads based on
                engagement and potential value.
              </CardDescription>
            </Card>

            <Card className="text-center p-8 border-0 shadow-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-xl mb-3">
                Automated Follow-ups
              </CardTitle>
              <CardDescription className="text-gray-600">
                Set up intelligent follow-up sequences that adapt based on
                prospect behavior and responses.
              </CardDescription>
            </Card>

            <Card className="text-center p-8 border-0 shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl mb-3">Secure & Reliable</CardTitle>
              <CardDescription className="text-gray-600">
                Enterprise-grade security with 99.9% uptime guarantee and
                comprehensive data protection.
              </CardDescription>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                10,000+
              </div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                500K+
              </div>
              <div className="text-gray-600">Leads Managed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">98%</div>
              <div className="text-gray-600">Customer Satisfaction</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                24/7
              </div>
              <div className="text-gray-600">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Follow-up Process?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of businesses that have already improved their lead
            conversion rates.
          </p>
          <Button
            onClick={handleStartOnboarding}
            size="lg"
            variant="secondary"
            className="text-lg px-8 py-3"
          >
            Get Started Now
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold">FollowUp Pro</span>
              </div>
              <p className="text-gray-400">
                Streamline your follow-up process and never miss an opportunity
                to connect with potential clients.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Features</li>
                <li>Pricing</li>
                <li>Integrations</li>
                <li>API</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>About</li>
                <li>Blog</li>
                <li>Careers</li>
                <li>Contact</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Documentation</li>
                <li>Community</li>
                <li>Status</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 FollowUp Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
