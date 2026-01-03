import Link from "next/link"
import { Button } from "@/components/Common/Button"
import { Card } from "@/components/Common/Card"
import { ArrowRight, CheckCircle2, Zap, ShieldCheck, BarChart3, Users, Cpu, Briefcase } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navigation */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <Link className="flex items-center justify-center gap-2" href="#">
          <div className="bg-primary p-1.5 rounded-lg text-primary-foreground">
            <Cpu className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">ZENVY</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:text-primary transition-colors hidden md:block" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors hidden md:block" href="#solutions">
            Solutions
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="/login">
            Login
          </Link>
          <Button asChild size="sm" className="hidden sm:flex">
            <Link href="/login">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-muted/50 to-background overflow-hidden">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground mb-4">
                <Zap className="mr-1 h-3 w-3" /> AI-Powered Payroll for the Future
              </div>
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl text-balance">
                Automate Your Payroll with <span className="text-primary">Intelligence</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed text-pretty">
                ZENVY leverages advanced AI to process complex payroll in seconds, ensuring 100% compliance and ultimate
                efficiency for your global workforce.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Button size="lg" className="h-12 px-8 rounded-full" asChild>
                  <Link href="/login">
                    Start Processing <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-12 px-8 rounded-full bg-transparent">
                  Book a Demo
                </Button>
              </div>
              <div className="relative mt-16 w-full max-w-5xl mx-auto">
                <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full -z-10" />
                <div className="rounded-2xl border bg-card shadow-2xl overflow-hidden aspect-video relative">
                  <img
                    src="/modern-payroll-dashboard-interface-with-charts-and.jpg"
                    alt="ZENVY Dashboard Preview"
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-y bg-muted/30">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-1">
                <p className="text-3xl font-bold">99.9%</p>
                <p className="text-sm text-muted-foreground">Accuracy Rate</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold">150+</p>
                <p className="text-sm text-muted-foreground">Currencies</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold">50k+</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold">15min</p>
                <p className="text-sm text-muted-foreground">Processing Time</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-24 md:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything You Need</h2>
              <p className="max-w-[800px] text-muted-foreground md:text-xl">
                Powerful features designed to simplify human resources and financial management.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card
                title="AI Automation"
                description="Intelligent calculation engine that handles taxes, benefits, and deductions automatically."
              >
                <Cpu className="h-10 w-10 text-primary mb-2" />
              </Card>
              <Card
                title="Global Compliance"
                description="Stay up to date with local laws in over 150 countries without lifting a finger."
              >
                <ShieldCheck className="h-10 w-10 text-primary mb-2" />
              </Card>
              <Card
                title="Self-Service Portal"
                description="Empower employees with access to their own slips, documents, and profile management."
              >
                <Users className="h-10 w-10 text-primary mb-2" />
              </Card>
              <Card
                title="Advanced Analytics"
                description="Visualize spending patterns and workforce costs with beautiful, interactive charts."
              >
                <BarChart3 className="h-10 w-10 text-primary mb-2" />
              </Card>
              <Card
                title="Instant Payments"
                description="Disburse funds across multiple regions simultaneously with a single click."
              >
                <Zap className="h-10 w-10 text-primary mb-2" />
              </Card>
              <Card
                title="HR Management"
                description="Manage your entire workforce lifecycle from onboarding to offboarding in one place."
              >
                <Briefcase className="h-10 w-10 text-primary mb-2" />
              </Card>
            </div>
          </div>
        </section>

        {/* AI Insight Section */}
        <section className="w-full py-24 bg-primary text-primary-foreground overflow-hidden">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Human HR. <br /> Superhuman Speed.
                </h2>
                <p className="text-xl text-primary-foreground/80">
                  ZENVY's AI doesn't just calculate numbers. It detects anomalies, suggests optimizations, and predicts
                  future budget needs.
                </p>
                <ul className="space-y-4">
                  {[
                    "Predictive budget forecasting",
                    "Automated error detection & correction",
                    "Dynamic benefit optimization",
                    "Smart tax strategy suggestions",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-secondary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-white/10 blur-[100px] rounded-full" />
                <img
                  src="/abstract-ai-neural-network-representing-payroll-in.jpg"
                  alt="AI Intelligence Illustration"
                  className="relative rounded-2xl shadow-2xl border border-white/10"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-24 md:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Ready to Transform Your Payroll?</h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Join thousands of forward-thinking companies already using ZENVY.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Button size="lg" className="h-12 px-8 rounded-full" asChild>
                  <Link href="/login">Get Started Now</Link>
                </Button>
                <Button variant="outline" size="lg" className="h-12 px-8 rounded-full bg-transparent">
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-12 border-t bg-muted/10">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            <div className="col-span-2">
              <Link className="flex items-center gap-2 mb-4" href="#">
                <div className="bg-primary p-1.5 rounded-lg text-primary-foreground">
                  <Cpu className="h-6 w-6" />
                </div>
                <span className="text-xl font-bold tracking-tight">ZENVY</span>
              </Link>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                The future of payroll is intelligent. Processing with speed, accuracy, and compliance globally.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Product</h4>
              <nav className="flex flex-col gap-2">
                <Link className="text-sm text-muted-foreground hover:text-primary" href="#">
                  Features
                </Link>
                <Link className="text-sm text-muted-foreground hover:text-primary" href="#">
                  Pricing
                </Link>
                <Link className="text-sm text-muted-foreground hover:text-primary" href="#">
                  Compliance
                </Link>
              </nav>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Company</h4>
              <nav className="flex flex-col gap-2">
                <Link className="text-sm text-muted-foreground hover:text-primary" href="#">
                  About
                </Link>
                <Link className="text-sm text-muted-foreground hover:text-primary" href="#">
                  Careers
                </Link>
                <Link className="text-sm text-muted-foreground hover:text-primary" href="#">
                  Contact
                </Link>
              </nav>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Legal</h4>
              <nav className="flex flex-col gap-2">
                <Link className="text-sm text-muted-foreground hover:text-primary" href="#">
                  Privacy
                </Link>
                <Link className="text-sm text-muted-foreground hover:text-primary" href="#">
                  Terms
                </Link>
                <Link className="text-sm text-muted-foreground hover:text-primary" href="#">
                  Cookies
                </Link>
              </nav>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">© 2026 ZENVY AI Technologies Inc. All rights reserved.</p>
            <div className="flex gap-4">
              <Link className="text-xs text-muted-foreground hover:text-primary" href="#">
                Twitter
              </Link>
              <Link className="text-xs text-muted-foreground hover:text-primary" href="#">
                LinkedIn
              </Link>
              <Link className="text-xs text-muted-foreground hover:text-primary" href="#">
                GitHub
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
