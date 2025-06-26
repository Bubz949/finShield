import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, RefreshCw, Trash2, Building2 } from "lucide-react";
import Header from "@/components/header";

interface Account {
  id: number;
  accountName: string;
  accountType: string;
  balance: number;
  yodleeProviderName?: string;
  yodleeLastUpdate?: string;
}

export default function ConnectBank() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    }
  };

  const connectBank = async () => {
    setIsConnecting(true);
    try {
      const token = localStorage.getItem("token");
      
      // Get FastLink token
      const tokenResponse = await fetch("/api/yodlee/fastlink-token", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to get FastLink token");
      }

      const { token: fastLinkToken } = await tokenResponse.json();

      // Open Yodlee FastLink in a popup
      const popup = window.open(
        `https://node.sandbox.yodlee.com/authenticate/restserver/fastlink?channelAppName=sandbox&rsession=${fastLinkToken}`,
        "yodlee-fastlink",
        "width=800,height=600,scrollbars=yes,resizable=yes"
      );

      // Listen for popup close
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          syncAccounts();
        }
      }, 1000);

    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Failed to connect to bank. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const syncAccounts = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/yodlee/sync-accounts", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const updatedAccounts = await response.json();
        setAccounts(updatedAccounts);
        toast({
          title: "Accounts synced",
          description: "Your bank accounts have been updated.",
        });
      } else {
        throw new Error("Sync failed");
      }
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Failed to sync accounts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAccount = async (accountId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/yodlee/refresh-account/${accountId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast({
          title: "Refresh initiated",
          description: "Account data refresh has been started.",
        });
      }
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh account data.",
        variant: "destructive",
      });
    }
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(balance);
  };

  const getAccountTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "checking":
        return "bg-blue-100 text-blue-800";
      case "savings":
        return "bg-green-100 text-green-800";
      case "credit":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get user data for header
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Header user={user} />}
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bank Connections
          </h1>
          <p className="text-gray-600">
            Connect your bank accounts to enable fraud monitoring and financial insights.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Connection Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Connect New Bank
              </CardTitle>
              <CardDescription>
                Securely connect your bank accounts through our trusted partner Yodlee.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={connectBank}
                  disabled={isConnecting}
                  className="flex items-center gap-2"
                >
                  {isConnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {isConnecting ? "Connecting..." : "Connect Bank Account"}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={syncAccounts}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Sync Accounts
                </Button>
              </div>
              
              <div className="text-sm text-gray-500">
                <p>• Your banking credentials are encrypted and secure</p>
                <p>• We use bank-level security to protect your data</p>
                <p>• You can disconnect accounts at any time</p>
              </div>
            </CardContent>
          </Card>

          {/* Connected Accounts */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts ({accounts.length})</CardTitle>
              <CardDescription>
                Manage your connected bank accounts and their settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No accounts connected</p>
                  <p>Connect your first bank account to get started with fraud monitoring.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {accounts.map((account) => (
                    <div key={account.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{account.accountName}</h3>
                            <p className="text-sm text-gray-500">
                              {account.yodleeProviderName || "Bank"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">
                            {formatBalance(account.balance)}
                          </p>
                          <Badge className={getAccountTypeColor(account.accountType)}>
                            {account.accountType}
                          </Badge>
                        </div>
                      </div>
                      
                      <Separator className="my-3" />
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {account.yodleeLastUpdate && (
                            <p>
                              Last updated: {new Date(account.yodleeLastUpdate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refreshAccount(account.id)}
                            className="flex items-center gap-1"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Refresh
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Information */}
          <Card>
            <CardHeader>
              <CardTitle>Security & Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <p>• We use 256-bit SSL encryption to protect your data</p>
              <p>• Your banking credentials are never stored on our servers</p>
              <p>• All connections use read-only access to your accounts</p>
              <p>• You can revoke access at any time through your bank's website</p>
              <p>• We comply with all banking regulations and security standards</p>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </div>
  );
}