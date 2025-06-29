import DemoHeader from "@/components/demo-header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DemoSettings() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="bg-blue-600 text-white text-center py-2 text-sm">
        <span className="font-semibold">DEMO MODE</span> - Settings & Notifications Preview
      </div>
      
      <DemoHeader user={{ fullName: "Demo User - Investor Preview" }} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account preferences and security settings</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>High-Risk Transaction Alerts</Label>
                  <p className="text-sm text-gray-600">Get notified immediately for transactions with 90+ risk score</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Daily Summary Emails</Label>
                  <p className="text-sm text-gray-600">Receive daily reports of your account activity</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Family Member Notifications</Label>
                  <p className="text-sm text-gray-600">Allow family members to receive alerts about your account</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>SMS Alerts</Label>
                  <p className="text-sm text-gray-600">Receive text messages for urgent alerts</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Thresholds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>High Risk Threshold (Auto-block transactions above this score)</Label>
                <Input type="number" defaultValue="95" className="mt-1" />
              </div>
              <div>
                <Label>Medium Risk Threshold (Flag for review above this score)</Label>
                <Input type="number" defaultValue="70" className="mt-1" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Email Address</Label>
                <Input defaultValue="demo@finshield.com" className="mt-1" />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input defaultValue="+1 (555) 123-4567" className="mt-1" />
              </div>
              <div>
                <Label>Emergency Contact</Label>
                <Input defaultValue="Sarah Johnson - (555) 987-6543" className="mt-1" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button variant="outline">Change Password</Button>
              <Button variant="outline">Download Security Report</Button>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button>Save Changes</Button>
            <Button variant="outline">Reset to Defaults</Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}