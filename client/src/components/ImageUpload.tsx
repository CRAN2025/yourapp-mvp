import { useCallback, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
  className?: string;
}

export default function ImageUpload({
  files,
  onChange,
  maxFiles = 5,
  maxSize = 1024 * 1024, // 1MB default
  className,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: File[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        continue;
      }
      
      // Validate file size
      if (file.size > maxSize) {
        continue;
      }
      
      newFiles.push(file);
    }

    // Combine with existing files, respecting maxFiles limit
    const combinedFiles = [...files, ...newFiles].slice(0, maxFiles);
    onChange(combinedFiles);
  }, [files, onChange, maxFiles, maxSize]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        data-testid="image-file-input"
      />

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={openFileDialog}
        className={cn(
          "border-2 border-dashed border-muted-foreground/25 rounded-xl p-6 text-center cursor-pointer transition-colors",
          "hover:border-primary hover:bg-primary/5",
          files.length >= maxFiles && "opacity-50 pointer-events-none"
        )}
        data-testid="image-drop-zone"
      >
        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag & drop images here, or click to select
        </p>
        <p className="text-xs text-muted-foreground">
          Maximum {maxFiles} images, {Math.round(maxSize / (1024 * 1024))}MB each
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {files.length} / {maxFiles} files selected
        </p>
      </div>

      {/* Preview Selected Images */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {files.map((file, index) => (
            <div key={index} className="relative group">
              <img
                src={URL.createObjectURL(file)}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                data-testid={`remove-preview-${index}`}
              >
                <X className="w-3 h-3" />
              </Button>
              <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                {(file.size / (1024 * 1024)).toFixed(1)}MB
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
