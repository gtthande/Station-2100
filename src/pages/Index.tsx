
import { GradientButton } from "@/components/ui/gradient-button";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/ui/glass-card";
import { Settings, Package, FileText, Users, TrendingUp, Shield } from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: Package,
      title: "Inventory Management",
      description: "Track stock items, batch receiving, and real-time inventory levels across multiple warehouses."
    },
    {
      icon: FileText,
      title: "Job Cards",
      description: "Create, manage, and approve job cards with automated calculations and approval workflows."
    },
    {
      icon: Users,
      title: "Customer & Supplier Management",
      description: "Maintain comprehensive records of customers and suppliers with contact information."
    },
    {
      icon: TrendingUp,
      title: "Reporting & Analytics",
      description: "Generate detailed reports for stock valuation, job summaries, and business insights."
    },
    {
      icon: Shield,
      title: "Role-Based Access",
      description: "Secure multi-user environment with customizable roles and permissions."
    },
    {
      icon: Settings,
      title: "Period Management",
      description: "Close accounting periods with automated locking and audit trail compliance."
    }
  ];

  return (
    <div className="min-h-screen bg-surface-dark">
      {/* Hero Section */}
      <section className="section-ornament relative overflow-hidden">
        <div className="container mx-auto px-6 py-24 max-w-container">
          <div className="text-center space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-display font-bold gradient-text">
                Station-2100 Web
              </h1>
              <p className="text-h2 text-white/80 max-w-3xl mx-auto">
                Modern inventory and workshop management system for aviation maintenance
              </p>
              <p className="text-body text-white/60 max-w-2xl mx-auto">
                Modernized from the ground up with real-time stock visibility, 
                automated workflows, and comprehensive audit compliance.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <GradientButton size="lg" className="px-8">
                Get Started
              </GradientButton>
              <GradientButton variant="outline" size="lg" className="px-8">
                View Demo
              </GradientButton>
            </div>
          </div>
        </div>
        
        {/* Background Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-from/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-to/10 rounded-full blur-3xl"></div>
      </section>

      {/* Features Section */}
      <section className="section-ornament py-24">
        <div className="container mx-auto px-6 max-w-container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-h1 font-bold gradient-text">
              Everything You Need
            </h2>
            <p className="text-body text-white/70 max-w-2xl mx-auto">
              Built for aviation professionals who demand reliability, compliance, and efficiency.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <GlassCard 
                key={feature.title}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <GlassCardHeader>
                  <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <GlassCardTitle>{feature.title}</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <GlassCardDescription>
                    {feature.description}
                  </GlassCardDescription>
                </GlassCardContent>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6 max-w-container">
          <GlassCard className="text-center space-y-8 p-12">
            <div className="space-y-4">
              <h2 className="text-h1 font-bold text-white">
                Ready to Modernize Your Workshop?
              </h2>
              <p className="text-body text-white/70 max-w-2xl mx-auto">
                Join the future of aviation maintenance management with zero-install, 
                browser-based access from any device.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <GradientButton size="lg" className="px-8">
                Start Free Trial
              </GradientButton>
              <GradientButton variant="ghost" size="lg" className="px-8">
                Schedule Demo
              </GradientButton>
            </div>
          </GlassCard>
        </div>
      </section>
    </div>
  );
};

export default Index;
