import { useState, useRef, useCallback } from "react";
import { Move } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface CoverPositionerProps {
  coverUrl: string;
  offsetY: number;
  onOffsetChange: (y: number) => void;
}

export default function CoverPositioner({ coverUrl, offsetY, onOffsetChange }: CoverPositionerProps) {
  return (
    <div className="space-y-2">
      <div className="relative rounded-lg overflow-hidden border border-border/50 h-24">
        <img
          src={coverUrl}
          alt="Backdrop preview"
          className="w-full h-[200%] object-cover absolute left-0"
          style={{ top: `${-offsetY}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-background/70 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
            <Move className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Drag slider to reposition</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">Position</Label>
        <span className="text-[10px] text-muted-foreground">{offsetY}%</span>
      </div>
      <Slider
        min={0}
        max={100}
        step={1}
        value={[offsetY]}
        onValueChange={([v]) => onOffsetChange(v)}
        className="w-full"
      />
    </div>
  );
}
