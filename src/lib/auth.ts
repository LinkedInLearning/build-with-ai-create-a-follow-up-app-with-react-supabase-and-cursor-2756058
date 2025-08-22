import { supabase, logAuditEvent } from "./supabase";

export interface User {
  id: string;
  email: string;
  role?: string;
}

// Check if current user is an admin (super_admin or sub_admin)
export const isAdmin = async (): Promise<boolean> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return false;
    }

    const { data: userData } = await supabase
      .from("users")
      .select(
        `
        role_id,
        roles (
          name
        )
      `
      )
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!userData?.roles) {
      return false;
    }

    const roleName = (userData.roles as any)?.name;
    return roleName === "super_admin" || roleName === "sub_admin";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

// Check if current user is a super admin
export const isSuperAdmin = async (): Promise<boolean> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return false;
    }

    const { data: userData } = await supabase
      .from("users")
      .select(
        `
        role_id,
        roles (
          name
        )
      `
      )
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!userData?.roles) {
      return false;
    }

    const roleName = (userData.roles as any)?.name;
    return roleName === "super_admin";
  } catch (error) {
    console.error("Error checking super admin status:", error);
    return false;
  }
};

// Get current user with role
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return null;
    }

    const { data: userData } = await supabase
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

    if (!userData) {
      return {
        id: session.user.id,
        email: session.user.email || "",
        role: "super_admin", // Fallback role
      };
    }

    return {
      id: session.user.id,
      email: session.user.email || "",
      role: (userData.roles as any)?.name || "super_admin",
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

// Log login event
export const logLoginEvent = async () => {
  try {
    const user = await getCurrentUser();
    if (user) {
      await logAuditEvent("login", "auth", undefined, {
        user_email: user.email,
        user_role: user.role,
        login_time: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error logging login event:", error);
  }
};

// Log logout event
export const logLogoutEvent = async () => {
  try {
    const user = await getCurrentUser();
    if (user) {
      await logAuditEvent("logout", "auth", undefined, {
        user_email: user.email,
        user_role: user.role,
        logout_time: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error logging logout event:", error);
  }
};
