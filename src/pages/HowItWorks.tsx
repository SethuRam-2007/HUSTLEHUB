import React from 'react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Search, 
  CheckCircle, 
  Wallet, 
  Shield, 
  Clock, 
  Star,
  Zap,
  HelpCircle,
  FileText,
  Users
} from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: Search,
      title: 'Find a Task',
      description: 'Browse the marketplace and find tasks that match your skills. Filter by category, payout, or deadline.',
    },
    {
      icon: CheckCircle,
      title: 'Complete the Work',
      description: 'Accept a task and complete it within the deadline. Submit proof of your work when done.',
    },
    {
      icon: Wallet,
      title: 'Get Paid Instantly',
      description: 'Once the poster approves your work, the payment is instantly credited to your wallet.',
    },
  ];

  const faqs = [
    {
      question: 'How do I start earning?',
      answer: 'Create an account, browse the marketplace, accept a task that matches your skills, and complete it. Once approved, you get paid!',
    },
    {
      question: 'How does payment work?',
      answer: 'All payments are handled through virtual demo currency (₹). When a task is approved, the amount is credited to your wallet.',
    },
    {
      question: 'What if there\'s a dispute?',
      answer: 'You can raise a dispute if there\'s an issue. Our admin team will review and resolve it fairly.',
    },
    {
      question: 'Can I post tasks too?',
      answer: 'Yes! You can both post tasks and complete tasks. Switch between being a poster and a worker anytime.',
    },
    {
      question: 'Is my money safe?',
      answer: 'This is a demo platform using virtual currency. No real money is involved.',
    },
  ];

  const trustFeatures = [
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'All transactions are protected with encryption',
    },
    {
      icon: Users,
      title: 'Verified Users',
      description: 'Optional verification for trusted hustlers',
    },
    {
      icon: Star,
      title: 'Rating System',
      description: 'Transparent ratings and reviews',
    },
    {
      icon: Clock,
      title: 'Fast Resolution',
      description: 'Quick dispute resolution by admins',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero */}
      <section className="py-20 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="container mx-auto px-4 relative text-center text-white">
          <h1 className="text-5xl font-bold mb-6">How HustleHub Works</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            The simplest way to earn money by completing micro-tasks. Three easy steps to start hustling.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Trust & Safety</h2>
            <p className="text-muted-foreground text-lg">Your security is our priority</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {trustFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="p-6 text-center">
                  <Icon className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="p-6">
                <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="container mx-auto px-4 relative text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to Start?</h2>
          <p className="text-xl mb-8 text-white/90">
            Join thousands of students earning money on HustleHub
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/marketplace">
              <Button variant="secondary" size="lg" className="text-lg px-8">
                <Zap className="w-5 h-5 mr-2" />
                Browse Tasks
              </Button>
            </Link>
            <Link to="/auth">
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 bg-white/10 border-white text-white hover:bg-white hover:text-primary"
              >
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;
