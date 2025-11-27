"use client";

import { Check, Plus, Settings } from "lucide-react";
import { useState } from "react";
import { Label } from "./LabelBadge";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface LabelPickerProps {
  allLabels: Label[];
  selectedLabelIds: string[];
  onToggleLabel: (labelId: string) => void;
  onManageLabels?: () => void;
  trigger?: React.ReactNode;
}

export function LabelPicker({
  allLabels,
  selectedLabelIds,
  onToggleLabel,
  onManageLabels,
  trigger,
}: LabelPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Plus size={14} />
            Labels
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-2 bg-[#2b2d31] border-[#1e1f22]"
        align="start"
      >
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-sm font-medium text-gray-200">Labels</span>
            {onManageLabels && (
              <button
                onClick={() => {
                  setOpen(false);
                  onManageLabels();
                }}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <Settings size={14} />
              </button>
            )}
          </div>

          {allLabels.length === 0 ? (
            <div className="text-center py-6 px-2">
              <p className="text-sm text-gray-500 mb-2">No labels yet</p>
              {onManageLabels && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    onManageLabels();
                  }}
                  className="gap-2 bg-[#1e1f22] border-[#404249] text-gray-200 hover:bg-[#404249]"
                >
                  <Plus size={14} />
                  Create Label
                </Button>
              )}
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {allLabels.map((label) => {
                const isSelected = selectedLabelIds.includes(label.id);
                return (
                  <button
                    key={label.id}
                    onClick={() => onToggleLabel(label.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#404249] transition-colors"
                  >
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? "bg-[#5865f2] border-[#5865f2]"
                          : "border-[#404249] bg-[#1e1f22]"
                      }`}
                    >
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <span
                      className={`${label.color} text-white px-2.5 py-0.5 rounded text-sm font-medium flex-1 text-left`}
                    >
                      {label.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
