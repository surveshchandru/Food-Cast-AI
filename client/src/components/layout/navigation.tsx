import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Brain, 
  Boxes, 
  ChartBar, 
  Upload, 
  Settings 
} from "lucide-react";

interface NavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/predictions", label: "Predictions", icon: Brain },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/analytics", label: "Analytics", icon: ChartBar },
  { href: "/data-input", label: "Data Input", icon: Upload },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Navigation({ isOpen, onClose }: NavigationProps) {
  const [location] = useLocation();

  return (
    <aside
      className={cn(
        "w-64 bg-surface shadow-md transform transition-transform duration-300 ease-in-out fixed lg:relative h-full z-40",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
          
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg transition-all",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-gray-100 text-onSurfaceSecondary hover:text-onSurface"
                )}
                onClick={onClose}
                data-testid={`link-${item.label.toLowerCase().replace(" ", "-")}`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>
      
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-secondary/10 rounded-lg p-3">
          <p className="text-xs text-onSurfaceSecondary mb-1">Model Accuracy</p>
          <p className="text-lg font-medium text-secondary" data-testid="text-model-accuracy">
            94.2%
          </p>
        </div>
      </div>
    </aside>
  );
}
