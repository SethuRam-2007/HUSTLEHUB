import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Send } from "lucide-react";
import { toast } from "sonner";

interface ProofSubmissionProps {
  taskId: string;
  onProofSubmitted: () => void;
}

const ProofSubmission = ({ taskId, onProofSubmitted }: ProofSubmissionProps) => {
  const [proofText, setProofText] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!proofText.trim() && !fileUrl.trim()) {
      toast.error("Please provide proof text or a file URL");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("tasks")
      .update({
        proof_text: proofText.trim() || null,
        proof_file_url: fileUrl.trim() || null,
        proof_submitted_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    setLoading(false);

    if (error) {
      toast.error("Failed to submit proof");
      return;
    }

    onProofSubmitted();
  };

  return (
    <div className="p-4 border rounded-lg space-y-4 bg-card">
      <h4 className="font-medium flex items-center gap-2">
        <Upload className="h-4 w-4" />
        Submit Proof of Work
      </h4>
      
      <div className="space-y-2">
        <Label htmlFor="proofText">Description of completed work</Label>
        <Textarea
          id="proofText"
          placeholder="Describe what you did to complete this task..."
          value={proofText}
          onChange={(e) => setProofText(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fileUrl">File URL (optional)</Label>
        <Input
          id="fileUrl"
          placeholder="https://drive.google.com/... or any file link"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Paste a link to your work (Google Drive, Dropbox, GitHub, etc.)
        </p>
      </div>

      <Button onClick={handleSubmit} disabled={loading} className="w-full">
        <Send className="h-4 w-4 mr-2" />
        {loading ? "Submitting..." : "Submit Proof"}
      </Button>
    </div>
  );
};

export default ProofSubmission;
