import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { User, Settings, Bell, Shield, Trash2, Mail, MessageSquare } from "lucide-react";
import Header from "@/components/header";

interface UserProfile {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
}

export default function Settings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    suspicious: true,
    highSpending: true,
    billReminders: true,
    weeklyReports: false,
  });
  const [alertDelivery, setAlertDelivery] = useState({
    suspicious: { email: true, sms: false },
    highSpending: { email: true, sms: false },
    billReminders: { email: true, sms: true },
    weeklyReports: { email: true, sms: false },
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          setProfile(data.user);
          
          // Load alert delivery preferences if they exist
          if (data.user.alertDelivery) {
            const parsed = JSON.parse(data.user.alertDelivery);
            setAlertDelivery(parsed);
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };
    fetchProfile();
  }, []);

  const updateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const updates = {
      fullName: formData.get("fullName") as string,
      email: formData.get("email") as string,
      phoneNumber: formData.get("phoneNumber") as string,
    };

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setProfile(updatedUser);
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
        });
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (response.ok) {
        toast({
          title: "Password changed",
          description: "Your password has been successfully updated.",
        });
        (e.target as HTMLFormElement).reset();
      } else {
        throw new Error("Failed to change password");
      }
    } catch (error) {
      toast({
        title: "Password change failed",
        description: "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateNotifications = async (key: string, value: boolean) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);

    try {
      const token = localStorage.getItem("token");
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });
      
      toast({
        title: "Notifications updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update notifications.",
        variant: "destructive",
      });
    }
  };

  const updateAlertDelivery = async (alertType: string, method: string, enabled: boolean) => {
    try {
      setAlertDelivery(prev => ({
        ...prev,
        [alertType]: { ...prev[alertType as keyof typeof prev], [method]: enabled }
      }));
      
      const token = localStorage.getItem("token");
      const response = await fetch("/api/alert-delivery", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ alertType, method, enabled }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update alert delivery");
      }
      
      toast({
        title: "Delivery method updated",
        description: "Your alert delivery preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update alert delivery method.",
        variant: "destructive",
      });
    }
  };

  const deleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/profile", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        localStorage.removeItem("token");
        window.location.href = "/auth";
      } else {
        throw new Error("Failed to delete account");
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {profile && <Header user={profile} />}
      
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {!profile ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Settings</h1>
                <p className="text-gray-600 text-lg">Manage your account and AI-powered preferences</p>
              </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-white/50 backdrop-blur-lg shadow-lg border-0">
              <TabsTrigger value="profile" className="flex items-center gap-1 text-xs md:text-sm">
                <User className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="situation" className="flex items-center gap-1 text-xs md:text-sm">
                <User className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Situation</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-1 text-xs md:text-sm">
                <Shield className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-1 text-xs md:text-sm">
                <Bell className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Alerts</span>
              </TabsTrigger>
              <TabsTrigger value="account" className="flex items-center gap-1 text-xs md:text-sm">
                <Settings className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Account</span>
              </TabsTrigger>
            </TabsList>

          <TabsContent value="profile">
            <Card className="backdrop-blur-lg bg-white/80 shadow-xl border-0">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={updateProfile} className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          defaultValue={profile.fullName}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          defaultValue={profile.email}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={profile.username}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                          id="phoneNumber"
                          name="phoneNumber"
                          type="tel"
                          defaultValue={profile.phoneNumber || ""}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Updating..." : "Update Profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="situation">
            <Card className="backdrop-blur-lg bg-white/80 shadow-xl border-0">
              <CardHeader>
                <CardTitle>Update Your Situation</CardTitle>
                <CardDescription>
                  Retake the profile questionnaire to improve fraud detection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Your living situation and spending habits help us provide better fraud protection. 
                  Update your profile if your circumstances have changed.
                </p>
                <Button 
                  onClick={() => window.location.href = "/profile-setup"}
                  className="w-full"
                >
                  Update My Situation Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="backdrop-blur-lg bg-white/80 shadow-xl border-0">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={changePassword} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Changing..." : "Change Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="backdrop-blur-lg bg-white/80 shadow-xl border-0">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { key: 'suspicious', label: 'Suspicious Activity Alerts', desc: 'Get notified when suspicious transactions are detected' },
                  { key: 'highSpending', label: 'High Spending Alerts', desc: 'Get notified when spending exceeds normal patterns' },
                  { key: 'billReminders', label: 'Bill Reminders', desc: 'Get reminded about upcoming bill payments' },
                  { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Receive weekly spending and security reports' }
                ].map((alert, index) => (
                  <div key={alert.key}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>{alert.label}</Label>
                          <p className="text-sm text-gray-500">{alert.desc}</p>
                        </div>
                        <Switch
                          checked={notifications[alert.key as keyof typeof notifications]}
                          onCheckedChange={(checked) => updateNotifications(alert.key, checked)}
                        />
                      </div>
                      
                      {notifications[alert.key as keyof typeof notifications] && (
                        <div className="ml-4 p-4 bg-gray-50 rounded-lg">
                          <Label className="text-sm font-medium mb-3 block">Delivery Methods</Label>
                          <div className="flex gap-6">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`${alert.key}-email`}
                                checked={alertDelivery[alert.key as keyof typeof alertDelivery]?.email}
                                onCheckedChange={(checked) => updateAlertDelivery(alert.key, 'email', checked as boolean)}
                              />
                              <Label htmlFor={`${alert.key}-email`} className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4" />
                                Email
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`${alert.key}-sms`}
                                checked={alertDelivery[alert.key as keyof typeof alertDelivery]?.sms}
                                onCheckedChange={(checked) => updateAlertDelivery(alert.key, 'sms', checked as boolean)}
                              />
                              <Label htmlFor={`${alert.key}-sms`} className="flex items-center gap-2 text-sm">
                                <MessageSquare className="h-4 w-4" />
                                SMS
                              </Label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {index < 3 && <Separator className="my-6" />}
                  </div>
                ))}

              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <Card className="backdrop-blur-lg bg-white/80 shadow-xl border-0">
              <CardHeader>
                <CardTitle>Account Management</CardTitle>
                <CardDescription>
                  Manage your account settings and data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-red-900">Delete Account</h3>
                      <p className="text-sm text-red-700 mt-1">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="mt-3"
                        onClick={deleteAccount}
                      >
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </div>
  );
}