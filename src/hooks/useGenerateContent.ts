import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GeneratedCardContent {
  bio: string;
  about: string;
  tagline: string;
  cta_text: string;
  services: string[];
  instagram_bio: string;
}

export function useGenerateCardContent() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState<GeneratedCardContent | null>(null);

  const generate = async (params: {
    profession: string;
    name: string;
    company?: string;
    city?: string;
  }) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-card-content", {
        body: params,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setContent(data.content);
      return data.content as GeneratedCardContent;
    } catch (err: any) {
      console.error("AI generation error:", err);
      toast.error(err.message || "Failed to generate content");
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generate, isGenerating, content, setContent };
}