import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, Phone, Mail, Shield, CheckCircle, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Transaction, FamilyMember } from "@shared/schema";

interface TransactionReviewDialogProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  familyMembers?: FamilyMember[];
  account?: any;
}

export default function TransactionReviewDialog({ 
  transaction, 
  isOpen, 
  onClose, 
  familyMembers = [],
  account 
}: TransactionReviewDialogProps) {
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [selectedFamilyMembers, setSelectedFamilyMembers] = useState<number[]>([]);
  const [notes, setNotes] = useState("");
  const [bankActions, setBankActions] = useState<any>(null);
  const { toast } = useToast();

  const reviewMutation = useMutation({
    mutationFn: async ({ action, data }: { action: string; data: any }) => {
      if (action === "approve" || action === "ignore") {
        return apiRequest("PATCH", `/api/transactions/${transaction?.id}/review`, { 
          reviewStatus: action === "approve" ? "approved" : "ignored",
          notes 
        });
      } else if (action === "escalate_family") {
        // Create alert for family members
        const alertPromises = selectedFamilyMembers.map(memberId =>
          apiRequest("POST", "/api/alerts", {
            userId: 1, // Demo user ID
            transactionId: transaction?.id,
            alertType: "family_escalation",
            severity: "high",
            title: "Transaction Review Request",
            description: `${familyMembers.find(m => m.id === memberId)?.name} has been asked to review a suspicious transaction: ${transaction?.merchant} for ${transaction?.amount}`,
            notes
          })
        );
        await Promise.all(alertPromises);
        
        // Send notifications to family members (simulated)
        return { success: true, action: "family_notified" };
      } else if (action === "escalate_bank") {
        // Get bank actions and contact details
        const response = await apiRequest("POST", "/api/bank-actions", {
          transactionId: transaction?.id,
          notes
        });
        setBankActions(response);
        return response;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/1"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/1"] });
      
      if (variables.action === "approve") {
        toast({
          title: "Transaction Approved",
          description: "This transaction has been marked as safe and approved.",
        });
      } else if (variables.action === "ignore") {
        toast({
          title: "Transaction Ignored",
          description: "This transaction will no longer appear as flagged.",
        });
      } else if (variables.action === "escalate_family") {
        toast({
          title: "Family Members Notified",
          description: `${selectedFamilyMembers.length} family member(s) have been notified about this transaction.`,
        });
      } else if (variables.action === "escalate_bank") {
        toast({
          title: "Bank Actions Retrieved",
          description: "Bank contact details and recommended actions have been provided.",
        });
      }
      
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process transaction review",
        variant: "destructive",
      });
    }
  });

  const handleClose = () => {
    setSelectedAction("");
    setSelectedFamilyMembers([]);
    setNotes("");
    setBankActions(null);
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedAction) return;
    
    reviewMutation.mutate({ 
      action: selectedAction, 
      data: { 
        familyMembers: selectedFamilyMembers, 
        notes 
      } 
    });
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(num));
  };

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center">
            <AlertTriangle className="h-6 w-6 mr-2 text-red-600" />
            Review Suspicious Transaction
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Transaction Summary */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-xl text-red-700">Transaction Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-lg font-medium">Merchant</p>
                  <p className="text-lg">{transaction.merchant}</p>
                </div>
                <div>
                  <p className="text-lg font-medium">Amount</p>
                  <p className="text-xl font-bold text-red-600">-{formatAmount(transaction.amount)}</p>
                </div>
                <div>
                  <p className="text-lg font-medium">Risk Score</p>
                  <p className="text-lg font-bold text-red-600">{transaction.suspiciousScore}% Suspicious</p>
                </div>
                <div>
                  <p className="text-lg font-medium">Date</p>
                  <p className="text-lg">{new Date(transaction.transactionDate).toLocaleDateString()}</p>
                </div>
              </div>
              {transaction.description && (
                <div className="mt-4">
                  <p className="text-lg font-medium">Description</p>
                  <p className="text-lg">{transaction.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Review Options */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">How would you like to handle this transaction?</h3>
            
            <div className="grid gap-4">
              {/* Approve Transaction */}
              <Card 
                className={`cursor-pointer border-2 transition-colors ${
                  selectedAction === "approve" ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-green-300"
                }`}
                onClick={() => setSelectedAction("approve")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="text-lg font-semibold">Approve Transaction</p>
                      <p className="text-lg text-gray-600">This is a legitimate transaction I recognize</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ignore Transaction */}
              <Card 
                className={`cursor-pointer border-2 transition-colors ${
                  selectedAction === "ignore" ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                }`}
                onClick={() => setSelectedAction("ignore")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <X className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="text-lg font-semibold">Ignore This Alert</p>
                      <p className="text-lg text-gray-600">Stop showing alerts for this transaction</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Escalate to Family */}
              {familyMembers.length > 0 && (
                <Card 
                  className={`cursor-pointer border-2 transition-colors ${
                    selectedAction === "escalate_family" ? "border-orange-600 bg-orange-50" : "border-gray-200 hover:border-orange-300"
                  }`}
                  onClick={() => setSelectedAction("escalate_family")}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-6 w-6 text-orange-600" />
                      <div>
                        <p className="text-lg font-semibold">Ask Family for Help</p>
                        <p className="text-lg text-gray-600">Send this transaction to trusted family members for review</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Escalate to Bank */}
              <Card 
                className={`cursor-pointer border-2 transition-colors ${
                  selectedAction === "escalate_bank" ? "border-red-600 bg-red-50" : "border-gray-200 hover:border-red-300"
                }`}
                onClick={() => setSelectedAction("escalate_bank")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-6 w-6 text-red-600" />
                    <div>
                      <p className="text-lg font-semibold">Get Bank Actions</p>
                      <p className="text-lg text-gray-600">Get specific contact details and recommended actions for your bank</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Family Member Selection */}
          {selectedAction === "escalate_family" && familyMembers.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-lg font-semibold">Select family members to notify:</h4>
              {familyMembers.map((member) => (
                <div key={member.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <Checkbox
                    checked={selectedFamilyMembers.includes(member.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedFamilyMembers([...selectedFamilyMembers, member.id]);
                      } else {
                        setSelectedFamilyMembers(selectedFamilyMembers.filter(id => id !== member.id));
                      }
                    }}
                  />
                  <div>
                    <p className="text-lg font-medium">{member.name}</p>
                    <p className="text-lg text-gray-600">{member.relationship} • {member.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bank Actions Information */}
          {bankActions && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-xl text-blue-700 flex items-center">
                  <Shield className="h-6 w-6 mr-2" />
                  {bankActions.bankInfo.name} - Fraud Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Phone className="h-5 w-5 text-red-600" />
                    <p className="text-lg font-semibold text-red-700">Fraud Hotline</p>
                  </div>
                  <p className="text-xl font-bold text-red-800">{bankActions.bankInfo.fraudHotline}</p>
                  <p className="text-sm text-red-600">Call immediately to report fraud</p>
                </div>
                
                <div>
                  <p className="text-lg font-semibold mb-3">Recommended Actions (in order):</p>
                  <div className="space-y-3">
                    {bankActions.recommendedActions.map((action: any, index: number) => (
                      <div key={index} className={`p-3 rounded-lg border ${
                        action.urgent ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                      }`}>
                        <div className="flex items-start space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                            action.urgent ? 'bg-red-600 text-white' : 'bg-gray-600 text-white'
                          }`}>
                            {action.priority}
                          </div>
                          <div>
                            <p className="font-semibold">{action.action}</p>
                            <p className="text-sm text-gray-600">{action.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {bankActions.bankInfo.website && (
                  <div className="pt-3 border-t">
                    <a 
                      href={bankActions.bankInfo.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Report Online</span>
                    </a>
                  </div>
                )}
                
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                  <p className="text-sm font-semibold text-yellow-800">Transaction Reference:</p>
                  <p className="text-sm text-yellow-700">TXN-{transaction?.id} | {bankActions.transactionDetails.merchant} | {bankActions.transactionDetails.amount}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes Section */}
          {selectedAction && (
            <div>
              <label className="block text-lg font-medium mb-2">
                Additional Notes (Optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional information about this transaction..."
                className="text-lg p-3"
                rows={3}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4 border-t">
            <Button
              onClick={handleSubmit}
              disabled={!selectedAction || reviewMutation.isPending || 
                (selectedAction === "escalate_family" && selectedFamilyMembers.length === 0)}
              className="flex-1 text-lg py-3"
            >
              {reviewMutation.isPending ? "Processing..." : "Submit Review"}
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 text-lg py-3"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}