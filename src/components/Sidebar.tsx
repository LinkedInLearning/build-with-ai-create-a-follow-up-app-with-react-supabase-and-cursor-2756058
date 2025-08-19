import {
  Home,
  Users,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const sidebarItems = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/dashboard",
    isActive: true,
    description: "View your dashboard and overview",
  },
  {
    title: "Contacts",
    icon: Users,
    href: "/contacts",
    isActive: false,
    description: "Manage your contacts",
  },
  {
    title: "Calendar",
    icon: Calendar,
    href: "/calendar",
    isActive: false,
    description: "View and manage your calendar",
  },
  {
    title: "Documents",
    icon: FileText,
    href: "/documents",
    isActive: false,
    description: "Access your documents",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    href: "/analytics",
    isActive: false,
    description: "View analytics and reports",
  },
];

const bottomItems = [
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
    isActive: false,
    description: "Configure application settings",
  },
  {
    title: "Help",
    icon: HelpCircle,
    href: "/help",
    isActive: false,
    description: "Get help and support",
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      id="sidebar"
      className={cn(
        "flex flex-col border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        "hidden md:flex" // Hide on mobile, show on desktop
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Sidebar Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!collapsed && <h2 className="text-lg font-semibold">Navigation</h2>}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          aria-controls="sidebar"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2 py-4" aria-label="Primary navigation">
        <ul className="space-y-1" role="list">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href} role="listitem">
                <Button
                  variant={item.isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-10",
                    collapsed && "px-2"
                  )}
                  aria-label={collapsed ? item.title : undefined}
                  aria-describedby={collapsed ? undefined : `${item.href}-desc`}
                  aria-current={item.isActive ? "page" : undefined}
                >
                  <Icon
                    className={cn("h-5 w-5", !collapsed && "mr-3")}
                    aria-hidden="true"
                  />
                  {!collapsed && (
                    <>
                      <span>{item.title}</span>
                      <span id={`${item.href}-desc`} className="sr-only">
                        {item.description}
                      </span>
                    </>
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div
        className="px-2 py-4 border-t"
        role="navigation"
        aria-label="Secondary navigation"
      >
        <ul className="space-y-1" role="list">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href} role="listitem">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-10",
                    collapsed && "px-2"
                  )}
                  aria-label={collapsed ? item.title : undefined}
                  aria-describedby={collapsed ? undefined : `${item.href}-desc`}
                >
                  <Icon
                    className={cn("h-5 w-5", !collapsed && "mr-3")}
                    aria-hidden="true"
                  />
                  {!collapsed && (
                    <>
                      <span>{item.title}</span>
                      <span id={`${item.href}-desc`} className="sr-only">
                        {item.description}
                      </span>
                    </>
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
