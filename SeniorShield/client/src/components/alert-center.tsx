import { Bell, AlertTriangle, Info, ExternalLink, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";

interface Alert {
  id: number;
  title: string;
  description: string;
  severity: string;
  createdAt: string;
}

interface AlertCenterProps {
  alerts: Alert[];
  allAlerts?: Alert[];
}

export default function AlertCenter({ alerts, allAlerts = [] }: AlertCenterProps) {
  const getAlertIcon = (severity: string) => {
    return severity === "high" ? AlertTriangle : Info;
  };

  const getAlertStyle = (severity: string) => {
    switch (severity) {
      case "high":
        return {
          container: "border-red-600 bg-red-50",
          icon: "text-red-600",
          title: "text-red-600"
        };
      case "medium":
        return {
          container: "border-orange-600 bg-orange-50",
          icon: "text-orange-600",
          title: "text-orange-600"
        };
      default:
        return {
          container: "border-blue-600 bg-blue-50",
          icon: "text-blue-600",
          title: "text-blue-600"
        };
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) {
      return "Less than an hour ago";
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return "Yesterday";
    } else {
      return `${diffDays} days ago`;
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-200">
      <h2 className="text-xl md:text-2xl font-semibold mb-6 flex items-center">
        <Bell className="text-orange-600 mr-3 h-6 w-6" />
        Alert Center
      </h2>
      
      <div className="space-y-4 mb-6">
        {alerts.slice(0, 3).map((alert) => {
          const AlertIcon = getAlertIcon(alert.severity);
          const style = getAlertStyle(alert.severity);
          
          return (
            <div
              key={alert.id}
              className={`p-4 border-2 rounded-lg ${style.container}`}
            >
              <div className="flex items-start">
                <AlertIcon className={`h-6 w-6 mr-3 mt-1 ${style.icon}`} />
                <div className="flex-1">
                  <p className={`font-semibold text-lg ${style.title}`}>{alert.title}</p>
                  <p className="text-gray-700 mt-1 text-lg">{alert.description}</p>
                  <p className="text-gray-600 mt-2 text-lg">{formatTimeAgo(alert.createdAt)}</p>
                </div>
              </div>
            </div>
          );
        })}
        
        {alerts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-lg text-gray-600">No active alerts</p>
          </div>
        )}
      </div>
      
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
            View All Alerts ({allAlerts.length})
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Bell className="h-6 w-6 text-orange-600" />
              All Security Alerts
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] pr-4">
            {allAlerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <p className="text-lg text-gray-600">No alerts - your account is secure!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allAlerts.map((alert) => {
                  const AlertIcon = getAlertIcon(alert.severity);
                  const style = getAlertStyle(alert.severity);
                  
                  return (
                    <div key={alert.id} className={`p-4 border-2 rounded-lg ${style.container}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <AlertIcon className={`h-6 w-6 mr-3 mt-1 ${style.icon}`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`font-semibold text-lg ${style.title}`}>{alert.title}</p>
                              <Badge variant="outline" className="text-xs uppercase">
                                {alert.severity}
                              </Badge>
                            </div>
                            <p className="text-gray-700 mt-1">{alert.description}</p>
                            <p className="text-gray-600 mt-2 text-sm">{formatTimeAgo(alert.createdAt)}</p>
                          </div>
                        </div>
                        
                        <Link href="/transactions">
                          <Button size="sm" variant="outline" className="flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
