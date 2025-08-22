import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  email: string;
  role?: string;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log("ProtectedRoute: Timeout reached, setting loading to false");
      setLoading(false);
    }, 5000); // 5 second timeout

    // Check for existing session
    const checkSession = async () => {
      try {
        console.log("ProtectedRoute: Checking session...");
        const {
          data: { session },
        } = await supabase.auth.getSession();

        console.log("ProtectedRoute: Session result:", { session });

        if (session?.user) {
          console.log(
            "ProtectedRoute: User found in session:",
            session.user.email
          );

          try {
            // Get user role from users and roles tables
            console.log(
              "ProtectedRoute: Fetching user data for ID:",
              session.user.id
            );

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
              .eq("user_id", session.user.id)
              .maybeSingle();

            console.log("ProtectedRoute: User data result:", {
              userData,
              userError,
            });

            if (userError) {
              console.error(
                "ProtectedRoute: Error fetching user data:",
                userError
              );
              // If there's an error fetching user data, still allow access but log it
              setUser({
                id: session.user.id,
                email: session.user.email || "",
                role: "super_admin", // Fallback role
              });
            } else if (!userData) {
              console.log(
                "ProtectedRoute: No user data found, using fallback role"
              );
              setUser({
                id: session.user.id,
                email: session.user.email || "",
                role: "super_admin", // Fallback role
              });
            } else {
              console.log("ProtectedRoute: User data found:", userData);
              setUser({
                id: session.user.id,
                email: session.user.email || "",
                role: (userData?.roles as any)?.name || "super_admin", // Fallback role
              });
            }
          } catch (dbError) {
            console.error("ProtectedRoute: Database error:", dbError);
            // If database query fails, still allow access with fallback role
            setUser({
              id: session.user.id,
              email: session.user.email || "",
              role: "super_admin", // Fallback role
            });
          }
        } else {
          console.log("ProtectedRoute: No session found");
        }
      } catch (error) {
        console.error("ProtectedRoute: Error checking session:", error);
      } finally {
        console.log("ProtectedRoute: Setting loading to false");
        setLoading(false);
        clearTimeout(timeoutId); // Clear the timeout
      }
    };

    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        "ProtectedRoute: Auth state change:",
        event,
        session?.user?.email
      );

      if (event === "SIGNED_IN" && session?.user) {
        try {
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
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (userError) {
            console.error(
              "ProtectedRoute: Error fetching user data on sign in:",
              userError
            );
            setUser({
              id: session.user.id,
              email: session.user.email || "",
              role: "super_admin", // Fallback role
            });
          } else {
            setUser({
              id: session.user.id,
              email: session.user.email || "",
              role: (userData?.roles as any)?.name || "super_admin", // Fallback role
            });
          }
        } catch (error) {
          console.error(
            "ProtectedRoute: Error fetching user data on sign in:",
            error
          );
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            role: "super_admin", // Fallback role
          });
        }
      } else if (event === "SIGNED_OUT") {
        console.log("ProtectedRoute: User signed out");
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
          <p className="text-sm text-gray-500 mt-2">
            Check browser console for debug info
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
