import React, { useState, useEffect } from "react";
import { LeadsDemo } from "./LeadsDemo";
import { supabase } from "@/lib/supabase";
import { LogOut } from "lucide-react";

interface User {
  id: string;
  email: string;
  role?: string;
}

export const AuthenticatedApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get current user data
    const getCurrentUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: userData } = await supabase
          .from("users")
          .select(
            `
            id,
            email,
            roles (
              name
            )
          `
          )
          .eq("id", session.user.id)
          .single();

        setUser({
          id: session.user.id,
          email: session.user.email || "",
          role: userData?.roles?.name || "user",
        });
      }
    };

    getCurrentUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // The ProtectedRoute will handle the redirect
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with user info and sign out */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Lead Management System
              </h1>
              <p className="text-sm text-gray-600">
                Welcome, {user.email} {user.role && `(${user.role})`}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>
        <LeadsDemo />
      </main>
    </div>
  );
};
