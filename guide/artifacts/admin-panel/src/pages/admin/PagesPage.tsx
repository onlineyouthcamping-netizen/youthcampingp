import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { pagesService } from '@/services/pages.service';
import { toast } from 'sonner';

export default function PagesPage() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        const pagesRes = await pagesService.getAll();
        setPages(pagesRes.data || []);
      } catch (err) {
        toast.error("Failed to load pages");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleCreatePage = async () => {
    try {
      const title = prompt("Enter Page Title");
      if (!title) return;
      const slug = title.toLowerCase().replace(/ /g, '-');
      const res = await pagesService.create({ title, slug });
      toast.success("Page created");
      navigate(`/admin/pages/${res.data._id}`);
    } catch (err) {
      toast.error("Failed to create page");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="admin-title">Pages & Templates</h1>
          <p className="admin-body">Manage website structure, layout pages, and visual blocks.</p>
        </div>
        <Button onClick={handleCreatePage} className="admin-button-primary self-start sm:self-auto">
          <Plus className="w-4 h-4" /> New Page
        </Button>
      </div>

      <div className="admin-card border border-slate-200">
        <div className="space-y-6">
          <div className="flex items-center gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <span className="bg-[#FF5400] text-white text-[9px] font-semibold px-2 py-0.5 rounded-md">TIP</span>
            <p className="text-xs font-medium text-slate-700">Use the Page Builder to design pages visually. Visit the blogs system to manage stories.</p>
          </div>
          
          {loading ? (
            <div className="py-20 text-center animate-pulse text-slate-400 text-sm">Syncing Pages...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pages.map(page => (
                <div key={page._id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center gap-4 hover:shadow-premium transition-all">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary`}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="admin-card-title truncate max-w-full">{page.title}</h3>
                    <p className="text-xs font-mono text-slate-400 mt-1 italic">{page.slug}</p>
                  </div>
                  <Link to={`/admin/pages/${page._id}`} className="w-full">
                    <Button className="w-full admin-button-secondary h-9 text-xs">
                      Edit Layout Content
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
