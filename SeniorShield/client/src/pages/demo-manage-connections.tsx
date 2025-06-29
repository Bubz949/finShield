import DemoHeader from "@/components/demo-header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function DemoManageConnections() {
  const demoAccounts = [
    {
      id: 1,
      bankName: "Chase Bank",
      accountName: "Primary Checking",
      accountType: "checking",
      balance: "12,450.00",
      lastSync: "2 minutes ago",
      status: "active"
    },
    {
      id: 2,
      bankName: "Bank of America",
      accountName: "Savings Account",
      accountType: "savings",
      balance: "45,230.00",
      lastSync: "5 minutes ago",
      status: "active"
    },
    {
      id: 3,
      bankName: "Wells Fargo",
      accountName: "Credit Card",
      accountType: "credit",
      balance: "-2,340.00",
      lastSync: "1 hour ago",
      status: "warning"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="bg-blue-600 text-white text-center py-2 text-sm">
        <span className="font-semibold">DEMO MODE</span> - Bank Connection Management Preview
      </div>
      
      <DemoHeader user={{ fullName: "Demo User - Investor Preview" }} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Connected Accounts</h1>
          <p className="text-gray-600">Manage your bank connections and account monitoring</p>
        </div>

        <div className="grid gap-6">
          {demoAccounts.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {account.bankName}
                      <Badge variant={account.status === "active" ? "default" : "destructive"}>
                        {account.status}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{account.accountName} • {account.accountType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">${account.balance}</p>
                    <p className="text-sm text-gray-500">Last sync: {account.lastSync}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Sync Now</Button>
                  <Button variant="outline" size="sm">View Transactions</Button>
                  <Button variant="outline" size="sm">Settings</Button>
                  <Button variant="destructive" size="sm">Disconnect</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Add New Bank Connection</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full sm:w-auto">Connect New Bank Account</Button>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}