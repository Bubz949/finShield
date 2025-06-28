import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

export default function ProfileSetup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [livingAnswers, setLivingAnswers] = useState<string[]>([]);
  const [spendingAnswers, setSpendingAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const { toast } = useToast();

  const initialQuestions = {
    living: "Tell us about your current living situation. Do you live alone, with family, or in a care facility?",
    spending: "Describe your typical spending habits. What do you usually spend money on each month?"
  };

  const generateFollowUpQuestions = async (answer: string, type: 'living' | 'spending') => {
    try {
      const response = await fetch("/api/profile/generate-questions", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ answer, type, previousAnswers: type === 'living' ? livingAnswers : spendingAnswers }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.questions;
      }
    } catch (error) {
      console.error("Failed to generate questions:", error);
    }
    
    // Fallback questions
    return type === 'living' 
      ? ["How do you manage your daily activities?", "Who helps you with important decisions?", "What are your main concerns about safety?", "How comfortable are you with technology?"]
      : ["What are your largest monthly expenses?", "How do you prefer to pay for things?", "Do you have any recurring subscriptions?", "What would be an unusual purchase for you?"];
  };

  const handleAnswer = async () => {
    if (!currentAnswer.trim()) return;

    if (currentStep === 1) {
      // Living situation initial question
      setLivingAnswers([currentAnswer]);
      const followUps = await generateFollowUpQuestions(currentAnswer, 'living');
      setQuestions(followUps);
      setCurrentAnswer("");
      setCurrentStep(2);
    } else if (currentStep >= 2 && currentStep <= 5) {
      // Living situation follow-ups
      const newAnswers = [...livingAnswers, currentAnswer];
      setLivingAnswers(newAnswers);
      setCurrentAnswer("");
      
      if (currentStep === 5) {
        setCurrentStep(6); // Move to spending
      } else {
        setCurrentStep(currentStep + 1);
      }
    } else if (currentStep === 6) {
      // Spending initial question
      setSpendingAnswers([currentAnswer]);
      const followUps = await generateFollowUpQuestions(currentAnswer, 'spending');
      setQuestions(followUps);
      setCurrentAnswer("");
      setCurrentStep(7);
    } else if (currentStep >= 7 && currentStep <= 10) {
      // Spending follow-ups
      const newAnswers = [...spendingAnswers, currentAnswer];
      setSpendingAnswers(newAnswers);
      setCurrentAnswer("");
      
      if (currentStep === 10) {
        await saveProfile();
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const saveProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/profile/complete", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          livingProfile: livingAnswers,
          spendingProfile: spendingAnswers
        }),
      });

      if (response.ok) {
        toast({
          title: "Profile completed!",
          description: "Your personalized fraud detection is now active.",
        });
        window.location.href = "/dashboard";
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentQuestion = () => {
    if (currentStep === 1) return initialQuestions.living;
    if (currentStep === 6) return initialQuestions.spending;
    if (currentStep >= 2 && currentStep <= 5) return questions[currentStep - 2];
    if (currentStep >= 7 && currentStep <= 10) return questions[currentStep - 7];
    return "";
  };

  const getStepTitle = () => {
    if (currentStep <= 5) return "Living Situation";
    return "Spending Profile";
  };

  const getProgress = () => Math.round((currentStep / 10) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Let's Personalize Your Protection
          </h1>
          <p className="mt-2 text-gray-600">
            Help us understand your situation to provide better fraud detection
          </p>
        </div>

        <Card className="backdrop-blur-lg bg-white/80 shadow-2xl border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{getStepTitle()}</CardTitle>
              <span className="text-sm text-gray-500">Step {currentStep} of 10</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
            <CardDescription className="text-lg">
              {getCurrentQuestion()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Share your thoughts here..."
              className="min-h-32 text-lg"
            />
            
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <Button
                onClick={handleAnswer}
                disabled={!currentAnswer.trim() || isLoading}
                className="flex items-center gap-2"
              >
                {currentStep === 10 ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    {isLoading ? "Saving..." : "Complete Setup"}
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}