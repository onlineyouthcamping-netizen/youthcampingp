import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Save, Globe, Search, Loader2, Image as ImageIcon 
} from 'lucide-react';
import { toast } from 'sonner';
import { seoService } from '@/services/seo.service';
import { tripsService } from '@/services/trips.service';
import api from '@/services/api';
import { Card, CardContent } from "@/components/ui/card";

export default function SeoCenterPage() {
  const [pages, setPages] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState('home');
  const [seoData, setSeoData] = useState<any>({
    metaTitle: '',
    metaDescription: '',
    ogImage: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    if (currentPage) loadSeo();
  }, [currentPage]);

  const loadPages = async () => {
    try {
      const trips = await tripsService.getAll();
      const list = [
        { label: 'Home Page', value: 'home' },
        { label: 'About Us', value: 'about' },
        ...trips.map((t: any) => ({ label: `Trip: ${t.title}`, value: t.slug }))
      ];
      setPages(list);
    } catch (err) {
      toast.error("Failed to load pages");
    }
  };

  const loadSeo = async () => {
    setLoading(true);
    try {
      const data = await seoService.get(currentPage);
      setSeoData(data || { metaTitle: '', metaDescription: '', ogImage: '' });
    } catch (err) {
      setSeoData({ metaTitle: '', metaDescription: '', ogImage: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await seoService.update(currentPage, seoData);
      toast.success("SEO updated for " + currentPage);
      api.post('/revalidate', { path: `/${currentPage === 'home' ? '' : currentPage}` }).catch(() => {});
    } catch (err) {
      toast.error("Failed to update SEO");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tighter">SEO <span className="text-primary">Center</span></h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Manage search engine presence per page</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="h-12 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Optimization
        </Button>
      </div>

      <Card className="rounded-[40px] border-none shadow-sm bg-card overflow-hidden">
        <CardContent className="p-10 space-y-10">
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Target Page</Label>
            <Select value={currentPage} onValueChange={setCurrentPage}>
              <SelectTrigger className="h-14 rounded-2xl border-2 font-bold px-6">
                <SelectValue placeholder="Select Page" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-2">
                {pages.map(p => (
                  <SelectItem key={p.value} value={p.value} className="font-bold py-3 uppercase text-[10px] tracking-widest">{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-10">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1 flex items-center gap-2">
                <Globe className="w-3 h-3" /> Meta Title
              </Label>
              <Input 
                value={seoData.metaTitle} 
                onChange={e => setSeoData({...seoData, metaTitle: e.target.value})}
                placeholder="Page title for search engines"
                className="h-14 rounded-2xl border-2 font-bold px-6"
              />
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1 flex items-center gap-2">
                <Search className="w-3 h-3" /> Meta Description
              </Label>
              <Textarea 
                value={seoData.metaDescription} 
                onChange={e => setSeoData({...seoData, metaDescription: e.target.value})}
                placeholder="Summarize this page for search results..."
                className="rounded-3xl border-2 p-6 min-h-[120px] font-medium leading-relaxed"
                maxLength={160}
              />
              <div className="flex justify-between px-2">
                <span className={`text-[9px] font-black uppercase tracking-widest ${seoData.metaDescription.length > 150 ? 'text-red-500' : 'text-primary'}`}>
                  {seoData.metaDescription.length} / 150-160 Recommended
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1 flex items-center gap-2">
                <ImageIcon className="w-3 h-3" /> Social Sharing Image (OG Image)
              </Label>
              <div className="flex gap-6">
                <Input 
                  value={seoData.ogImage} 
                  onChange={e => setSeoData({...seoData, ogImage: e.target.value})}
                  placeholder="https://example.com/banner.jpg"
                  className="h-14 rounded-2xl border-2 font-bold px-6 flex-1"
                />
                {seoData.ogImage && (
                  <div className="h-14 w-24 rounded-2xl overflow-hidden border-2 bg-muted shadow-lg">
                    <img src={seoData.ogImage} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
