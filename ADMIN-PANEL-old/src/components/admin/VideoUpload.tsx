import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, Video as VideoIcon, X, RefreshCw } from "lucide-react";
import api from "@/services/api";

interface VideoUploadProps {
  onUpload: (data: { url: string; publicId: string; posterUrl: string }) => void;
  label?: string;
  value?: string;
  className?: string;
}

const formatUrl = (url: any): string => {
  if (!url || typeof url !== 'string') return "";
  if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:")) return url;
  const apiBase = api.defaults.baseURL || "https://api.youthcamping.online/api";
  const serverBase = apiBase.replace('/api', '');
  return `${serverBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

export function VideoUpload({ onUpload, label, value, className }: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [id] = useState(() => Math.random().toString(36).substring(7));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert("File size exceeds 50MB limit");
      return;
    }

    const formData = new FormData();
    formData.append("video", file);

    setUploading(true);
    try {
      const res = await api.post("/upload/video", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded * 100) / (e.total || 1)));
        }
      });
      if (res.data.success) {
        onUpload({
          url: res.data.url,
          publicId: res.data.publicId,
          posterUrl: res.data.posterUrl
        });
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
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleReplace = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = async () => {
    onUpload({ url: "", publicId: "", posterUrl: "" });
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
  }, []);

  const displayUrl = formatUrl(value);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">{label}</Label>}
      
      <Input 
        ref={fileInputRef}
        type="file" 
        accept="video/mp4,video/webm,video/quicktime" 
        onChange={handleFileChange} 
        className="hidden" 
        id={`video-replace-${id}`}
      />

      <div 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center p-6 gap-4 rounded-2xl border-2 border-dashed ${
          isDragging ? "border-primary bg-primary/10 scale-[1.02]" : "border-primary/20 bg-muted/50 hover:bg-muted"
        }`}
      >
        {value ? (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/5 flex items-center justify-center">
            <video 
              src={displayUrl} 
              className="w-full h-full object-contain" 
              controls
              muted
            />
            
            <div className="absolute top-2 right-2 flex gap-1.5">
              <Button 
                variant="secondary" 
                size="icon" 
                className="w-8 h-8 rounded-full shadow-lg bg-white/90 hover:bg-white"
                title="Replace video"
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
                title="Remove video"
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
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold">Drag & drop your video here</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                MP4, WebM, MOV • Max 50MB
              </p>
            </div>
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

        <div className="flex w-full gap-2 items-center justify-center mt-2">
          <Input 
            type="file" 
            accept="video/mp4,video/webm,video/quicktime" 
            onChange={handleFileChange} 
            className="hidden" 
            id={`video-upload-${id}`} 
            disabled={uploading}
          />
          <Label 
            htmlFor={`video-upload-${id}`}
            className="flex items-center justify-center rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest cursor-pointer hover:opacity-90 shadow-lg shadow-primary/20 transition-all px-6 h-10"
          >
            Browse Video Files
          </Label>
        </div>
      </div>
    </div>
  );
}
