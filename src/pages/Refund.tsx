import React from 'react';
import Navigation from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { RefreshCcw } from 'lucide-react';

const Refund = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <RefreshCcw className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Refund Policy</h1>
          </div>
          
          <Card className="p-8 space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg mb-6">
              <p className="text-sm text-muted-foreground">
                <strong>Important:</strong> HustleHub uses virtual demo currency. This policy 
                explains how virtual refunds work within the platform.
              </p>
            </div>

            <section>
              <h2 className="text-xl font-semibold mb-3">1. Virtual Currency</h2>
              <p className="text-muted-foreground">
                All transactions on HustleHub use virtual currency (₹) that has no real monetary 
                value. Refunds refer to the return of virtual credits within the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. When Refunds Apply</h2>
              <p className="text-muted-foreground mb-3">
                Virtual refunds may be issued in the following cases:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Task cancelled before acceptance by a worker</li>
                <li>Dispute resolved in favor of the task poster</li>
                <li>Worker fails to complete task within deadline</li>
                <li>Technical issues preventing task completion</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Dispute Process</h2>
              <p className="text-muted-foreground">
                If you need a refund due to task issues, raise a dispute through the task page. 
                Our admin team will review and decide on the appropriate action.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Non-Refundable Items</h2>
              <p className="text-muted-foreground mb-3">
                The following are not eligible for refunds:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Chat upgrade fees after messages are sent</li>
                <li>Completed and approved tasks</li>
                <li>Tasks where the worker delivered as described</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Processing Time</h2>
              <p className="text-muted-foreground">
                Virtual refunds are processed immediately upon admin approval. Credits will 
                appear in your wallet instantly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Contact</h2>
              <p className="text-muted-foreground">
                For refund-related queries, raise a dispute on the relevant task or contact 
                our support team.
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

export default Refund;
