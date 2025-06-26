import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyMagicLink() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Invalid magic link - no token found");
      return;
    }

    verifyMagicLink(token);
  }, []);

  const verifyMagicLink = async (token: string) => {
    try {
      const response = await fetch("/api/auth/verify-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.token);
        setStatus("success");
        setMessage("Successfully signed in! Redirecting to dashboard...");
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          setLocation("/dashboard");
        }, 2000);
      } else {
        const error = await response.json();
        setStatus("error");
        setMessage(error.message || "Invalid or expired magic link");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  const handleBackToAuth = () => {
    setLocation("/auth");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Nuvanta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Verifying your magic link
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              {status === "loading" && <Loader2 className="h-5 w-5 animate-spin" />}
              {status === "success" && <CheckCircle className="h-5 w-5 text-green-600" />}
              {status === "error" && <XCircle className="h-5 w-5 text-red-600" />}
              
              {status === "loading" && "Verifying..."}
              {status === "success" && "Success!"}
              {status === "error" && "Error"}
            </CardTitle>
            <CardDescription className="text-center">
              {message}
            </CardDescription>
          </CardHeader>
          
          {status === "error" && (
            <CardContent>
              <Button onClick={handleBackToAuth} className="w-full">
                Back to Sign In
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}