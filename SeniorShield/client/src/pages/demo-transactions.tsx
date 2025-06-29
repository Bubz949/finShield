import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import DemoHeader from "@/components/demo-header";
import Footer from "@/components/footer";
import LoadingSpinner from "@/components/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DemoTransactions() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: demoData, isLoading, refetch } = useQuery({
    queryKey: ["/api/demo"],
    queryFn: async () => {
      const response = await fetch("/api/demo");
      if (!response.ok) throw new Error("Failed to fetch demo data");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading demo transactions..." />
      </div>
    );
  }

  const transactions = demoData?.transactions || [];
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.merchant.toLowerCase().includes(search.toLowerCase()) || 
                         t.category.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || 
                         (filter === "flagged" && t.isFlagged) ||
                         (filter === "high" && t.suspiciousScore > 90) ||
                         (filter === "medium" && t.suspiciousScore > 70 && t.suspiciousScore <= 90) ||
                         (filter === "low" && t.suspiciousScore <= 70);
    return matchesSearch && matchesFilter;
  });

  const getRiskColor = (score) => {
    if (score > 90) return "bg-red-100 text-red-800";
    if (score > 70) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getStatusColor = (status) => {
    if (status === "blocked") return "bg-red-100 text-red-800";
    if (status === "pending") return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="bg-blue-600 text-white text-center py-2 text-sm">
        <span className="font-semibold">DEMO MODE</span> - Transaction Analysis Preview
        <button onClick={() => refetch()} className="ml-4 bg-blue-700 px-3 py-1 rounded text-xs hover:bg-blue-800">
          Generate New Data
        </button>
      </div>
      
      <DemoHeader user={{ fullName: "Demo User - Investor Preview" }} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction Analysis</h1>
          <p className="text-gray-600">AI-powered fraud detection and transaction monitoring</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Filter by risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="flagged">Flagged Only</SelectItem>
              <SelectItem value="high">High Risk (90+)</SelectItem>
              <SelectItem value="medium">Medium Risk (70-90)</SelectItem>
              <SelectItem value="low">Low Risk (0-70)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Merchant</th>
                    <th className="text-left p-3">Category</th>
                    <th className="text-left p-3">Amount</th>
                    <th className="text-left p-3">Risk Score</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.slice(0, 50).map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{new Date(transaction.transactionDate).toLocaleDateString()}</td>
                      <td className="p-3 font-medium">{transaction.merchant}</td>
                      <td className="p-3">{transaction.category}</td>
                      <td className="p-3 font-mono">${Math.abs(transaction.amount).toFixed(2)}</td>
                      <td className="p-3">
                        <Badge className={getRiskColor(transaction.suspiciousScore)}>
                          {transaction.suspiciousScore}/100
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={getStatusColor(transaction.reviewStatus)}>
                          {transaction.reviewStatus}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}