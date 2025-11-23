"use client";

import {
  Bold,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Type,
  Underline,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Type your description here...",
  className = "",
  minHeight = "200px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  // Handle content changes
  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Execute formatting command
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  // Handle image upload
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast.error("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement("img");
      img.src = e.target?.result as string;
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.style.borderRadius = "8px";
      img.style.margin = "10px 0";
      img.classList.add("uploaded-image");

      if (editorRef.current) {
        editorRef.current.appendChild(img);
        editorRef.current.appendChild(document.createElement("br"));
        handleInput();
      }

      toast.success("Image uploaded successfully");
    };
    reader.readAsDataURL(file);
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleImageUpload(files[0]);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleImageUpload(files[0]);
    }
  };

  // Handle paste events (for pasting images)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            handleImageUpload(file);
          }
        }
      }
    }
  };

  // Insert link
  const handleInsertLink = () => {
    if (linkUrl) {
      const selection = window.getSelection();
      const text = linkText || linkUrl;

      if (selection && editorRef.current) {
        const range = selection.getRangeAt(0);
        const link = document.createElement("a");
        link.href = linkUrl;
        link.textContent = text;
        link.style.color = "#0052cc";
        link.style.textDecoration = "underline";
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        range.deleteContents();
        range.insertNode(link);

        handleInput();
      }
    }

    setShowLinkInput(false);
    setLinkUrl("");
    setLinkText("");
  };

  return (
    <div
      className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}
    >
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex items-center gap-1 flex-wrap">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => execCommand("bold")}
          title="Bold (Ctrl+B)"
        >
          <Bold size={16} />
        </Button>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => execCommand("italic")}
          title="Italic (Ctrl+I)"
        >
          <Italic size={16} />
        </Button>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => execCommand("underline")}
          title="Underline (Ctrl+U)"
        >
          <Underline size={16} />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => execCommand("insertUnorderedList")}
          title="Bullet List"
        >
          <List size={16} />
        </Button>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => execCommand("insertOrderedList")}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => execCommand("formatBlock", "h2")}
          title="Heading"
        >
          <Type size={16} />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => setShowLinkInput(!showLinkInput)}
          title="Insert Link"
        >
          <LinkIcon size={16} />
        </Button>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => fileInputRef.current?.click()}
          title="Upload Image"
        >
          <ImageIcon size={16} />
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
        />
      </div>

      {/* Link input panel */}
      {showLinkInput && (
        <div className="bg-blue-50 border-b border-blue-200 p-3 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Link URL (https://...)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Link text (optional)"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" onClick={handleInsertLink}>
              Insert
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowLinkInput(false);
                setLinkUrl("");
                setLinkText("");
              }}
            >
              <X size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        className={`p-4 outline-none overflow-y-auto bg-white ${
          isDragging ? "bg-blue-50 border-2 border-blue-400 border-dashed" : ""
        }`}
        style={{
          minHeight,
          maxHeight: "400px",
        }}
        data-placeholder={placeholder}
      />

      {/* Drag and drop hint */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-100/90 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <ImageIcon size={48} className="text-blue-600 mx-auto mb-2" />
            <p className="text-blue-900 font-medium">Drop image here</p>
          </div>
        </div>
      )}

      {/* Helper text */}
      <div className="bg-gray-50 border-t border-gray-300 px-3 py-2 text-xs text-gray-500">
        💡 Tip: Drag & drop images, or paste from clipboard
      </div>

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        [contenteditable] h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin: 0.5em 0;
        }
        
        [contenteditable] ul,
        [contenteditable] ol {
          margin: 0.5em 0;
          padding-left: 2em;
        }
        
        [contenteditable] li {
          margin: 0.25em 0;
        }
        
        [contenteditable] a {
          color: #0052cc;
          text-decoration: underline;
        }
        
        [contenteditable] a:hover {
          color: #0065ff;
        }
        
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 10px 0;
          display: block;
        }
        
        [contenteditable]:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
}
