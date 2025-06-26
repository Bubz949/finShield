import { Shield, Settings, HelpCircle, Building2, BarChart3, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link, useLocation } from "wouter";

interface HeaderProps {
  user: {
    fullName: string;
  };
}

function NavLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  const [location] = useLocation();
  const isActive = location === href;
  
  return (
    <Link href={href}>
      <Button
        variant={isActive ? "default" : "ghost"}
        className={`flex items-center gap-2 ${isActive ? "bg-blue-600 text-white" : "text-gray-600 hover:text-blue-600"}`}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Button>
    </Link>
  );
}

export default function Header({ user }: HeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/auth";
  };

  return (
    <header className="bg-white shadow-sm border-b-2 border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Shield className="text-blue-600 h-8 w-8 mr-3" />
            <h1 className="text-2xl md:text-3xl font-bold text-blue-600">Nuvanta</h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <NavLink href="/dashboard" icon={BarChart3} label="Dashboard" />
            <NavLink href="/connect-bank" icon={Building2} label="Connect Bank" />
            <NavLink href="/transactions" icon={CreditCard} label="Transactions" />
          </nav>
          
          <div className="flex items-center space-x-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/settings">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="p-3 text-gray-600 hover:text-blue-600 border-2 border-gray-300 rounded-lg"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings & Preferences</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="p-3 text-gray-600 hover:text-blue-600 border-2 border-gray-300 rounded-lg"
                >
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Help & Support</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {getInitials(user.fullName)}
                </span>
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-medium block">
                  {user.fullName}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-xs text-gray-500 hover:text-red-600 p-0 h-auto"
                >
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
