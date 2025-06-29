import { Shield, Settings, Building2, BarChart3, CreditCard, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";

interface DemoHeaderProps {
  user: {
    fullName: string;
  };
}

function DemoNavLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  const [location] = useLocation();
  const isActive = location === href;
  
  return (
    <Link href={href}>
      <Button
        variant={isActive ? "default" : "ghost"}
        className={`flex items-center gap-2 transition-all duration-200 ${isActive ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"}`}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Button>
    </Link>
  );
}

export default function DemoHeader({ user }: DemoHeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <div className="relative">
              <Shield className="text-blue-600 h-8 w-8 mr-3" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse"></div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">FinShield</h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-4">
            <DemoNavLink href="/demo" icon={BarChart3} label="Dashboard" />
            <DemoNavLink href="/demo/transactions" icon={CreditCard} label="Transactions" />
            <DemoNavLink href="/demo/manage-connections" icon={Building2} label="Accounts" />
            <DemoNavLink href="/demo/settings" icon={Settings} label="Settings" />
            <DemoNavLink href="/demo/email" icon={Mail} label="Email Preview" />
          </nav>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-semibold text-lg">
                {getInitials(user.fullName)}
              </span>
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-medium block">
                {user.fullName}
              </span>
              <span className="text-xs text-blue-600 font-medium">DEMO MODE</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}