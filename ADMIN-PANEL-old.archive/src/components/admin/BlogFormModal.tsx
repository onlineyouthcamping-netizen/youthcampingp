import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/admin/ImageUpload";
import type { Blog, BlogFormData } from "@/types";

const defaultForm: BlogFormData = {
  title: "",
  author: "Expedition Team",
  authorImage: "",
  content: "",
  image: "",
  readTime: "5 MIN READ",
  hasVideo: false,
  status: "draft",
  slug: ""
};

interface BlogFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Blog | null;
  onSave: (data: BlogFormData, editingId?: string) => Promise<void>;
}

export default function BlogFormModal({ open, onOpenChange, editing, onSave }: BlogFormModalProps) {
  const [form, setForm] = useState<BlogFormData>(defaultForm);
  const [saving, setSaving] = useState(false);

  // Sync form when editing changes
  const [lastEditingId, setLastEditingId] = useState<string | null>(null);
  if ((editing?.id ?? null) !== lastEditingId) {
    setLastEditingId(editing?.id ?? null);
    if (editing) {
      setForm({
        title: editing.title,
        author: editing.author,
        authorImage: editing.authorImage || "",
        content: editing.content,
        image: editing.image,
        readTime: editing.readTime,
        hasVideo: editing.hasVideo,
        status: editing.status,
        slug: editing.slug || ""
      });
    } else {
      setForm(defaultForm);
    }
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form, editing?.id || (editing as any)?._id);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[40px] p-0 border-none shadow-2xl">
        <div className="p-10 border-b bg-muted/20">
           <DialogHeader>
             <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
               {editing ? "Edit Journal" : "Compose Story"}
             </DialogTitle>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-2">Publish inspirational travel content</p>
           </DialogHeader>
        </div>

        <div className="p-10 space-y-8">
          <div className="space-y-3">
            <ImageUpload 
              label="Featured Story Image" 
              value={form.image} 
              onUpload={(url) => setForm({ ...form, image: url })} 
            />
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Story Headline</Label>
            <Input 
              value={form.title} 
              onChange={(e) => setForm({ ...form, title: e.target.value })} 
              placeholder="The Ultimate Guide to Spiti..." 
              className="rounded-2xl h-16 font-black text-xl border-2 focus:border-primary px-8"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">URL Slug (For matching attractions)</Label>
            <Input 
              value={form.slug} 
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/ /g, '-') })} 
              placeholder="e.g. key-monastery" 
              className="rounded-xl h-10 border-none bg-muted/50 px-6 text-xs font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Author / Explorer</Label>
                <Input 
                  value={form.author} 
                  onChange={(e) => setForm({ ...form, author: e.target.value })} 
                  className="rounded-2xl h-14 border-2 focus:border-primary pl-6 font-bold"
                />
              </div>
              <div className="space-y-3">
                <ImageUpload 
                  label="Publisher's Photo" 
                  value={form.authorImage || ""} 
                  onUpload={(url) => setForm({ ...form, authorImage: url })} 
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Reading Depth</Label>
              <Input 
                value={form.readTime} 
                onChange={(e) => setForm({ ...form, readTime: e.target.value })} 
                className="rounded-2xl h-14 border-2 focus:border-primary pl-6 font-bold uppercase"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Story Content (Markdown Supported)</Label>
            <Textarea 
              value={form.content} 
              onChange={(e) => setForm({ ...form, content: e.target.value })} 
              className="rounded-[32px] min-h-[300px] border-2 focus:border-primary p-8 text-sm font-medium leading-relaxed bg-muted/5 shadow-inner" 
              placeholder="Once upon a time in the mountains..."
            />
          </div>

          <div className="flex items-center justify-between p-8 bg-primary/5 rounded-[32px] border-2 border-primary/10">
            <div className="space-y-1">
              <Label className="text-sm font-black uppercase tracking-tight">Cinematic Video Overlay</Label>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Enable play icon for video-rich blogs</p>
            </div>
            <Switch 
              checked={form.hasVideo} 
              onCheckedChange={(v) => setForm({ ...form, hasVideo: v })} 
            />
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Publication Status</Label>
            <Select value={form.status} onValueChange={(v: "draft" | "published") => setForm({ ...form, status: v })}>
              <SelectTrigger className="rounded-2xl h-14 border-2 font-black uppercase text-[10px] tracking-widest px-6">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2">
                <SelectItem value="draft" className="font-bold uppercase text-[10px]">Save as Draft</SelectItem>
                <SelectItem value="published" className="font-bold uppercase text-[10px]">Go Live (Public)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-10 border-t bg-muted/20 flex justify-end gap-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest">Discard</Button>
          <Button onClick={handleSave} disabled={saving || !form.title || !form.content || !form.image} className="rounded-xl h-12 px-10 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-primary/20">
            {saving ? "Publishing..." : editing ? "Update Story" : "Launch Story"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

