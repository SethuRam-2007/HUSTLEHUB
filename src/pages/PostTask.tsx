import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import PageTransition from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fadeInUpVariants } from "@/lib/animations";

const categories = [
  { value: "ppt", label: "PPT/Slides" },
  { value: "coding", label: "Coding" },
  { value: "design", label: "Design" },
  { value: "writing", label: "Writing" },
  { value: "video", label: "Video" },
  { value: "data_entry", label: "Data Entry" },
  { value: "general", label: "General" },
];

const PostTask = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    payout: "",
    deadline: "",
    skill: "",
    category: "",
    time_required: "",
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to post a task.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from("tasks").insert({
      title: formData.title,
      description: formData.description,
      payout: parseFloat(formData.payout),
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
      skill: formData.skill,
      category: formData.category || "general",
      time_required: formData.time_required,
      poster_id: user.id,
      status: "open",
      escrow_amount: parseFloat(formData.payout),
      payment_status: "escrowed",
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Task Posted Successfully!",
      description: "Your task is now live in the marketplace.",
    });
    navigate("/marketplace");
  };
  
  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <motion.div 
              className="text-center mb-8"
              variants={fadeInUpVariants}
              initial="initial"
              animate="animate"
            >
              <div className="inline-block p-4 bg-gradient-primary rounded-2xl mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-2">Post a New Task</h1>
              <p className="text-muted-foreground text-lg">
                Get your work done by skilled hustlers
              </p>
            </motion.div>
          
          <Card className="p-8 shadow-card-hover">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-semibold">
                  Task Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Design a logo for my startup"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="h-12"
                  maxLength={100}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-semibold">
                  Task Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed instructions about what needs to be done..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  className="min-h-32 resize-none"
                  maxLength={2000}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-base font-semibold">
                    Category *
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time_required" className="text-base font-semibold">
                    Time Required
                  </Label>
                  <Input
                    id="time_required"
                    placeholder="e.g., 2 hours, 1 day"
                    value={formData.time_required}
                    onChange={(e) => setFormData({ ...formData, time_required: e.target.value })}
                    className="h-12"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="payout" className="text-base font-semibold">
                    Payout Amount (₹) *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                      ₹
                    </span>
                    <Input
                      id="payout"
                      type="number"
                      placeholder="500"
                      value={formData.payout}
                      onChange={(e) => setFormData({ ...formData, payout: e.target.value })}
                      required
                      className="h-12 pl-8"
                      min="50"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Minimum: ₹50 (Virtual demo currency)</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deadline" className="text-base font-semibold">
                    Deadline *
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    required
                    className="h-12"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="skill" className="text-base font-semibold">
                  Skill Required *
                </Label>
                <Select
                  value={formData.skill}
                  onValueChange={(value) => setFormData({ ...formData, skill: value })}
                  required
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select skill level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner - No experience needed</SelectItem>
                    <SelectItem value="intermediate">Intermediate - Some experience</SelectItem>
                    <SelectItem value="advanced">Advanced - Expert level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  Attachments (Optional)
                </Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, PDF up to 10MB
                  </p>
                </div>
              </div>
              
              <div className="pt-4 flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => navigate("/")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Zap className="w-5 h-5" />
                  )}
                  {isSubmitting ? "Posting..." : "Post Task"}
                </Button>
              </div>
            </form>
          </Card>
          
          <Card className="mt-6 p-6 bg-accent/10 border-accent/20">
            <h3 className="font-semibold text-foreground mb-2">⚠️ Demo Platform Notice:</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• All amounts are in INR (₹) - Virtual demo currency only</li>
              <li>• No real money transactions are involved</li>
              <li>• This is for demonstration purposes only</li>
            </ul>
          </Card>
          
          <Card className="mt-4 p-6 bg-primary/5 border-primary/20">
            <h3 className="font-semibold text-foreground mb-2">💡 Tips for posting great tasks:</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Be specific and clear about what you need</li>
              <li>• Set a fair payout for the work required</li>
              <li>• Include examples or references if possible</li>
              <li>• Respond quickly to questions from hustlers</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  </PageTransition>
  );
};

export default PostTask;
