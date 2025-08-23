import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { LogOut, Users, BarChart3, Settings, Home, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { logLogoutEvent } from "@/lib/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  // SidebarHeaderDescription,
  SidebarHeaderTitle,
  SidebarNav,
  SidebarNavItem,
  // SidebarNavLink,
  SidebarToggle,
} from "@/components/ui/sidebar";

export const SubAdminDashboard: React.FC = () => {
  const location = useLocation();
  // const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSignOut = async () => {
    try {
      // Log logout event before signing out
      await logLogoutEvent();

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Sign out error:", error);
        alert("Sign out failed: " + error.message);
      } else {
        // Force redirect to login page
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Sign out error:", error);
      alert("Sign out failed: " + (error as Error).message);
    }
  };

  const navigation = [
    { name: "Overview", href: "/manager", icon: Home },
    { name: "Leads", href: "/manager/leads", icon: Users },
    { name: "Follow-ups", href: "/manager/followups", icon: Mail },
    { name: "Analytics", href: "/manager/analytics", icon: BarChart3 },
    { name: "Settings", href: "/manager/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        variant={isCollapsed ? "sm" : "default"}
        className="border-r border-gray-200 bg-white shadow-sm"
      >
        <SidebarHeader className="border-b border-gray-200 pb-4">
          <SidebarHeaderTitle className="text-lg font-bold text-gray-900">
            Follow-up App
          </SidebarHeaderTitle>
        </SidebarHeader>

        <SidebarContent className="py-4">
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
              Navigation
            </SidebarGroupLabel>
            <SidebarNav>
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <SidebarNavItem key={item.name}>
                    <Link
                      to={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 transition-colors duration-200 ${
                        isActive
                          ? "bg-green-50 text-green-700 border-r-2 border-green-600"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <item.icon
                        className={`h-5 w-5 ${
                          isActive ? "text-green-600" : "text-gray-500"
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="font-medium">{item.name}</span>
                      )}
                    </Link>
                  </SidebarNavItem>
                );
              })}
            </SidebarNav>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-gray-200 pt-4">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && "Sign Out"}
          </button>
        </SidebarFooter>
      </Sidebar>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarToggle
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="lg:hidden"
              />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Sub-Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Sub-Admin Management Panel
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-sm font-medium">Sub-Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
