import { useState } from "react";
import Navigation from "./navigation";
import { Bell, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-backgroundLight">
      {/* App Bar */}
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-primary-foreground hover:bg-primary-dark"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              data-testid="button-menu-toggle"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-dark rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold">🍽️</span>
              </div>
              <h1 className="text-xl font-medium">FoodCast AI</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="relative text-primary-foreground hover:bg-primary-dark"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-error text-xs rounded-full h-4 w-4 flex items-center justify-center text-white">
                3
              </span>
            </Button>
            <div className="w-8 h-8 bg-primary-dark rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">JD</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Navigation Sidebar */}
        <Navigation isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            data-testid="overlay-sidebar"
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-0 overflow-auto">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
