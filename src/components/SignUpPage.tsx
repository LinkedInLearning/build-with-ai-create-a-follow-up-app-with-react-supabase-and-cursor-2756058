import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";

interface User {
  id: string;
  email: string;
  role?: string;
}

interface SignUpPageProps {
  onSignUp?: (user: User) => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onSignUp }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: "Passwords do not match.",
      });
      setLoading(false);
      return;
    }

    // Validate password strength
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      toast({
        variant: "destructive",
        title: "Weak Password",
        description:
          "Password must be at least 8 characters with uppercase, lowercase, number, and special character.",
      });
      setLoading(false);
      return;
    }

    try {
      // Sign up functionality
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        try {
          // Manually create user record in the users table

          // First, get the default role (sub_admin) to assign to new users
          const { data: defaultRole, error: roleError } = await supabase
            .from("roles")
            .select("id")
            .eq("name", "sub_admin")
            .single();

          if (roleError) {
            console.error("Error fetching default role:", roleError);
            // Continue without a role - it will be assigned later
          }

          const { data: userRecord, error: userError } = await supabase
            .from("users")
            .insert({
              user_id: data.user.id,
              email: data.user.email,
              role_id: defaultRole?.id || null, // Assign default role or null
            })
            .select()
            .single();

          if (userError) {
            console.error("Error creating user record:", userError);
            console.error("Error details:", {
              message: userError.message,
              details: userError.details,
              hint: userError.hint,
              code: userError.code,
            });

            // Check if it's a duplicate email error
            if (
              userError.code === "23505" ||
              userError.message.includes("duplicate")
            ) {
              toast({
                variant: "success",
                title: "Account Created Successfully!",
                description:
                  "Your account has been created. Please contact a super-admin to assign you a role before you can access the system.",
              });
            } else {
              toast({
                variant: "destructive",
                title: "Warning",
                description: `Account created but there was an issue with user setup: ${userError.message}`,
              });
            }
          } else {
            toast({
              variant: "success",
              title: "Account Created Successfully!",
              description:
                "Your account has been created with sub-admin role. You can now sign in to access the system.",
            });
          }
        } catch (dbError: unknown) {
          console.error("Database error creating user record:", dbError);
          console.error("Database error details:", dbError);
          // Don't fail the sign-up, just log the error
          toast({
            variant: "destructive",
            title: "Warning",
            description: `Account created but there was an issue with user setup: ${
              dbError instanceof Error ? dbError.message : "Unknown error"
            }`,
          });
        }

        // Check if email confirmation is required
        if (data.user.email_confirmed_at) {
          // Email already confirmed, redirect to login
          navigate("/login");
        } else {
          // Email confirmation required
          toast({
            variant: "default",
            title: "Email Confirmation Required",
            description:
              "Please check your email and click the confirmation link. After confirming your email, contact a super-admin to assign you a role.",
          });

          // Redirect back to login page
          navigate("/login");
        }
      } else {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "No user data returned from authentication.",
        });
      }
    } catch (error: unknown) {
      console.error("Authentication error:", error);

      // Provide more specific error messages
      let errorMessage = "An error occurred during authentication.";

      if (error instanceof Error && error.message) {
        if (error.message.includes("already registered")) {
          errorMessage =
            "This email is already registered. Please try signing in instead.";
        } else if (error.message.includes("password")) {
          errorMessage =
            "Password does not meet requirements. Please ensure it has at least 8 characters with uppercase, lowercase, number, and special character.";
        } else if (error.message.includes("email")) {
          errorMessage = "Please enter a valid email address.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Sign Up</h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your sub-admin account
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">Important:</p>
            <p className="text-xs text-blue-700">
              You must have been invited by a super-admin to sign up.
            </p>
            <p className="text-xs text-blue-700">
              Use the email and password provided by your administrator.
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
                  autoComplete="new-password"
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
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters with uppercase, lowercase, number,
                and special character
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
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
                  "Sign Up"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="flex items-center justify-center w-full text-sm text-gray-600 hover:text-gray-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
};
