import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, Image as ImageIcon, X, RefreshCw } from "lucide-react";
import api from "@/services/api";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  onMultipleUpload?: (urls: string[]) => void;
  label?: string;
  value?: string;
  multiple?: boolean;
  className?: string;
  compact?: boolean;
}

/**
 * Converts a relative upload path to a full URL for display.
 * Handles: /uploads/... paths, full http URLs, and empty values.
 */
const formatUrl = (url: any): string => {
  if (!url || typeof url !== 'string') return "";
  if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:")) return url;
  // Build absolute URL from the API base
  const apiBase = api.defaults.baseURL || "https://api.youthcamping.online/api";
  const serverBase = apiBase.replace('/api', '');
  return `${serverBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

export function ImageUpload({ onUpload, onMultipleUpload, label, value, multiple = false, className, compact = false }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [id] = useState(() => Math.random().toString(36).substring(7));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    if (multiple) {
       const formData = new FormData();
       let validCount = 0;
       for (let i = 0; i < files.length; i++) {
         if (files[i].size > 10 * 1024 * 1024) {
           alert(`File ${files[i].name} exceeds 10MB limit`);
           continue;
         }
         formData.append("images", files[i]);
         validCount++;
       }
       if (validCount === 0) return;
       
       setUploading(true);
       setImgError(false);
       try {
          const res = await api.post("/upload/multiple", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (e) => {
              setProgress(Math.round((e.loaded * 100) / (e.total || 1)));
            }
          });
          if (res.data.success) {
            if (onMultipleUpload) {
              onMultipleUpload(res.data.urls);
            } else {
              res.data.urls.forEach((url: string) => onUpload(url));
            }
          } else {
            alert("Upload failed: " + (res.data.message || "Unknown error"));
          }
       } catch (err: any) {
         console.error("Upload failed:", err);
         alert("Upload failed: " + (err.response?.data?.message || err.message || "Network error"));
       } finally {
         setUploading(false);
         setProgress(0);
       }
    } else {
       const file = files[0];
       if (file.size > 10 * 1024 * 1024) {
         alert("File size exceeds 10MB limit");
         return;
       }
       const formData = new FormData();
       formData.append("image", file);
       
       setUploading(true);
       setImgError(false);
       try {
         const res = await api.post("/upload/single", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (e) => {
              setProgress(Math.round((e.loaded * 100) / (e.total || 1)));
            }
         });
         if (res.data.success) {
           console.log("[ImageUpload] ✅ Upload success:", res.data.url);
           onUpload(res.data.url);
         } else {
           alert("Upload failed: " + (res.data.message || "Unknown error"));
         }
       } catch (err: any) {
         console.error("Upload failed:", err);
         alert("Upload failed: " + (err.response?.data?.message || err.message || "Network error"));
       } finally {
         setUploading(false);
         setProgress(0);
       }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      // Reset the input so the same file can be re-selected
      e.target.value = '';
    }
  };

  const handleReplace = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = async () => {
    if (!value) return;
    
    // Only attempt server delete for local uploads
    if (typeof value === 'string' && value.startsWith('/uploads/')) {
      try {
        await api.delete("/upload/photo", { data: { url: value } });
        console.log("[ImageUpload] ✅ Server file deleted:", value);
      } catch (err) {
        console.warn("[ImageUpload] ⚠️ Server delete failed (continuing):", err);
      }
    }
    onUpload("");
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [multiple]);

  const displayUrl = formatUrl(value);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && !compact && <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">{label}</Label>}
      
      {/* Hidden file input for replace functionality */}
      <Input 
        ref={fileInputRef}
        type="file" 
        accept="image/png, image/jpeg, image/webp" 
        multiple={multiple}
        onChange={handleFileChange} 
        className="hidden" 
        id={`file-replace-${id}`}
      />

      <div 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center transition-all ${
          compact ? "p-2 gap-1" : "p-6 gap-4"
        } rounded-2xl border-2 border-dashed ${
          isDragging ? "border-primary bg-primary/10 scale-[1.02]" : "border-primary/20 bg-muted/50 hover:bg-muted"
        }`}
      >
        {value && !multiple ? (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/5">
            {!imgError ? (
              <img 
                src={displayUrl} 
                className="w-full h-full object-contain" 
                alt="Uploaded preview"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-[10px] font-bold uppercase opacity-50">Image failed to load</p>
                <p className="text-[8px] opacity-30 mt-1 max-w-[200px] truncate">{value}</p>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="absolute top-2 right-2 flex gap-1.5">
              <Button 
                variant="secondary" 
                size="icon" 
                className="w-8 h-8 rounded-full shadow-lg bg-white/90 hover:bg-white"
                title="Replace image"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReplace();
                }}
              >
                <RefreshCw className="w-3.5 h-3.5 text-primary" />
              </Button>
              <Button 
                variant="destructive" 
                size="icon" 
                className="w-8 h-8 rounded-full shadow-lg"
                title="Remove image"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <div className={`${compact ? 'w-6 h-6' : 'w-12 h-12'} bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary`}>
              <Upload className={`${compact ? 'w-3 h-3' : 'w-5 h-5'}`} />
            </div>
            {!compact && (
              <div>
                <p className="text-xs font-bold">Drag & drop your {multiple ? 'images' : 'image'} here</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                  JPG, PNG, WEBP • Max 10MB
                </p>
              </div>
            )}
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl z-10 p-6">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <div className="w-full max-w-[200px] h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest mt-2">{progress}% Uploaded</p>
          </div>
        )}

        <div className={`flex w-full gap-2 items-center justify-center ${compact ? 'mt-0' : 'mt-2'}`}>
          <Input 
            type="file" 
            accept="image/png, image/jpeg, image/webp" 
            multiple={multiple}
            onChange={handleFileChange} 
            className="hidden" 
            id={`file-upload-${id}`} 
            disabled={uploading}
          />
          <Label 
            htmlFor={`file-upload-${id}`}
            className={`flex items-center justify-center rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest cursor-pointer hover:opacity-90 shadow-lg shadow-primary/20 transition-all ${
              compact ? 'px-2 h-6' : 'px-6 h-10'
            }`}
          >
            {compact ? 'Add' : 'Browse Files'}
          </Label>
        </div>
      </div>
      
    </div>
  );
}
