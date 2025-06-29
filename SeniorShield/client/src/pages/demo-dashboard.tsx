import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import AlertBanner from "@/components/alert-banner";
import QuickStats from "@/components/quick-stats";
import AccountOverview from "@/components/account-overview";
import RecentTransactions from "@/components/recent-transactions";
import SpendingChart from "@/components/spending-chart";
import AlertCenter from "@/components/alert-center";
import FamilyConnections from "@/components/family-connections";
import EducationalTips from "@/components/educational-tips";
import Footer from "@/components/footer";
import LoadingSpinner from "@/components/loading-spinner";
import Chatbot from "@/components/chatbot";

export default function DemoDashboard() {
  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/demo-dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/demo-dashboard");
      if (!response.ok) {
        throw new Error("Failed to fetch demo dashboard data");
      }
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute for demo
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading demo dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600">Demo unavailable. Please try again.</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">No demo data available.</p>
        </div>
      </div>
    );
  }

  const {
    user,
    accounts,
    recentTransactions,
    alerts,
    familyMembers,
    stats,
    spendingByCategory
  } = dashboardData;

  // Find high-priority alerts for banner
  const highPriorityAlert = alerts.find((alert: any) => alert.severity === "high");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Demo Banner */}
      <div className="bg-blue-600 text-white text-center py-2 text-sm">
        <span className="font-semibold">DEMO MODE</span> - Live AI/ML Fraud Detection Preview
        <button 
          onClick={() => refetch()} 
          className="ml-4 bg-blue-700 px-3 py-1 rounded text-xs hover:bg-blue-800"
        >
          Generate New Data
        </button>
      </div>
      
      <Header user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {highPriorityAlert && <AlertBanner alert={highPriorityAlert} />}
        
        <QuickStats stats={stats} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <AccountOverview accounts={accounts} />
            <RecentTransactions transactions={recentTransactions} />
            <SpendingChart spendingData={spendingByCategory} />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <AlertCenter alerts={alerts} allAlerts={alerts} />
            <FamilyConnections familyMembers={familyMembers} />
            <EducationalTips />
          </div>
        </div>
      </div>

      <Footer />
      <Chatbot />
    </div>
  );
}