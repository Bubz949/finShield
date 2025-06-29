import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function DemoEmail() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-blue-600 text-white text-center py-2 text-sm mb-4 rounded">
          <span className="font-semibold">DEMO MODE</span> - Email Notification Preview
        </div>

        <Card className="mb-6">
          <CardHeader className="bg-red-50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <CardTitle className="text-red-800">🚨 URGENT: Suspicious Transaction Alert</CardTitle>
            </div>
            <p className="text-sm text-gray-600">From: FinShield Security Team &lt;alerts@finshield.com&gt;</p>
            <p className="text-sm text-gray-600">To: demo@finshield.com</p>
            <p className="text-sm text-gray-600">Subject: High-Risk Transaction Detected - Immediate Action Required</p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p>Dear Demo User,</p>
              
              <p>Our AI fraud detection system has identified a <strong>high-risk transaction</strong> on your account that requires immediate attention.</p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">Transaction Details:</h3>
                <ul className="space-y-1 text-sm">
                  <li><strong>Amount:</strong> $2,450.00</li>
                  <li><strong>Merchant:</strong> Unknown Merchant</li>
                  <li><strong>Date:</strong> Today, 2:34 PM</li>
                  <li><strong>Risk Score:</strong> <Badge className="bg-red-200 text-red-800">95/100</Badge></li>
                  <li><strong>Status:</strong> <Badge className="bg-yellow-200 text-yellow-800">BLOCKED</Badge></li>
                </ul>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Why was this flagged?</h3>
                <ul className="text-sm space-y-1">
                  <li>• Unusual merchant not in your spending history</li>
                  <li>• Transaction amount 300% above your average</li>
                  <li>• Location differs from your typical spending pattern</li>
                  <li>• Time of transaction outside normal hours</li>
                </ul>
              </div>
              
              <div className="flex gap-3">
                <Button className="bg-green-600 hover:bg-green-700">✓ I Made This Purchase</Button>
                <Button variant="destructive">⚠️ This is Fraud</Button>
                <Button variant="outline">View Full Details</Button>
              </div>
              
              <div className="border-t pt-4 text-sm text-gray-600">
                <p><strong>Family Notification:</strong> Sarah Johnson has also been notified of this alert.</p>
                <p><strong>Next Steps:</strong> If you didn't make this purchase, we recommend contacting your bank immediately.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-blue-50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <CardTitle className="text-blue-800">📊 Daily Security Summary</CardTitle>
            </div>
            <p className="text-sm text-gray-600">From: FinShield Daily Reports &lt;reports@finshield.com&gt;</p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p>Good morning! Here's your daily account security summary:</p>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">47</div>
                  <div className="text-sm text-gray-600">Safe Transactions</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded">
                  <div className="text-2xl font-bold text-yellow-600">3</div>
                  <div className="text-sm text-gray-600">Flagged for Review</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded">
                  <div className="text-2xl font-bold text-red-600">1</div>
                  <div className="text-sm text-gray-600">Blocked</div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>Your account remains secure. All suspicious activity has been automatically flagged for your review.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}