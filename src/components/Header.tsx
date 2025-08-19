import { Bell, Search, Settings, User, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

export function Header() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <header
      className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50"
      role="banner"
    >
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Mobile Menu Button - Hidden on desktop */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden mr-2"
          aria-label="Toggle navigation menu"
          aria-expanded="false"
          aria-controls="sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo/Brand */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">
            <a
              href="/"
              className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
            >
              FollowUp App
            </a>
          </h1>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-4 hidden sm:block">
          <div className="relative">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                isSearchFocused ? "text-primary" : "text-muted-foreground"
              }`}
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search..."
              aria-label="Search"
              className={`w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors ${
                isSearchFocused ? "border-primary" : ""
              }`}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </div>
        </div>

        {/* Mobile Search Button */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          aria-label="Open search"
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Right side actions */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications (3 unread)"
            aria-describedby="notification-count"
          >
            <Bell className="h-5 w-5" />
            <span
              id="notification-count"
              className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full text-xs flex items-center justify-center text-destructive-foreground"
              aria-label="3 unread notifications"
            >
              3
            </span>
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="icon" aria-label="Settings">
            <Settings className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
                aria-label="User menu"
                aria-expanded="false"
                aria-haspopup="true"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src="/placeholder-avatar.jpg"
                    alt="John Doe's profile picture"
                  />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56"
              align="end"
              forceMount
              aria-label="User account menu"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">John Doe</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    john.doe@example.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
