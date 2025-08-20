import { Button } from "@/components/ui/button"
import { ArrowRight, Users, CreditCard, PieChart, Zap, Shield, Smartphone } from "lucide-react"
import Link from "next/link"
import { auth } from "@clerk/nextjs/server"

export default async function Home() {
  const { userId } = await auth();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">E</span>
              </div>
              <span className="text-xl font-bold">Evenly</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
                Pricing
              </Link>
              {userId ? (
                <>
                  <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                  <Button asChild>
                    <Link href="/dashboard" className="flex items-center">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/signin" className="text-sm font-medium hover:text-primary transition-colors">
                    Sign In
                  </Link>
                  <Button asChild>
                    <Link href="/auth/signin" className="flex items-center">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Split bills{" "}
            <span className="text-primary">effortlessly</span>
            <br />
            with friends
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect your bank accounts, create groups, and let Evenly handle the math. 
            Never worry about who owes what again.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            {userId ? (
              <Button size="lg" asChild>
                <Link href="/dashboard" className="flex items-center">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button size="lg" asChild>
                <Link href="/auth/signin" className="flex items-center">
                  Start Splitting Bills
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button variant="outline" size="lg" asChild>
              <Link href="#demo">
                Watch Demo
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything you need to split bills
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From roommates to group trips, Evenly makes expense sharing simple and fair.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg border bg-card">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Bank Integration</h3>
              <p className="text-muted-foreground">
                Connect your bank accounts securely with Plaid and automatically import transactions.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Groups</h3>
              <p className="text-muted-foreground">
                Create groups for roommates, trips, or any recurring expense sharing.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <PieChart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Flexible Splitting</h3>
              <p className="text-muted-foreground">
                Split equally, by percentage, or custom amounts. We handle all the calculations.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Settlements</h3>
              <p className="text-muted-foreground">
                Get paid back instantly with integrated payment methods like Venmo and PayPal.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Bank-Level Security</h3>
              <p className="text-muted-foreground">
                Your financial data is protected with enterprise-grade security and encryption.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Mobile First</h3>
              <p className="text-muted-foreground">
                Access Evenly anywhere with our responsive web app and mobile notifications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
            Ready to simplify your expenses?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust Evenly to manage their shared expenses.
          </p>
          {userId ? (
            <Button size="lg" variant="secondary" asChild>
              <Link href="/dashboard" className="flex items-center">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/signin" className="flex items-center">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">E</span>
                </div>
                <span className="text-xl font-bold">Evenly</span>
              </div>
              <p className="text-muted-foreground">
                Making expense sharing simple, fair, and effortless.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="/security" className="hover:text-foreground">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">About</Link></li>
                <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-foreground">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/help" className="hover:text-foreground">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Evenly. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
