import React from 'react';
import Navigation from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Terms & Conditions</h1>
          </div>
          
          <Card className="p-8 space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using HustleHub, you agree to be bound by these Terms and Conditions. 
                If you do not agree to these terms, please do not use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Demo Platform</h2>
              <p className="text-muted-foreground">
                HustleHub is a demonstration platform using virtual currency (₹). No real money is involved 
                in any transactions. All balances, earnings, and payments are simulated for educational purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
              <p className="text-muted-foreground">
                You are responsible for maintaining the confidentiality of your account credentials. 
                You agree to provide accurate information and keep your profile updated.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Task Posting & Completion</h2>
              <p className="text-muted-foreground">
                Task posters must provide clear descriptions and fair compensation. Workers must 
                complete tasks as described and submit valid proof of work. Both parties should 
                communicate respectfully.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Disputes</h2>
              <p className="text-muted-foreground">
                Either party may raise a dispute if there are issues with a task. Our admin team 
                will review disputes and make final decisions. All dispute resolutions are final.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Prohibited Activities</h2>
              <p className="text-muted-foreground">
                Users may not engage in fraud, harassment, or any illegal activities. Posting 
                inappropriate content or attempting to bypass platform rules will result in account 
                suspension.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                HustleHub is provided "as is" without warranties. We are not liable for any losses 
                resulting from the use of this platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. Continued use of the 
                platform constitutes acceptance of updated terms.
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

export default Terms;
