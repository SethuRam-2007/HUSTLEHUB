import React from 'react';
import Navigation from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Shield } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
          </div>
          
          <Card className="p-8 space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
              <p className="text-muted-foreground">
                We collect information you provide directly, including your email address, name, 
                and profile information. We also collect usage data to improve our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
              <p className="text-muted-foreground">
                Your information is used to provide and improve our services, communicate with you, 
                and ensure platform security. We do not sell your personal data to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Data Storage</h2>
              <p className="text-muted-foreground">
                Your data is stored securely using industry-standard encryption. As a demo platform, 
                data may be periodically reset.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Cookies</h2>
              <p className="text-muted-foreground">
                We use cookies to maintain your session and improve user experience. You can control 
                cookie preferences through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Third-Party Services</h2>
              <p className="text-muted-foreground">
                We may use third-party services for analytics and functionality. These services 
                have their own privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
              <p className="text-muted-foreground">
                You have the right to access, modify, or delete your personal data. Contact us 
                if you wish to exercise these rights.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Changes to Policy</h2>
              <p className="text-muted-foreground">
                We may update this policy periodically. Check this page for the latest version.
              </p>
            </section>

            <div className="pt-6 border-t text-sm text-muted-foreground">
              Last updated: January 2026
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
