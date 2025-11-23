"use client";

import { Download, X, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { VisuallyHidden } from "./ui/visually-hidden";

interface ImageViewerModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName?: string;
}

export function ImageViewerModal({
  open,
  onClose,
  imageUrl,
  imageName,
}: ImageViewerModalProps) {
  const [zoom, setZoom] = useState(1);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = imageName || "image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[90vw] max-h-[90vh] bg-[#1e1f22] border-none p-0 overflow-hidden"
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>{imageName || "Image Viewer"}</DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
          <div className="text-white font-medium truncate">
            {imageName || "Image"}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleZoomOut}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <ZoomOut size={18} />
            </Button>
            <span className="text-white text-sm font-mono w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              onClick={handleZoomIn}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <ZoomIn size={18} />
            </Button>
            <Button
              onClick={handleDownload}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <Download size={18} />
            </Button>
            <Button
              onClick={onClose}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* Image */}
        <div className="w-full h-full flex items-center justify-center overflow-auto bg-[#1e1f22] p-16">
          <img
            src={imageUrl}
            alt={imageName}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
