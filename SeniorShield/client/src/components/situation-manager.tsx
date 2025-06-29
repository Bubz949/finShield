import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Heart, Home, Clock } from "lucide-react";

interface Situation {
  id: number;
  situationType: string;
  description: string;
  startDate: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  isActive: boolean;
  reminderFrequency: number;
  lastReminderSent?: string;
}

export default function SituationManager() {
  const [situations, setSituations] = useState<Situation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSituations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/situations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSituations(data);
      }
    } catch (error) {
      console.error("Failed to fetch situations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const endSituation = async (situationId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/situations/${situationId}/end`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        toast({
          title: "Situation ended",
          description: "Your situation has been marked as completed. The AI will adjust accordingly.",
        });
        fetchSituations();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to end situation. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSituations();
  }, []);

  const getSituationIcon = (type: string) => {
    switch (type) {
      case 'hospital': return <Heart className="h-4 w-4" />;
      case 'travel': return <MapPin className="h-4 w-4" />;
      case 'recovery': return <Home className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getSituationColor = (type: string) => {
    switch (type) {
      case 'hospital': return 'bg-red-100 text-red-800';
      case 'travel': return 'bg-blue-100 text-blue-800';
      case 'recovery': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysSince = (dateString: string) => {
    const days = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Life Situations</CardTitle>
          <CardDescription>Loading your current situations...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeSituations = situations.filter(s => s.isActive);
  const pastSituations = situations.filter(s => !s.isActive);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Active Situations
          </CardTitle>
          <CardDescription>
            Current life situations that affect your spending patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeSituations.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No active situations. Tell the AI chatbot about any life changes like hospital stays, travel, or recovery periods.
            </p>
          ) : (
            <div className="space-y-4">
              {activeSituations.map((situation) => (
                <div key={situation.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getSituationIcon(situation.situationType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getSituationColor(situation.situationType)}>
                            {situation.situationType.charAt(0).toUpperCase() + situation.situationType.slice(1)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {getDaysSince(situation.startDate)} days ago
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          {situation.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          Started: {formatDate(situation.startDate)}
                          {situation.expectedEndDate && (
                            <> • Expected to end: {formatDate(situation.expectedEndDate)}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => endSituation(situation.id)}
                    >
                      Mark as Ended
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {pastSituations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past Situations</CardTitle>
            <CardDescription>Previously tracked situations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pastSituations.slice(0, 5).map((situation) => (
                <div key={situation.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {getSituationIcon(situation.situationType)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {situation.situationType}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {formatDate(situation.startDate)} - {situation.actualEndDate ? formatDate(situation.actualEndDate) : 'Ended'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}