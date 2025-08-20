import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function AuthPage() {
  const { userId } = await auth();
  
  // If user is already signed in, redirect to dashboard
  if (userId) {
    redirect("/dashboard");
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <Button variant="ghost" asChild>
            <Link href="/" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
        
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">E</span>
                </div>
                <span className="text-2xl font-bold">Evenly</span>
              </div>
              <h1 className="text-2xl font-bold mb-2">Welcome to Evenly</h1>
              <p className="text-muted-foreground">
                Sign in or create an account to start splitting bills with friends
              </p>
            </div>
            
            <SignIn 
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-none border border-border bg-card",
                  headerTitle: "text-foreground",
                  headerSubtitle: "text-muted-foreground",
                  formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
                  formFieldInput: "bg-background border-border text-foreground",
                  formFieldLabel: "text-foreground",
                  footerActionLink: "text-primary hover:text-primary/90",
                  dividerLine: "bg-border",
                  dividerText: "text-muted-foreground",
                  socialButtonsBlockButton: "bg-background border-border text-foreground hover:bg-accent",
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
