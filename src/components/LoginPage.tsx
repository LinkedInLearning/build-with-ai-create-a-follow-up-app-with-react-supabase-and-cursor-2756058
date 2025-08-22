import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Eye, EyeOff, Loader2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  role?: string;
}

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Attempting to sign in with:", { email, password: "***" });

      // Sign in functionality
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Sign in response:", { data, error });

      if (error) {
        throw error;
      }

      if (data.user) {
        console.log("User authenticated:", data.user);

        // Get user role from users and roles tables
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select(
            `
            id,
            email,
            role_id,
            roles (
              name
            )
          `
          )
          .eq("user_id", data.user.id)
          .maybeSingle(); // Use maybeSingle() instead of single() to handle missing records

        console.log("User data from database:", { userData, userError });
        console.log("User data structure:", JSON.stringify(userData, null, 2));

        if (userError) {
          console.error("Error fetching user data:", userError);
          console.error("Error details:", {
            message: userError.message,
            details: userError.details,
            hint: userError.hint,
            code: userError.code,
          });
          toast({
            variant: "destructive",
            title: "User Data Error",
            description: `Failed to fetch user role information: ${userError.message}`,
          });
          return;
        }

        if (!userData) {
          console.error("User not found in database");
          toast({
            variant: "destructive",
            title: "User Not Found",
            description:
              "User account not found in database. Please contact an administrator.",
          });
          return;
        }

        const userRole = userData?.roles?.name;
        console.log("User role:", userRole);

        if (!userRole) {
          console.error("No role found for user");
          toast({
            variant: "destructive",
            title: "Role Error",
            description:
              "User has no assigned role. Please contact an administrator.",
          });
          return;
        }

        onLogin({
          id: data.user.id,
          email: data.user.email || "",
          role: userRole,
        });

        toast({
          variant: "success",
          title: "Welcome Back!",
          description: "You have been successfully signed in.",
        });
      } else {
        console.log("No user data returned from sign in");
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "No user data returned from authentication.",
        });
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred during authentication.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      toast({
        variant: "success",
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });

      // The parent component should handle the redirect
      window.location.reload(); // Simple redirect for demo
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        variant: "destructive",
        title: "Sign Out Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while signing out.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Sign In</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium mb-2">
              Debug Info:
            </p>
            <p className="text-xs text-yellow-700">
              Check browser console for detailed logs
            </p>
            <p className="text-xs text-yellow-700">
              Only super_admin and sub_admin roles supported
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              New sub-admin?{" "}
              <button
                type="button"
                onClick={() => (window.location.href = "/signup")}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign up here
              </button>
            </p>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
};
