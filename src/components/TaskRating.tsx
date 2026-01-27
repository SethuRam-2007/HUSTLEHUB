import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";

interface TaskRatingProps {
  taskId: string;
  workerId: string;
  onRatingSubmitted: () => void;
}

const TaskRating = ({ taskId, workerId, onRatingSubmitted }: TaskRatingProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!user) return;

    setLoading(true);

    const { error } = await supabase.from("task_ratings").insert({
      task_id: taskId,
      worker_id: workerId,
      poster_id: user.id,
      rating,
      review: review.trim() || null,
    });

    if (error) {
      toast.error("Failed to submit rating");
      setLoading(false);
      return;
    }

    // Mark task as rated
    await supabase.from("tasks").update({ is_rated: true }).eq("id", taskId);

    setLoading(false);
    onRatingSubmitted();
  };

  return (
    <div className="p-4 border rounded-lg space-y-4 bg-card">
      <h4 className="font-medium">Rate this worker</h4>
      
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              className={`h-8 w-8 ${
                star <= (hoveredRating || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>

      <Textarea
        placeholder="Write a review (optional)..."
        value={review}
        onChange={(e) => setReview(e.target.value)}
        rows={2}
      />

      <Button onClick={handleSubmit} disabled={loading || rating === 0}>
        {loading ? "Submitting..." : "Submit Rating"}
      </Button>
    </div>
  );
};

export default TaskRating;
