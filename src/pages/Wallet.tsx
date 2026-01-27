import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import PageTransition from "@/components/PageTransition";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet as WalletIcon, TrendingUp, Download, IndianRupee, Clock, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fadeInUpVariants, staggerContainerVariants, cardVariants } from "@/lib/animations";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  status: string | null;
  created_at: string | null;
  task_id: string | null;
}

interface Profile {
  balance: number;
  total_earned: number;
  tasks_completed: number;
}

const Wallet = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWalletData();

      // Subscribe to realtime updates
      const channel = supabase
        .channel('wallet-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          () => {
            fetchWalletData();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'transactions',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchWalletData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('balance, total_earned, tasks_completed')
        .eq('id', user?.id)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const balance = profile?.balance || 0;
  const totalEarnings = profile?.total_earned || 0;
  const tasksCompleted = profile?.tasks_completed || 0;
  
  // Calculate this week's earnings
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thisWeekEarnings = transactions
    .filter(t => t.type === 'earning' && new Date(t.created_at || '') > oneWeekAgo)
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const handleWithdraw = () => {
    toast({
      title: "Demo Mode",
      description: "This is virtual demo money. No real withdrawals are available.",
      variant: "destructive",
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="container mx-auto px-4 py-12">
          <motion.div 
            className="mb-8"
            variants={fadeInUpVariants}
            initial="initial"
            animate="animate"
          >
            <h1 className="text-4xl font-bold mb-2">My Wallet</h1>
            <p className="text-muted-foreground text-lg">
              Track your earnings and view transaction history
            </p>
          </motion.div>

          {/* Demo Disclaimer */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.05 }}
          >
            <Card className="mb-6 p-4 bg-accent/10 border-accent/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground">Virtual Demo Money</h4>
                  <p className="text-sm text-muted-foreground">
                    All amounts shown are in INR (₹) and are for demonstration purposes only. 
                    No real payments or transactions are involved in this platform.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        
          {/* Balance Card */}
          <motion.div 
            className="grid lg:grid-cols-3 gap-6 mb-8"
            variants={staggerContainerVariants}
            initial="initial"
            animate="animate"
          >
            <motion.div variants={cardVariants} className="lg:col-span-2">
              <Card className="p-8 shadow-card-hover bg-gradient-to-br from-primary/5 to-secondary/5 h-full">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-muted-foreground mb-2">Available Balance</p>
                    <div className="flex items-center gap-2">
                      <IndianRupee className="w-10 h-10 text-primary" />
                      <h2 className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                        {Number(balance).toFixed(2)}
                      </h2>
                    </div>
                    <Badge className="mt-2 bg-muted text-muted-foreground">Demo Currency</Badge>
                  </div>
                  <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center">
                    <WalletIcon className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">This Week</p>
                    <p className="text-2xl font-bold text-secondary">+₹{thisWeekEarnings.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tasks Completed</p>
                    <p className="text-2xl font-bold text-foreground">{tasksCompleted}</p>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full mt-6"
                  onClick={handleWithdraw}
                  disabled
                >
                  <Download className="w-5 h-5" />
                  Withdraw (Demo Only)
                </Button>
              </Card>
            </motion.div>
            
            {/* Quick Stats */}
            <div className="space-y-6">
              <motion.div variants={cardVariants}>
                <Card className="p-6 shadow-card">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Earned</p>
                      <p className="text-2xl font-bold">₹{Number(totalEarnings).toFixed(2)}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
              
              <motion.div variants={cardVariants}>
                <Card className="p-6 shadow-card">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transactions</p>
                      <p className="text-2xl font-bold">{transactions.length}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
              
              <motion.div variants={cardVariants}>
                <Card className="p-6 shadow-card">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                      <p className="text-2xl font-bold">100%</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        
          {/* Transaction History */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.15 }}
          >
            <Card className="shadow-card">
              <div className="p-6 border-b border-border">
                <h3 className="text-2xl font-bold">Transaction History</h3>
                <p className="text-sm text-muted-foreground mt-1">All amounts in INR (₹)</p>
              </div>
              
              <div className="divide-y divide-border">
                {transactions.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    No transactions yet. Complete tasks to earn virtual money!
                  </div>
                ) : (
                  transactions.map((item, index) => (
                    <motion.div 
                      key={item.id} 
                      className="p-6 hover:bg-muted/30 transition-colors"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.16, delay: index * 0.04 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground mb-1">
                            {item.description || item.type}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            }) : 'N/A'}</span>
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-secondary" />
                              {item.status || 'completed'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`flex items-center gap-1 text-2xl font-bold ${item.type === 'earning' ? 'text-secondary' : 'text-destructive'}`}>
                            <IndianRupee className="w-5 h-5" />
                            {item.type === 'earning' ? '+' : '-'}{Number(item.amount).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>
          
          {/* Info Card */}
          <Card className="mt-6 p-6 bg-muted/50 border-border">
            <h3 className="font-semibold text-foreground mb-2">ℹ️ About This Wallet:</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• All amounts are displayed in Indian Rupees (₹)</li>
              <li>• This is virtual/demo money for demonstration only</li>
              <li>• No real payments or transactions are involved</li>
              <li>• Complete tasks to earn virtual currency</li>
            </ul>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
};

export default Wallet;
