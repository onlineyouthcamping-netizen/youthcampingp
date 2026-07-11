import { useState } from "react";
import { mockMedia } from "@/services/mock-data";
import type { MediaItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>(mockMedia);

  const handleUpload = () => {
    const item: MediaItem = {
      id: Date.now().toString(),
      url: `https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=400&t=${Date.now()}`,
      name: `upload-${Date.now()}.jpg`,
      size: Math.floor(Math.random() * 500000),
      type: "image/jpeg",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setMedia((prev) => [item, ...prev]);
    toast.success("Image uploaded");
  };

  const handleDelete = (id: string) => {
    setMedia((prev) => prev.filter((m) => m.id !== id));
    toast.success("Image deleted");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Media Library</h1>
        <Button onClick={handleUpload}><Upload className="h-4 w-4 mr-2" />Upload</Button>
      </div>

      {media.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mb-3" />
          <p>No media files</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {media.map((item) => (
            <div key={item.id} className="group relative rounded-xl border border-border bg-card overflow-hidden">
              <img src={item.url} alt={item.name} className="w-full aspect-square object-cover" />
              <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button variant="destructive" size="icon" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-2">
                <p className="text-xs text-card-foreground truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">{(item.size / 1024).toFixed(0)} KB</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
