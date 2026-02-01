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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Zap, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fadeInUpVariants } from "@/lib/animations";

const PostTask = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    category_id: "",
    deadline: "",
    attachments: [] as File[],
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({
        ...formData,
        attachments: Array.from(e.target.files),
      });
    }
  };

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

    /* ---------------- Upload Attachments ---------------- */
    let attachmentUrls: string[] = [];

    for (const file of formData.attachments) {
      const { data, error } = await supabase.storage
        .from("attachments")
        .upload(`${user.id}/${Date.now()}_${file.name}`, file);

      if (error) {
        toast({
          title: "Upload Error",
          description: error.message,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const publicUrl = supabase.storage
        .from("attachments")
        .getPublicUrl(data.path).data.publicUrl;

      attachmentUrls.push(publicUrl);
    }

    /* ---------------- Task Payload ---------------- */
    const taskPayload = {
      title: formData.title,
      description: formData.description,
      payout: Number(formData.budget),
      category_id: Number(formData.category_id),
      owner: user.id,
      poster_id: user.id,
      status: "open",
      deadline: formData.deadline
        ? new Date(formData.deadline).toISOString()
        : null,
      attachments: attachmentUrls.length > 0 ? attachmentUrls : null,
    };

    const { error } = await supabase.from("tasks").insert([taskPayload]);

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

            <Card className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label>Task Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category_id: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">PPT / Slides</SelectItem>
                        <SelectItem value="2">Coding</SelectItem>
                        <SelectItem value="3">Design</SelectItem>
                        <SelectItem value="4">Writing</SelectItem>
                        <SelectItem value="5">Video</SelectItem>
                        <SelectItem value="6">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Budget (₹) *</Label>
                    <Input
                      type="number"
                      min="50"
                      value={formData.budget}
                      onChange={(e) =>
                        setFormData({ ...formData, budget: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Attachments</Label>
                  <Input type="file" multiple onChange={handleFileChange} />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/")}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Zap />
                    )}
                    {isSubmitting ? "Posting..." : "Post Task"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default PostTask;
