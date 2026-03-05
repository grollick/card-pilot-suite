import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Circle, Square, RectangleHorizontal, Loader2 } from "lucide-react";

const PROFILE_PRESETS = [
  { label: "Circle", value: "circle", aspect: 1, shape: "round" as const, icon: Circle },
  { label: "Square", value: "square", aspect: 1, shape: "rect" as const, icon: Square },
  { label: "4:3", value: "4:3", aspect: 4 / 3, shape: "rect" as const, icon: RectangleHorizontal },
];

const COVER_PRESETS = [
  { label: "16:9", value: "16:9", aspect: 16 / 9, shape: "rect" as const, icon: RectangleHorizontal },
  { label: "4:3", value: "4:3", aspect: 4 / 3, shape: "rect" as const, icon: RectangleHorizontal },
  { label: "Square", value: "square", aspect: 1, shape: "rect" as const, icon: Square },
];

interface ImageCropDialogProps {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (blob: Blob) => void;
  aspect?: number;
  title?: string;
}

async function getCroppedBlob(
  imageSrc: string,
  crop: Area
): Promise<Blob> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas empty"))),
      "image/png",
      1
    );
  });
}

export default function ImageCropDialog({
  open,
  imageSrc,
  onClose,
  onCropComplete,
  aspect: _initialAspect = 1,
  title = "Crop Photo",
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const isWide = _initialAspect > 1.1;
  const presets = isWide ? COVER_PRESETS : PROFILE_PRESETS;
  const [activePreset, setActivePreset] = useState(presets[0].value);

  const currentPreset = presets.find((p) => p.value === activePreset) ?? presets[0];

  const onCropDone = useCallback(
    (_: Area, croppedAreaPixels: Area) => {
      setCroppedArea(croppedAreaPixels);
    },
    []
  );

  const handlePresetChange = (value: string) => {
    setActivePreset(value);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleConfirm = async () => {
    if (!croppedArea) return;
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedArea);
      onCropComplete(blob);
    } catch {
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      onCropComplete(blob);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Aspect ratio presets */}
        <div className="px-4 pb-2 flex gap-1.5">
          {presets.map((preset) => {
            const Icon = preset.icon;
            const isActive = activePreset === preset.value;
            return (
              <button
                key={preset.value}
                onClick={() => handlePresetChange(preset.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full h-72 bg-muted">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={currentPreset.aspect}
            cropShape={currentPreset.shape}
            showGrid={currentPreset.shape === "rect"}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropDone}
          />
        </div>

        <div className="px-4 py-3 space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Zoom</Label>
            <span className="text-xs text-muted-foreground">{zoom.toFixed(1)}×</span>
          </div>
          <Slider
            min={1}
            max={3}
            step={0.05}
            value={[zoom]}
            onValueChange={([v]) => setZoom(v)}
            className="w-full"
          />
        </div>

        <DialogFooter className="p-4 pt-2 gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={processing}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleConfirm} disabled={processing}>
            {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}