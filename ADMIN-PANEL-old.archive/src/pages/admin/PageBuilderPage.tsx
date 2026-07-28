import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  Layout, Megaphone, Users, MessageSquare, ImageIcon, Type, 
  Plus, Trash2, GripVertical, Eye, Send, 
  MoreVertical, Copy, Lock, Unlock, Save, Undo2, Redo2, History,
  Loader2, CheckCircle2, AlertCircle, ChevronRight, X, Menu, PanelLeftClose, Star
} from "lucide-react";
import { pageBuilderService } from "@/services/page-builder.service";
import { tripsService } from "@/services/trips.service";
import { toast, Toaster } from "react-hot-toast";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { VideoUpload } from "@/components/admin/VideoUpload";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { authService } from "@/services/auth.service";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const SECTION_TYPES = [
  { type: 'hero', label: 'Hero Banner', icon: Layout, desc: 'High-impact cinematic hero with video/image background.' },
  { type: 'featured_trips', label: 'Featured Trips', icon: Megaphone, desc: 'Showcase specific trips in a grid or slider.' },
  { type: 'trending_trips', label: 'Trending Trips', icon: Users, desc: 'Display most popular trips based on views/bookings.' },
  { type: 'reviews', label: 'Reviews', icon: MessageSquare, desc: 'Premium traveler stories and human moments.' },
  { type: 'cta_banner', label: 'CTA Banner', icon: Megaphone, desc: 'Call to action section with catchy headline and button.' },
  { type: 'image_gallery', label: 'Image Gallery', icon: ImageIcon, desc: 'Masonry or grid gallery of travel photos.' },
  { type: 'photo_grid', label: 'Photo Grid', icon: ImageIcon, desc: 'A clean 3-column grid for showcasing trip memories.' },
  { type: 'rich_text', label: 'Rich Text', icon: Type, desc: 'Versatile text content with full formatting support.' },
  { type: 'video_section', label: 'Video Section', icon: Eye, desc: 'Cinematic YouTube video background section.' },
  { type: 'journal', label: 'The Journal', icon: Type, desc: 'Display adventure stories and blog posts.' },
  { type: 'destinations', label: 'Destinations', icon: ImageIcon, desc: 'Portrait grid of international destinations.' },
  { type: 'cta_slider', label: 'CTA Slider', icon: Megaphone, desc: 'Multi-card CTA carousel for flagship expeditions.' },
  { type: 'reality', label: 'The Reality Section', icon: Eye, desc: 'Display video reality checks and traveler experiences.' },
  { type: 'upcoming_trips', label: 'Upcoming Trips', icon: Megaphone, desc: 'Display a list of upcoming group departures.' },
  { type: 'bestie', label: 'Why Us (Bestie)', icon: Users, desc: 'Showcase why you are the traveler bestie.' },
  { type: 'social_proof', label: 'Social Proof Bar', icon: CheckCircle2, desc: 'Display trust stats and badges.' },
  { type: 'cinematic_banner', label: 'Cinematic Banner', icon: Layout, desc: 'Panoramic slide banner with title overlays.' },
  { type: 'photo_slider', label: 'Photo Slider', icon: ImageIcon, desc: 'Simple horizontal photo slider.' },
  { type: 'vibe', label: 'Vibe Section', icon: Star, desc: 'Vibe check reels showcasing traveler moments.' },
];


const PADDING_OPTIONS = [
  { label: 'None', value: '0px' },
  { label: 'Normal', value: '80px' },
  { label: 'Large', value: '120px' },
];

const DEFAULT_HOME_LAYOUT = [
  {
    type: 'hero',
    name: 'Hero Section',
    draft: {
      headline: 'Every great story starts with someone who decided to go.',
      subheadline: '10,000+ travelers. Trusted since 2019. Government registered.',
      videoUrl: 'https://www.youtube.com/embed/j6hb-iOZalE',
      backgroundColor: '#ffffff',
      padding: '0px'
    }
  },
  {
    type: 'social_proof',
    name: 'Trust Stats',
    draft: {
      backgroundColor: '#ffffff',
      padding: '24px',
      stats: [
        { icon: "Users", label: "10,000+ Travelers" },
        { icon: "Trophy", label: "Trusted Since 2019" },
        { icon: "ShieldCheck", label: "Gujarat Tourism Registered" },
        { icon: "Calendar", label: "Weekly Departures" }
      ]
    }
  },
  {
    type: 'upcoming_trips',
    name: 'Upcoming Trips',
    draft: {
      title: 'Upcoming Community Trips',
      backgroundColor: '#ffffff',
      padding: '80px'
    }
  },
  {
    type: 'bestie',
    name: 'Why Us',
    draft: {
      title: 'Reasons To Make Us Your Travel Bestie',
      backgroundColor: '#C4DAD2',
      padding: '80px',
      reasons: [
        {
          title: "Solo is safe.",
          desc: "Girlies, you're safe AF. No need to wait on fam or besties—just pack and go! Explore stress-free with 100% freedom!",
          image: "/page-builder-defaults/solo-safe.svg"
        },
        {
          title: "We're the greenest flag.",
          desc: "We ensure safety with verified stays, reliable transport, and trained guides for a secure, comfy, and hassle-free trip.",
          image: "/page-builder-defaults/green-flag.svg"
        },
        {
          title: "Our Group Captains are fire.",
          desc: "Our awesome trip captains are part-guide, part-friend and full time vibe curators.",
          image: "/page-builder-defaults/group-captains.svg"
        },
        {
          title: "No kebab main haddi.",
          desc: "No middlemen, no hidden fees. Enjoy direct bookings, lower costs, and personalized support for a seamless and affordable trip.",
          image: "/page-builder-defaults/no-middleman.svg"
        },
        {
          title: "Vibe check comes first.",
          desc: "We customize your trips based on age groups, so you're not stuck vibing to someone else's playlist without permission.",
          image: "/page-builder-defaults/vibe-check.svg"
        }
      ]
    }
  },
  {
    type: 'destinations',
    name: 'Destinations',
    draft: {
      title: 'Popular Destinations',
      backgroundColor: '#ffffff',
      padding: '80px'
    }
  },
    {
      id: 'cta-slider-1',
      type: 'cta_slider',
      draft: {
        title: 'OUR FLAGSHIP EXPEDITIONS',
        items: [
          { title: 'SPITI WINTER EXPEDITION', subtitle: 'Extreme Adventure & Snow Trails', duration: '6 Days 5 Nights', saveAmount: '4,000', image: '/page-builder-defaults/placeholder-scenic.svg', link: '/trips/spiti', price: '18,500' },
          { title: 'KASHMIR GREAT LAKES', subtitle: 'Alpine Trek & Hidden Lakes', duration: '8 Days 7 Nights', saveAmount: '3,500', image: '/page-builder-defaults/placeholder-scenic.svg', link: '/trips/kgl', price: '15,500' },
          { title: 'MEGHALAYA EXPLORER', subtitle: 'Tropical Waterfalls & Caves', duration: '6 Days 5 Nights', saveAmount: '5,000', image: '/page-builder-defaults/placeholder-scenic.svg', link: '/trips/meghalaya', price: '12,500' },
          { title: 'LADAKH ROAD TRIP', subtitle: 'The Ultimate High Altitude Drive', duration: '10 Days 9 Nights', saveAmount: '6,000', image: '/page-builder-defaults/placeholder-scenic.svg', link: '/trips/ladakh', price: '28,500' }
        ]
      }
    },
  {
    id: 'dest-1',
    type: 'destinations',
    draft: {
      title: 'POPULAR DESTINATIONS',
      destinations: [
        { name: "SIKKIM", img: "/page-builder-defaults/destination-card.svg" },
        { name: "UTTARAKHAND", img: "/page-builder-defaults/destination-card.svg" },
        { name: "HIMACHAL", img: "/page-builder-defaults/destination-card.svg" },
        { name: "LADAKH", img: "/page-builder-defaults/destination-card.svg" },
        { name: "GOA", img: "/page-builder-defaults/destination-card.svg" }
      ]
    }
  },
  {
    type: 'reality',
    name: 'The Reality Section',
    draft: {
      title: 'The Reality Of A Trip',
      subtitle: 'Watch the reality behind our trips, and real reviews by our users.',
      backgroundColor: '#ffffff',
      padding: '80px',
      videos: [
        { title: "Solo Girl Review", sub: "(with Youthcamping)", img: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=2070", url: "https://www.youtube.com/embed/j6hb-iOZalE" },
        { title: "Leh Ladakh", sub: "(Explore with us)", img: "https://images.unsplash.com/photo-1581793745862-99f579601e1b?q=80&w=2070", url: "https://www.youtube.com/embed/j6hb-iOZalE" },
        { title: "Travellers Experiences", sub: "(Real stories)", img: "https://images.unsplash.com/photo-1533130061792-64b345e4a833?q=80&w=2070", url: "https://www.youtube.com/embed/j6hb-iOZalE" }
      ]
    }
  }
];

export default function PageBuilderPage() {
  const [pages, setPages] = useState<string[]>(['home', 'about-us', 'contact-us']);
  const [currentPage, setCurrentPage] = useState('home');
  const [sections, setSections] = useState<any[]>([]);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'dirty' | 'saving'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dbTrips, setDbTrips] = useState<any[]>([]);

  // History for Undo/Redo
  const history = useRef<any[]>([]);
  const redoStack = useRef<any[]>([]);
  const lastSavedContentRef = useRef<string>("");
  const saveCounterRef = useRef<number>(0);

  const selectedSectionRaw = sections.find(s => s.id === selectedSectionId);
  const selectedSection = selectedSectionRaw ? { ...selectedSectionRaw, draft: selectedSectionRaw.draft || {} } : null;

  const navigate = useNavigate();

  const load = async (page = currentPage) => {
    setLoading(true);
    try {
      const [userData, layoutData, tripsData] = await Promise.all([
        authService.getMe(),
        pageBuilderService.getDraft(page),
        tripsService.getAll()
      ]);
      
      if (userData?.role === 'agent') {
        toast.error("Access denied");
        navigate("/admin/dashboard");
        return;
      }

      const sections = layoutData?.sections || [];
      setSections(sections);
      lastSavedContentRef.current = JSON.stringify(sections);
      setDbTrips(tripsData || []);
      if (sections.length > 0) {
        setSelectedSectionId(sections[0].id);
      }
    } catch (err) {
      toast.error("Failed to load layout");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(currentPage); 
  }, [currentPage]);

  const pushHistory = useCallback((state: any[]) => {
    history.current.push(JSON.stringify(state));
    if (history.current.length > 20) history.current.shift();
    redoStack.current = [];
  }, []);

  const undo = () => {
    if (history.current.length === 0) return;
    redoStack.current.push(JSON.stringify(sections));
    const prevState = JSON.parse(history.current.pop());
    setSections(prevState);
    setSaveStatus('dirty');
  };

  const redo = () => {
    if (redoStack.current.length === 0) return;
    history.current.push(JSON.stringify(sections));
    const nextState = JSON.parse(redoStack.current.pop());
    setSections(nextState);
    setSaveStatus('dirty');
  };

  // Autosave Logic with debounced save duration of 3 seconds
  const timerRef = useRef<any>(null);
  useEffect(() => {
    if (saveStatus === 'dirty') {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        await saveDraft();
      }, 3000);
    }
    return () => clearTimeout(timerRef.current);
  }, [sections, saveStatus]);

  const saveDraft = async () => {
    if (loading) {
      console.log("🛑 [PageBuilder] Skip saving: loading in progress");
      return;
    }

    const serialized = JSON.stringify(sections);
    if (serialized === lastSavedContentRef.current) {
      setSaveStatus('saved');
      return;
    }

    setSaveStatus('saving');
    const currentSaveId = ++saveCounterRef.current;
    try {
      await pageBuilderService.updateSections(currentPage, sections);
      if (currentSaveId !== saveCounterRef.current) {
        // Stale save request, ignore response to preserve latest-edit-wins
        return;
      }
      lastSavedContentRef.current = serialized;
      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (err) {
      if (currentSaveId !== saveCounterRef.current) {
        return;
      }
      setSaveStatus('dirty');
      toast.error("Autosave failed");
    }
  };

  const publish = async () => {
    setPublishing(true);
    try {
      // FORCE A SAVE FIRST before publishing so we don't publish stale data
      await pageBuilderService.updateSections(currentPage, sections);
      lastSavedContentRef.current = JSON.stringify(sections);
      setSaveStatus('saved');
      setLastSaved(new Date());

      await pageBuilderService.publish(currentPage);
      toast.success("Published! Site updated.");
      // Trigger revalidation
      api.post('/revalidate', { path: '/' }).catch(() => {});
    } catch (err) {
      toast.error("Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    pushHistory(sections);
    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    const updated = items.map((item, index) => ({ ...item, order: index }));
    setSections(updated);
    setSaveStatus('dirty');
  };

  const getDefaults = (type: string) => {
    // Check if we have high-fidelity defaults in our template
    const template = DEFAULT_HOME_LAYOUT.find(t => t.type === type);
    if (template) return JSON.parse(JSON.stringify(template.draft));

    switch (type) {
      case 'hero':
        return { 
          headline: 'Every great story starts with someone who decided to go.', 
          subheadline: '10,000+ travelers. Trusted since 2019.', 
          videoUrl: '',
          backgroundColor: '#ffffff',
          padding: '0px'
        };
      case 'bestie':
        return { backgroundColor: '#C4DAD2', padding: '80px', title: 'Reasons To Make Us Your Travel Bestie', reasons: [] };
      case 'social_proof':
        return { 
          backgroundColor: '#ffffff', 
          padding: '24px', 
          stats: [
            { icon: "Users", label: "10,000+ Travelers" },
            { icon: "Trophy", label: "Trusted Since 2019" }
          ] 
        };
      case 'cta_banner':
        return { backgroundColor: '#D4541A', padding: '80px', title: 'Ready for Adventure?' };
      case 'photo_grid':
        return { backgroundColor: '#ffffff', padding: '80px', title: 'Unfiltered Memories', images: [] };
      case 'reality':
        return { backgroundColor: '#ffffff', padding: '80px', title: 'The Reality Of A Trip', subtitle: 'Watch the reality behind our trips', videos: [] };
      case 'video_section':
        return { 
          title: 'Videos', 
          subtitle: 'Exclusive footage from our expeditions', 
          videos: [
            { title: 'Spiti Valley', id: 'j6hb-iOZalE' }
          ],
          backgroundColor: '#ffffff', 
          padding: '80px' 
        };
      case 'photo_slider':
        return {
          slides: [
            { image: '/page-builder-defaults/placeholder-scenic.svg' },
            { image: '/page-builder-defaults/placeholder-scenic.svg' }
          ]
        };
      case 'cinematic_banner':
        return {
          slides: [
            { title: 'CINEMATIC ADVENTURE', subtitle: 'JOIN OUR NEXT QUEST', image: '/page-builder-defaults/placeholder-scenic.svg', link: '/trips' }
          ]
        };
      case 'vibe':
        return {
          title: 'Vibe with Us',
          backgroundColor: '#ffffff',
          padding: '80px'
        };
      default:
        return { backgroundColor: '#ffffff', padding: '80px', title: `New ${type.replace('_', ' ')}` };
    }
  };

  const initializeWithDefaultLayout = () => {
    if (!confirm("This will replace all current sections with the default template. Continue?")) return;
    const sectionsWithIds = DEFAULT_HOME_LAYOUT.map((s, i) => ({
      ...JSON.parse(JSON.stringify(s)),
      id: crypto.randomUUID(),
      order: i,
      visible: true,
      locked: false
    }));
    setSections(sectionsWithIds);
    setSaveStatus('dirty');
    if (sectionsWithIds.length > 0) setSelectedSectionId(sectionsWithIds[0].id);
    toast.success("Default layout initialized");
  };

  const addSection = async (type: string) => {
    pushHistory(sections);

    const newSection = {
      id: crypto.randomUUID(),
      type,
      name: `New ${type.replace('_', ' ')}`,
      order: sections.length,
      visible: true,
      locked: false,
      draft: {
        ...getDefaults(type),
        headline: `New ${type.replace('_', ' ')}`,
        images: [],
        tripIds: []
      }
    };
    const updated = [...sections, newSection];
    setSections(updated);
    setSelectedSectionId(newSection.id);
    setTypeModalOpen(false);
    setSaveStatus('dirty');
  };

   const deleteSection = (id: string) => {
     setSectionToDelete(id);
   };

   const confirmDelete = async () => {
     if (!sectionToDelete) return;
     pushHistory(sections);
     setSections(prev => prev.filter(s => s.id !== sectionToDelete));
     setSaveStatus('dirty');
     if (selectedSectionId === sectionToDelete) setSelectedSectionId(null);
     setSectionToDelete(null);
     toast.success("Section removed");
   };

  const duplicateSection = async (id: string) => {
    const original = sections.find(s => s.id === id);
    if (!original) return;
    pushHistory(sections);
    const copy = {
      ...original,
      id: crypto.randomUUID(),
      name: `${original.name} (Copy)`,
      order: original.order + 1
    };
    const updated = [...sections];
    updated.splice(original.order + 1, 0, copy);
    setSections(updated.map((s, i) => ({ ...s, order: i })));
    setSaveStatus('dirty');
    setSelectedSectionId(copy.id);
  };

  const updateSelectedSection = (updates: any) => {
    if (!selectedSectionId) return;
    pushHistory(sections);
    setSections(sections.map(s => 
      s.id === selectedSectionId ? { ...s, draft: { ...s.draft, ...updates } } : s
    ));
    setSaveStatus('dirty');
  };

  const updateSelectedSectionMeta = (updates: any) => {
    if (!selectedSectionId) return;
    pushHistory(sections);
    setSections(sections.map(s => 
      s.id === selectedSectionId ? { ...s, ...updates } : s
    ));
    setSaveStatus('dirty');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveDraft();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        const token = localStorage.getItem('token');
        window.open(`/admin/preview?page=${currentPage}&token=${token}`, '_blank');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sections, currentPage]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'dirty') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  if (loading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Initializing Page Builder...</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 top-16 md:top-20 left-0 md:left-[3rem] lg:left-64 bg-background z-30 flex flex-col overflow-hidden border-l border-border">
      <Toaster position="top-right" />
      
      {/* ── TOOLBAR ── */}
      <header className="h-12 md:h-16 border-b border-border bg-card/50 backdrop-blur-md px-2 sm:px-4 md:px-6 flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-2 md:gap-6 min-w-0">
          {/* Mobile sidebar toggle */}
          <Button variant="ghost" size="icon" className="rounded-xl md:hidden shrink-0" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="w-5 h-5" />
          </Button>
          <Select value={currentPage} onValueChange={setCurrentPage}>
            <SelectTrigger className="w-[100px] sm:w-[140px] md:w-[180px] rounded-xl border-2 font-bold h-9 md:h-10 text-[10px] md:text-xs">
              <SelectValue placeholder="Select Page" />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-2xl">
              {pages.map(p => <SelectItem key={p} value={p} className="font-bold uppercase text-[10px] tracking-widest">{p}</SelectItem>)}
            </SelectContent>
          </Select>
          
          <div className="hidden sm:flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${saveStatus === 'saved' ? 'bg-green-500' : saveStatus === 'saving' ? 'bg-blue-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 hidden lg:inline">
              {saveStatus === 'saved' ? (lastSaved ? `Saved ${Math.floor((new Date().getTime() - lastSaved.getTime())/1000)}s ago` : 'Saved') : 
               saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <Button variant="ghost" size="icon" onClick={undo} disabled={history.current.length === 0} className="rounded-xl h-8 w-8 md:h-9 md:w-9">
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={redo} disabled={redoStack.current.length === 0} className="rounded-xl h-8 w-8 md:h-9 md:w-9">
            <Redo2 className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1 hidden sm:block" />
          <Button variant="outline" size="icon" className="rounded-xl border-2 h-8 w-8 md:h-10 md:w-auto md:px-4 lg:px-6" onClick={() => {
            const token = localStorage.getItem('token');
            window.open(`/admin/preview?page=${currentPage}&token=${token}`, '_blank');
          }}>
            <Eye className="w-4 h-4" /><span className="hidden lg:inline ml-2 font-black text-[10px] tracking-widest">PREVIEW</span>
          </Button>
          <Button variant="outline" size="icon" className="rounded-xl border-2 h-8 w-8 md:h-10 md:w-auto md:px-4 lg:px-6" onClick={saveDraft}>
            <Save className="w-4 h-4" /><span className="hidden lg:inline ml-2 font-black text-[10px] tracking-widest">SAVE</span>
          </Button>
          <Button size="icon" className="rounded-xl h-8 w-8 md:h-10 md:w-auto md:px-4 lg:px-6 shadow-xl shadow-primary/20" onClick={publish} disabled={publishing}>
            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden lg:inline ml-2 font-black text-[10px] tracking-widest">PUBLISH</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* ── SECTION LIST (LEFT) ── */}
        {/* Mobile overlay backdrop */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-40 md:z-auto w-[280px] sm:w-[320px] border-r border-border bg-muted/20 flex flex-col overflow-hidden shrink-0 h-full transition-transform duration-300 ease-in-out`}>
          {/* Mobile close button */}
          <div className="flex items-center justify-between p-3 border-b border-border md:hidden">
            <span className="text-[10px] font-black uppercase tracking-widest">Sections</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setSidebarOpen(false)}>
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-3 md:p-4 flex-1 overflow-y-auto">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="sections">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {sections.map((section, index) => {
                      const Icon = SECTION_TYPES.find(t => t.type === section.type)?.icon || Layout;
                      return (
                        <Draggable key={section.id} draggableId={section.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              onClick={() => setSelectedSectionId(section.id)}
                              className={`group relative flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                                selectedSectionId === section.id ? 'bg-background border-primary shadow-lg ring-4 ring-primary/5' : 
                                snapshot.isDragging ? 'bg-background border-primary scale-105 shadow-2xl z-50' : 'bg-background/50 border-transparent hover:border-border hover:bg-background'
                              } ${!section.visible ? 'opacity-50 grayscale' : ''}`}
                            >
                              <div {...provided.dragHandleProps} className="text-muted-foreground/30 hover:text-primary transition-colors">
                                <GripVertical className="w-4 h-4" />
                              </div>
                              <div className="bg-primary/10 p-2 rounded-xl">
                                <Icon className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-[11px] font-black uppercase tracking-tight truncate">{section.name || section.type.replace('_', ' ')}</h4>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{section.type}</p>
                              </div>
                              
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="w-7 h-7 rounded-lg"
                                  onClick={(e) => { e.stopPropagation(); updateSelectedSectionMeta({ visible: !section.visible }); }}
                                >
                                  {section.visible ? <Eye className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 opacity-30" />}
                                </Button>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg" onClick={e => e.stopPropagation()}>
                                      <MoreVertical className="w-3.5 h-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="rounded-xl shadow-2xl border-2 p-2 w-48">
                                    <DropdownMenuItem onClick={() => duplicateSection(section.id)} className="rounded-lg font-bold text-[10px] uppercase py-2.5">
                                      <Copy className="w-3.5 h-3.5 mr-2" /> DUPLICATE
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateSelectedSectionMeta({ locked: !section.locked })} className="rounded-lg font-bold text-[10px] uppercase py-2.5">
                                      {section.locked ? <Unlock className="w-3.5 h-3.5 mr-2" /> : <Lock className="w-3.5 h-3.5 mr-2" />}
                                      {section.locked ? 'UNLOCK' : 'LOCK'}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => deleteSection(section.id)} className="rounded-lg font-bold text-[10px] uppercase py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10">
                                      <Trash2 className="w-3.5 h-3.5 mr-2" /> DELETE
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              
                              {section.locked && <Lock className="absolute -top-1 -right-1 w-3 h-3 text-amber-500 fill-amber-500" />}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
          
          <div className="p-4 border-t border-border bg-background">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{sections.length} Sections</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">{sections.filter(s => !s.visible).length} Hidden</span>
            </div>
            <div className="flex flex-col gap-2">
              <Button className="w-full rounded-2xl h-12 font-black text-[11px] tracking-widest gap-2 shadow-xl shadow-primary/20" onClick={() => setTypeModalOpen(true)}>
                <Plus className="w-4 h-4" /> ADD SECTION
              </Button>
              <Button variant="outline" className="w-full rounded-2xl h-10 font-black text-[10px] tracking-widest gap-2 border-2 opacity-60 hover:opacity-100" onClick={initializeWithDefaultLayout}>
                <History className="w-3.5 h-3.5" /> RESET TEMPLATE
              </Button>
            </div>
          </div>
        </aside>

        {/* ── SECTION EDITOR (RIGHT) ── */}
        <main className="flex-1 bg-background overflow-hidden flex flex-col relative">
          {selectedSection ? (
            <ScrollArea className="flex-1">
              <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 md:space-y-8">
                {/* ── Meta Settings ── */}
                <section className="bg-muted/30 p-6 rounded-2xl border-2 border-border space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-2.5 rounded-xl">
                      {(() => {
                        const Icon = SECTION_TYPES.find(t => t.type === selectedSection.type)?.icon || Layout;
                        return <Icon className="w-5 h-5 text-primary" />;
                      })()}
                    </div>
                    <div className="flex-1">
                      <Input 
                        value={selectedSection.name || ''} 
                        onChange={e => updateSelectedSectionMeta({ name: e.target.value })}
                        className="text-lg font-black uppercase tracking-tight border-none p-0 h-auto focus-visible:ring-0 bg-transparent"
                        placeholder="Internal Label..."
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-4 pt-4 border-t border-border/50">
                    <Label className="text-[10px] font-black uppercase opacity-40">Section Top Label (Optional)</Label>
                    <Input 
                      placeholder="e.g. EXPLORE MORE"
                      value={selectedSection.draft.topLabel || ''} 
                      onChange={e => updateSelectedSection({ topLabel: e.target.value })}
                      className="h-9 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-40">Background Color</Label>
                      <Input 
                        value={selectedSection.draft.backgroundColor || '#ffffff'} 
                        onChange={e => updateSelectedSection({ backgroundColor: e.target.value })}
                        className="h-9 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-40">Section Spacing</Label>
                      <Select value={selectedSection.draft.padding || '0px'} onValueChange={v => updateSelectedSection({ padding: v })}>
                        <SelectTrigger className="h-9 rounded-lg text-xs font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-xl">
                          {PADDING_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-40">Title Font Size</Label>
                      <Input 
                        placeholder="e.g. 42px or 3rem"
                        value={selectedSection.draft.titleSize || ''} 
                        onChange={e => updateSelectedSection({ titleSize: e.target.value })}
                        className="h-9 rounded-lg text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-40">Title Font Weight</Label>
                      <Select value={selectedSection.draft.titleWeight || '900'} onValueChange={v => updateSelectedSection({ titleWeight: v })}>
                        <SelectTrigger className="h-9 rounded-lg text-xs font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-xl">
                          <SelectItem value="300">Light (300)</SelectItem>
                          <SelectItem value="400">Regular (400)</SelectItem>
                          <SelectItem value="500">Medium (500)</SelectItem>
                          <SelectItem value="600">Semi-Bold (600)</SelectItem>
                          <SelectItem value="700">Bold (700)</SelectItem>
                          <SelectItem value="800">Extra-Bold (800)</SelectItem>
                          <SelectItem value="900">Black (900)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-40">Title Style</Label>
                      <Select value={selectedSection.draft.titleStyle || 'standard'} onValueChange={v => updateSelectedSection({ titleStyle: v })}>
                        <SelectTrigger className="h-9 rounded-lg text-xs font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-xl">
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="boxed">Boxed (Rounded Border)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase opacity-40">Wavy Edges</Label>
                      <Select value={selectedSection.draft.wavyEdges ? 'true' : 'false'} onValueChange={v => updateSelectedSection({ wavyEdges: v === 'true' })}>
                        <SelectTrigger className="h-9 rounded-lg text-xs font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-xl">
                          <SelectItem value="false">None (Flat)</SelectItem>
                          <SelectItem value="true">Scalloped (Wavy)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                {/* ── Type-Specific Editor ── */}
                <div className={selectedSection.locked ? 'opacity-50 pointer-events-none' : ''}>
                  {selectedSection.type === 'hero' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="space-y-4">
                        <ImageUpload 
                          label="Single Background Image (Overrides Slideshow)" 
                          value={selectedSection.draft.backgroundImage} 
                          onUpload={url => updateSelectedSection({ backgroundImage: url })} 
                        />
                      </div>

                      <div className="space-y-4 pt-4 border-t border-border">
                        <Label className="text-xs font-black uppercase tracking-widest text-primary">Hero Slideshow (5-10 Photos)</Label>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest italic mb-2">
                          If "Single Background Image" is empty, these photos will display as an animated cross-fading slideshow.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4">
                          {(selectedSection.draft.slides || []).map((slide: any, i: number) => (
                            <div key={i} className="p-4 bg-muted/20 rounded-2xl border-2 relative group">
                              <button 
                                onClick={() => {
                                  const next = [...selectedSection.draft.slides];
                                  next.splice(i, 1);
                                  updateSelectedSection({ slides: next });
                                }}
                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                              <ImageUpload 
                                label={`Slide #${i + 1}`} 
                                value={slide.image || slide.url} 
                                onUpload={url => {
                                  const next = [...selectedSection.draft.slides];
                                  next[i] = { ...next[i], image: url, url: url };
                                  updateSelectedSection({ slides: next });
                                }} 
                              />
                            </div>
                          ))}
                          
                          <div className="grid grid-cols-2 gap-4 col-span-2 mt-2">
                            <Button variant="outline" className="h-36 rounded-2xl border-2 border-dashed font-black text-[10px] tracking-widest gap-2 flex flex-col items-center justify-center hover:bg-muted/30" onClick={() => {
                               const next = [...(selectedSection.draft.slides || []), { image: '', url: '' }];
                               updateSelectedSection({ slides: next });
                            }}>
                               <Plus className="w-4 h-4" />
                               <span>ADD PHOTO ROW</span>
                            </Button>
                            <div className="h-36">
                              <ImageUpload
                                compact
                                multiple
                                label=""
                                value=""
                                onUpload={() => {}}
                                onMultipleUpload={(urls) => {
                                  const newSlides = urls.map(url => ({ image: url, url: url }));
                                  const next = [...(selectedSection.draft.slides || []), ...newSlides];
                                  updateSelectedSection({ slides: next });
                                }}
                                className="h-full [&>div]:h-full [&>div]:justify-between"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-border">
                        <Label className="text-xs font-black uppercase tracking-widest">Overlay Opacity ({selectedSection.draft.overlayOpacity || 30}%)</Label>
                        <input 
                          type="range" 
                          min="0" max="80" 
                          value={selectedSection.draft.overlayOpacity || 30} 
                          onChange={e => updateSelectedSection({ overlayOpacity: parseInt(e.target.value) })}
                          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-8">
                        <div className="space-y-3">
                          <Label className="text-xs font-black uppercase tracking-widest">CTA Text</Label>
                          <Input value={selectedSection.draft.ctaText || ''} onChange={e => updateSelectedSection({ ctaText: e.target.value })} className="rounded-xl border-2 font-bold" />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-xs font-black uppercase tracking-widest">CTA Link</Label>
                          <Input value={selectedSection.draft.ctaLink || ''} onChange={e => updateSelectedSection({ ctaLink: e.target.value })} className="rounded-xl border-2 font-bold" />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-xs font-black uppercase tracking-widest">CTA Style</Label>
                          <Select value={selectedSection.draft.ctaStyle || 'primary'} onValueChange={v => updateSelectedSection({ ctaStyle: v })}>
                            <SelectTrigger className="rounded-xl border-2 font-bold"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-xl border-2">
                              <SelectItem value="primary" className="font-bold uppercase text-[10px] tracking-widest">PRIMARY GOLD</SelectItem>
                              <SelectItem value="secondary" className="font-bold uppercase text-[10px] tracking-widest">SECONDARY DARK</SelectItem>
                              <SelectItem value="outline" className="font-bold uppercase text-[10px] tracking-widest">WHITE OUTLINE</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedSection.type === 'rich_text' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest">Section Heading (Optional)</Label>
                        <Input value={selectedSection.draft.title || ''} onChange={e => updateSelectedSection({ title: e.target.value })} className="text-xl font-bold h-14 rounded-2xl border-2" />
                      </div>
                      <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest">Content Body</Label>
                        <RichTextEditor 
                          content={selectedSection.draft.body || ''} 
                          onChange={c => updateSelectedSection({ body: c })}
                          placeholder="Tell your story here..."
                        />
                      </div>
                      <div className="space-y-4 p-6 bg-muted/30 rounded-2xl border-2 border-dashed">
                        <Label className="text-xs font-black uppercase tracking-widest">Content Max Width</Label>
                        <div className="flex gap-4">
                          {['narrow', 'normal', 'full'].map(w => (
                            <Button 
                              key={w}
                              variant={selectedSection.draft.maxWidth === w ? 'default' : 'outline'}
                              onClick={() => updateSelectedSection({ maxWidth: w })}
                              className="flex-1 rounded-xl font-black text-[10px] tracking-widest uppercase"
                            >
                              {w}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {(selectedSection.type === 'featured_trips' || selectedSection.type === 'trending_trips') && (
                    <div className="space-y-6">
                       <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest">Section Title</Label>
                        <Input value={selectedSection.draft.title || ''} onChange={e => updateSelectedSection({ title: e.target.value })} className="text-xl font-bold h-14 rounded-2xl border-2" />
                      </div>
                      <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest">Select Trips to Showcase</Label>
                        <div className="grid grid-cols-2 gap-4">
                          {dbTrips.map(trip => (
                            <div 
                              key={trip.id} 
                              onClick={() => {
                                const current = selectedSection.draft.tripIds || [];
                                const updated = current.includes(trip.id) ? current.filter((id:any) => id !== trip.id) : [...current, trip.id];
                                updateSelectedSection({ tripIds: updated });
                              }}
                              className={`p-3 rounded-2xl border-2 flex items-center gap-4 cursor-pointer transition-all ${
                                (selectedSection.draft.tripIds || []).includes(trip.id) ? 'border-primary bg-primary/5 ring-4 ring-primary/5' : 'border-border hover:border-primary/30'
                              }`}
                            >
                              <img src={trip.images?.[0]} className="w-12 h-12 rounded-lg object-cover" alt="" />
                              <div className="flex-1 overflow-hidden">
                                <h5 className="text-[11px] font-black uppercase tracking-tight truncate">{trip.title}</h5>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase">{trip.duration}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedSection.type === 'image_gallery' && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest">Gallery Title</Label>
                        <Input value={selectedSection.draft.title || ''} onChange={e => updateSelectedSection({ title: e.target.value })} className="text-xl font-bold h-14 rounded-2xl border-2" />
                      </div>
                      <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest">Manage Images</Label>
                        <div className="space-y-3">
                          {(selectedSection.draft.images || []).map((img:any, i:number) => (
                            <div key={i} className="bg-muted/20 p-6 rounded-2xl border-2 space-y-4">
                               <div className="flex justify-between items-center">
                                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Image #{i+1}</Label>
                                  <Button variant="ghost" size="icon" onClick={() => {
                                    const next = selectedSection.draft.images.filter((_:any, idx:number) => idx !== i);
                                    updateSelectedSection({ images: next });
                                  }}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                               </div>
                               <ImageUpload 
                                  value={img.url} 
                                  onUpload={url => {
                                    const next = [...selectedSection.draft.images];
                                    next[i].url = url;
                                    updateSelectedSection({ images: next });
                                  }} 
                               />
                               <Input 
                                  value={img.alt} 
                                  onChange={e => {
                                    const next = [...selectedSection.draft.images];
                                    next[i].alt = e.target.value;
                                    updateSelectedSection({ images: next });
                                  }} 
                                  placeholder="Caption / Alt Text" 
                                  className="rounded-xl border-2 text-xs font-bold" 
                               />
                            </div>
                          ))}
                          <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" className="h-32 rounded-2xl border-2 border-dashed font-black text-[10px] tracking-widest gap-2 flex flex-col items-center justify-center hover:bg-muted/30" onClick={() => {
                               const next = [...(selectedSection.draft.images || []), { url: '', alt: '' }];
                               updateSelectedSection({ images: next });
                            }}>
                               <Plus className="w-4 h-4" />
                               <span>ADD IMAGE ROW</span>
                            </Button>
                            <div className="h-32">
                              <ImageUpload
                                compact
                                multiple
                                label=""
                                value=""
                                onUpload={() => {}}
                                onMultipleUpload={(urls) => {
                                  const newImages = urls.map(url => ({ url, alt: '' }));
                                  const next = [...(selectedSection.draft.images || []), ...newImages];
                                  updateSelectedSection({ images: next });
                                }}
                                className="h-full [&>div]:h-full [&>div]:justify-between"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedSection.type === 'photo_grid' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <Label className="text-xs font-black uppercase tracking-widest">Main Title</Label>
                          <Input value={selectedSection.draft.title || ''} onChange={e => updateSelectedSection({ title: e.target.value })} className="text-xl font-bold h-14 rounded-2xl border-2" />
                        </div>
                        <div className="space-y-4">
                          <Label className="text-xs font-black uppercase tracking-widest">Subtitle</Label>
                          <Input value={selectedSection.draft.subtitle || ''} onChange={e => updateSelectedSection({ subtitle: e.target.value })} className="text-xl font-bold h-14 rounded-2xl border-2" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest">Grid Memories</Label>
                        <div className="grid grid-cols-2 gap-6">
                          {(selectedSection.draft.images || []).map((img:any, i:number) => (
                            <div key={i} className="bg-muted/20 p-6 rounded-3xl border-2 space-y-4">
                               <div className="flex justify-between items-center">
                                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Photo #{i+1}</Label>
                                  <Button variant="ghost" size="icon" onClick={() => {
                                    const next = selectedSection.draft.images.filter((_:any, idx:number) => idx !== i);
                                    updateSelectedSection({ images: next });
                                  }}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                               </div>
                               <ImageUpload 
                                  value={img.url} 
                                  onUpload={url => {
                                    const next = [...selectedSection.draft.images];
                                    next[i].url = url;
                                    updateSelectedSection({ images: next });
                                  }} 
                               />
                               <Input 
                                  value={img.alt} 
                                  onChange={e => {
                                    const next = [...selectedSection.draft.images];
                                    next[i].alt = e.target.value;
                                    updateSelectedSection({ images: next });
                                  }} 
                                  placeholder="What's happening here?" 
                                  className="rounded-xl border-2 text-xs font-bold" 
                               />
                            </div>
                          ))}
                          <div className="grid grid-cols-2 gap-4 col-span-2">
                            <Button variant="outline" className="h-44 rounded-3xl border-2 border-dashed font-black text-[10px] tracking-widest gap-2 flex flex-col items-center justify-center hover:bg-muted/30" onClick={() => {
                               const next = [...(selectedSection.draft.images || []), { url: '', alt: '' }];
                               updateSelectedSection({ images: next });
                            }}>
                               <Plus className="w-6 h-6" />
                               <span>ADD PHOTO ROW</span>
                            </Button>
                            <div className="h-44">
                              <ImageUpload
                                compact
                                multiple
                                label=""
                                value=""
                                onUpload={() => {}}
                                onMultipleUpload={(urls) => {
                                  const newImages = urls.map(url => ({ url, alt: '' }));
                                  const next = [...(selectedSection.draft.images || []), ...newImages];
                                  updateSelectedSection({ images: next });
                                }}
                                className="h-full [&>div]:h-full [&>div]:justify-between"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                      {/* ── VIDEO SECTION ── */}
                      {selectedSection.type === 'video_section' && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="text-xs font-black uppercase tracking-widest">Section Title</Label>
                              <Input value={selectedSection.draft.title || ''} onChange={e => updateSelectedSection({ title: e.target.value })} className="rounded-xl border-2 font-bold" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-black uppercase tracking-widest">Subtitle</Label>
                              <Input value={selectedSection.draft.subtitle || ''} onChange={e => updateSelectedSection({ subtitle: e.target.value })} className="rounded-xl border-2 font-bold" />
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <Label className="text-xs font-black uppercase tracking-widest">YouTube Videos</Label>
                            <div className="space-y-4">
                              {(selectedSection.draft.videos || []).map((vid:any, i:number) => (
                                <div key={i} className="bg-muted/20 p-6 rounded-3xl border-2 space-y-4">
                                  <div className="flex justify-between items-center">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Video #{i+1}</Label>
                                    <Button variant="ghost" size="icon" onClick={() => {
                                      const next = selectedSection.draft.videos.filter((_:any, idx:number) => idx !== i);
                                      updateSelectedSection({ videos: next });
                                    }}>
                                      <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label className="text-[10px] font-black uppercase tracking-widest">Video Title</Label>
                                      <Input value={vid.title} onChange={e => {
                                        const next = [...selectedSection.draft.videos];
                                        next[i].title = e.target.value;
                                        updateSelectedSection({ videos: next });
                                      }} className="rounded-xl border-2 text-xs font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-[10px] font-black uppercase tracking-widest">YouTube Video ID (Legacy Fallback)</Label>
                                      <Input value={vid.id} onChange={e => {
                                        const next = [...selectedSection.draft.videos];
                                        next[i].id = e.target.value;
                                        updateSelectedSection({ videos: next });
                                      }} placeholder="e.g. j6hb-iOZalE" className="rounded-xl border-2 text-xs font-bold" />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <VideoUpload
                                      label="Upload Self-Hosted Video"
                                      value={vid.videoUrl}
                                      onUpload={({ url, publicId, posterUrl }) => {
                                        const next = [...selectedSection.draft.videos];
                                        next[i].videoUrl = url;
                                        next[i].videoPublicId = publicId;
                                        next[i].videoPosterUrl = posterUrl || next[i].videoPosterUrl;
                                        next[i].videoEnabled = url ? true : false;
                                        updateSelectedSection({ videos: next });
                                      }}
                                    />
                                    <ImageUpload
                                      label="Video Poster Image"
                                      value={vid.videoPosterUrl}
                                      onUpload={url => {
                                        const next = [...selectedSection.draft.videos];
                                        next[i].videoPosterUrl = url;
                                        updateSelectedSection({ videos: next });
                                      }}
                                    />
                                  </div>

                                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border">
                                    <Label className="text-[10px] font-black uppercase tracking-widest">Enable Self-Hosted Video</Label>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = [...selectedSection.draft.videos];
                                        next[i].videoEnabled = !next[i].videoEnabled;
                                        updateSelectedSection({ videos: next });
                                      }}
                                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                                        vid.videoEnabled ? 'bg-primary' : 'bg-slate-200'
                                      }`}
                                    >
                                      <span
                                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                          vid.videoEnabled ? 'translate-x-4' : 'translate-x-1'
                                        }`}
                                      />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <Button variant="outline" className="w-full rounded-2xl border-2 border-dashed h-16 font-black text-[10px] tracking-widest gap-2" onClick={() => {
                                const next = [...(selectedSection.draft.videos || []), { title: '', id: '' }];
                                updateSelectedSection({ videos: next });
                              }}>
                                <Plus className="w-4 h-4" /> ADD VIDEO ID
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── JOURNAL SECTION ── */}
                      {selectedSection.type === 'journal' && (
                        <div className="space-y-6">
                           <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest">Section Title</Label>
                                <Input value={selectedSection.draft.title || ''} onChange={e => updateSelectedSection({ title: e.target.value })} className="rounded-xl border-2 font-bold" />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest">Subtitle</Label>
                                <Input value={selectedSection.draft.subtitle || ''} onChange={e => updateSelectedSection({ subtitle: e.target.value })} className="rounded-xl border-2 font-bold" />
                              </div>
                           </div>
                        </div>
                      )}

                      {/* ── REALITY SECTION ── */}
                      {selectedSection.type === 'reality' && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="text-xs font-black uppercase tracking-widest">Main Title</Label>
                              <Input value={selectedSection.draft.title || ''} onChange={e => updateSelectedSection({ title: e.target.value })} className="rounded-xl border-2 font-bold" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-black uppercase tracking-widest">Subtitle</Label>
                              <Input value={selectedSection.draft.subtitle || ''} onChange={e => updateSelectedSection({ subtitle: e.target.value })} className="rounded-xl border-2 font-bold" />
                            </div>
                          </div>
                          <div className="space-y-4">
                            <Label className="text-xs font-black uppercase tracking-widest">Reality Videos</Label>
                            <div className="space-y-4">
                              {(selectedSection.draft.videos || []).map((vid:any, i:number) => (
                                <div key={i} className="bg-muted/20 p-6 rounded-3xl border-2 space-y-4">
                                  <div className="flex justify-between items-center">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Video #{i+1}</Label>
                                    <Button variant="ghost" size="icon" onClick={() => {
                                      const next = selectedSection.draft.videos.filter((_:any, idx:number) => idx !== i);
                                      updateSelectedSection({ videos: next });
                                    }}>
                                      <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label className="text-[10px] font-black uppercase tracking-widest">Video Title</Label>
                                      <Input value={vid.title} onChange={e => {
                                        const next = [...selectedSection.draft.videos];
                                        next[i].title = e.target.value;
                                        updateSelectedSection({ videos: next });
                                      }} className="rounded-xl border-2 text-xs font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-[10px] font-black uppercase tracking-widest">Video Subtitle</Label>
                                      <Input value={vid.sub} onChange={e => {
                                        const next = [...selectedSection.draft.videos];
                                        next[i].sub = e.target.value;
                                        updateSelectedSection({ videos: next });
                                      }} className="rounded-xl border-2 text-xs font-bold" />
                                    </div>
                                  </div>
                                  <ImageUpload 
                                    label="Thumbnail Image"
                                    value={vid.img} 
                                    onUpload={url => {
                                      const next = [...selectedSection.draft.videos];
                                      next[i].img = url;
                                      updateSelectedSection({ videos: next });
                                    }} 
                                  />
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <VideoUpload
                                      label="Upload Self-Hosted Video"
                                      value={vid.videoUrl}
                                      onUpload={({ url, publicId, posterUrl }) => {
                                        const next = [...selectedSection.draft.videos];
                                        next[i].videoUrl = url;
                                        next[i].videoPublicId = publicId;
                                        next[i].videoPosterUrl = posterUrl || next[i].videoPosterUrl;
                                        next[i].videoEnabled = url ? true : false;
                                        updateSelectedSection({ videos: next });
                                      }}
                                    />
                                    <ImageUpload
                                      label="Video Poster Image"
                                      value={vid.videoPosterUrl}
                                      onUpload={url => {
                                        const next = [...selectedSection.draft.videos];
                                        next[i].videoPosterUrl = url;
                                        updateSelectedSection({ videos: next });
                                      }}
                                    />
                                  </div>

                                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border">
                                    <Label className="text-[10px] font-black uppercase tracking-widest">Enable Self-Hosted Video</Label>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = [...selectedSection.draft.videos];
                                        next[i].videoEnabled = !next[i].videoEnabled;
                                        updateSelectedSection({ videos: next });
                                      }}
                                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                                        vid.videoEnabled ? 'bg-primary' : 'bg-slate-200'
                                      }`}
                                    >
                                      <span
                                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                          vid.videoEnabled ? 'translate-x-4' : 'translate-x-1'
                                        }`}
                                      />
                                    </button>
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest">Legacy YouTube URL (Optional Fallback)</Label>
                                    <Input value={vid.url} onChange={e => {
                                      const next = [...selectedSection.draft.videos];
                                      next[i].url = e.target.value;
                                      updateSelectedSection({ videos: next });
                                    }} className="rounded-xl border-2 text-xs font-bold" />
                                  </div>
                                </div>
                              ))}
                              <Button variant="outline" className="w-full rounded-2xl border-2 border-dashed h-16 font-black text-[10px] tracking-widest gap-2" onClick={() => {
                                const next = [...(selectedSection.draft.videos || []), { title: '', sub: '', img: '', url: '' }];
                                updateSelectedSection({ videos: next });
                              }}>
                                <Plus className="w-4 h-4" /> ADD REALITY VIDEO
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}


                      {selectedSection.type === 'cta_banner' && (
                    <div className="space-y-6">

                      <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest">Banner Title</Label>
                        <Input value={selectedSection.draft.title || ''} onChange={e => updateSelectedSection({ title: e.target.value })} className="text-xl font-bold h-14 rounded-2xl border-2" placeholder="e.g. Winter Trips" />
                      </div>
                      <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest">Tagline (Above Title)</Label>
                        <Input value={selectedSection.draft.tagline || ''} onChange={e => updateSelectedSection({ tagline: e.target.value })} className="rounded-xl border-2 font-bold" placeholder="e.g. It's time for" />
                      </div>
                      <ImageUpload 
                        label="Background Image" 
                        value={selectedSection.draft.backgroundImage} 
                        onUpload={url => updateSelectedSection({ backgroundImage: url })} 
                      />
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label className="text-xs font-black uppercase tracking-widest">CTA Button Text</Label>
                          <Input value={selectedSection.draft.ctaText || ''} onChange={e => updateSelectedSection({ ctaText: e.target.value })} className="rounded-xl border-2 font-bold" placeholder="Explore Now" />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-xs font-black uppercase tracking-widest">CTA Link</Label>
                          <Input value={selectedSection.draft.ctaLink || ''} onChange={e => updateSelectedSection({ ctaLink: e.target.value })} className="rounded-xl border-2 font-bold" placeholder="/tour-packages" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── UPCOMING TRIPS SECTION ── */}
                  {selectedSection.type === 'upcoming_trips' && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest">Section Heading</Label>
                        <Input value={selectedSection.draft.title || ''} onChange={e => updateSelectedSection({ title: e.target.value })} className="text-lg font-bold h-12 rounded-xl border-2" placeholder="Upcoming Community Trips" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black opacity-50 uppercase tracking-widest">Section Subtitle</Label>
                        <Input value={selectedSection.draft.subtitle || ''} onChange={e => updateSelectedSection({ subtitle: e.target.value })} className="rounded-xl border-2" placeholder="Brief description below title" />
                      </div>
                      <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest text-primary">Batch / Departure Months</Label>
                        <div className="flex flex-wrap gap-2 p-4 bg-muted/20 rounded-[24px] border-2 border-dashed min-h-[80px]">
                          {(selectedSection.draft.months || []).map((m: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase shadow-lg group">
                              {m}
                              <button 
                                onClick={() => {
                                  const next = (selectedSection.draft.months || []).filter((_: any, i: number) => i !== idx);
                                  updateSelectedSection({ months: next });
                                }}
                                className="hover:text-black transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <div className="flex items-center gap-2 flex-1 min-w-[120px]">
                            <Input 
                              placeholder="Type and press Comma or Enter"
                              className="h-8 border-none bg-transparent text-[10px] font-bold uppercase focus-visible:ring-0 p-0"
                              onKeyDown={(e) => {
                                if (e.key === ',' || e.key === 'Enter') {
                                  e.preventDefault();
                                  const val = (e.currentTarget.value || '').trim().toUpperCase();
                                  if (val) {
                                    const next = Array.from(new Set([...(selectedSection.draft.months || []), val]));
                                    updateSelectedSection({ months: next });
                                    e.currentTarget.value = '';
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">Type a month (e.g. MAY 26) and press Enter to add as a box</p>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-black uppercase tracking-widest">Select Trips (Manual Selection)</Label>
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                            {(() => {
                              const selectedMonthsClean = (selectedSection.draft.months || []).map((m: string) => m.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''));
                              const filtered = dbTrips.filter(trip => {
                                 if (selectedMonthsClean.length === 0) return true;
                                 try {
                                   const datesArr = typeof trip.availableDates === 'string' ? JSON.parse(trip.availableDates) : trip.availableDates;
                                   if (!datesArr || !Array.isArray(datesArr)) return false;
                                   return datesArr.some((d: any) => {
                                     const ds = d.date || d;
                                     let date;
                                     if (typeof ds === 'string' && /^\d{4}-\d{2}-\d{2}/.test(ds)) {
                                       const [y, m, day] = ds.split('-').map(Number);
                                       date = new Date(y, m - 1, day);
                                     } else { date = new Date(ds); }
                                     if (isNaN(date.getTime())) return false;
                                     const mName = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                                     const mYear = date.toLocaleString('en-US', { year: '2-digit' });
                                     const mFull = `${mName} '${mYear}`;
                                     return selectedMonthsClean.includes(mName) || selectedMonthsClean.includes(mFull) || selectedMonthsClean.includes(mName+mYear);
                                   });
                                 } catch (e) { return false; }
                               });
                               return `Showing ${filtered.length} of ${dbTrips.length} trips`;
                            })()}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {(() => {
                            const selectedMonthsClean = (selectedSection.draft.months || []).map((m: string) => m.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''));
                            const currentTripIds = selectedSection.draft.tripIds || [];

                            // 1. Calculate filtered trips
                            const filteredTrips = dbTrips.filter(trip => {
                              if (selectedMonthsClean.length === 0) return true;
                              try {
                                const datesArr = typeof trip.availableDates === 'string' ? JSON.parse(trip.availableDates) : trip.availableDates;
                                if (!datesArr || !Array.isArray(datesArr)) return false;
                                return datesArr.some((d: any) => {
                                  const ds = d.date || d;
                                  let date;
                                  if (typeof ds === 'string' && /^\d{4}-\d{2}-\d{2}/.test(ds)) {
                                    const [y, m, day] = ds.split('-').map(Number);
                                    date = new Date(y, m - 1, day);
                                  } else { date = new Date(ds); }
                                  if (isNaN(date.getTime())) return false;
                                  const mName = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                                  const mYear = date.toLocaleString('en-US', { year: '2-digit' });
                                  const mFull = `${mName} '${mYear}`;
                                  return selectedMonthsClean.includes(mName) || selectedMonthsClean.includes(mFull) || selectedMonthsClean.includes(mName+mYear);
                                });
                              } catch (e) { return false; }
                            });

                            // 2. Combine: Always show currently selected trips + filtered results
                            const alreadySelected = dbTrips.filter(t => currentTripIds.includes(t.id));
                            const notSelectedButFiltered = filteredTrips.filter(t => !currentTripIds.includes(t.id));
                            
                            const displayTrips = Array.from(new Set([...alreadySelected, ...notSelectedButFiltered]));

                            if (displayTrips.length === 0) {
                              return (
                                <div className="col-span-2 p-8 text-center bg-muted/10 rounded-2xl border-2 border-dashed">
                                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">No trips found for selected months</p>
                                  <Button variant="link" onClick={() => updateSelectedSection({ months: [] })} className="text-[10px] font-bold underline">Show All Trips</Button>
                                </div>
                              );
                            }

                            return displayTrips.map(trip => (
                              <div 
                                key={trip.id} 
                                onClick={() => {
                                  const updated = currentTripIds.includes(trip.id) ? currentTripIds.filter((id:any) => id !== trip.id) : [...currentTripIds, trip.id];
                                  updateSelectedSection({ tripIds: updated });
                                }}
                                className={`p-3 rounded-2xl border-2 flex items-center gap-4 cursor-pointer transition-all ${
                                  currentTripIds.includes(trip.id) ? 'border-primary bg-primary/5 ring-4 ring-primary/5' : 'border-border hover:border-primary/30'
                                }`}
                              >
                                <img src={trip.images?.[0]} className="w-12 h-12 rounded-lg object-cover" alt="" />
                                <div className="flex-1 overflow-hidden">
                                  <h5 className="text-[11px] font-black uppercase tracking-tight truncate">{trip.title}</h5>
                                  <p className="text-[9px] font-bold text-muted-foreground uppercase">{trip.duration}</p>
                                </div>
                                {currentTripIds.includes(trip.id) && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── BESTIE SECTION ── */}
                  {selectedSection.type === 'bestie' && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest">Main Title</Label>
                        <Input value={selectedSection.draft.title || ''} onChange={e => updateSelectedSection({ title: e.target.value })} className="text-lg font-bold h-12 rounded-xl border-2" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black opacity-50 uppercase tracking-widest">Section Subtitle</Label>
                        <Input value={selectedSection.draft.subtitle || ''} onChange={e => updateSelectedSection({ subtitle: e.target.value })} className="rounded-xl border-2" />
                      </div>
                      <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest">Reason Cards</Label>
                        <div className="space-y-4">
                          {(selectedSection.draft.reasons || []).map((reason: any, i: number) => (
                            <div key={i} className="bg-muted/20 p-6 rounded-3xl border-2 space-y-4">
                              <div className="flex justify-between items-center">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Reason #{i+1}</Label>
                                <Button variant="ghost" size="icon" onClick={() => {
                                  const next = (selectedSection.draft.reasons || []).filter((_:any, idx:number) => idx !== i);
                                  updateSelectedSection({ reasons: next });
                                }}>
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Sticker Image</Label>
                                  <ImageUpload 
                                    label="Sticker" 
                                    value={reason.image} 
                                    onUpload={url => {
                                      const next = selectedSection.draft.reasons.map((r: any, idx: number) => 
                                        idx === i ? { ...r, image: url } : r
                                      );
                                      updateSelectedSection({ reasons: next });
                                    }} 
                                  />
                                </div>
                                <div className="space-y-4 pt-4">
                                  <Input value={reason.title} onChange={e => {
                                    const next = [...selectedSection.draft.reasons];
                                    next[i].title = e.target.value;
                                    updateSelectedSection({ reasons: next });
                                  }} placeholder="Title" className="rounded-xl border-2 font-bold" />
                                  <Textarea value={reason.desc} onChange={e => {
                                    const next = [...selectedSection.draft.reasons];
                                    next[i].desc = e.target.value;
                                    updateSelectedSection({ reasons: next });
                                  }} placeholder="Description" className="rounded-xl border-2 text-xs font-medium min-h-[100px]" />
                                </div>
                              </div>
                            </div>
                          ))}
                          <Button variant="outline" className="w-full rounded-2xl border-2 border-dashed h-16 font-black text-[10px] tracking-widest" onClick={() => {
                            const next = [...(selectedSection.draft.reasons || []), { title: '', desc: '', image: '' }];
                            updateSelectedSection({ reasons: next });
                          }}>
                            <Plus className="w-4 h-4 mr-2" /> ADD REASON CARD
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedSection.type === 'destinations' && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest">Section Title</Label>
                        <Input value={selectedSection.draft.title || ''} onChange={e => updateSelectedSection({ title: e.target.value })} className="text-lg font-bold h-12 rounded-xl border-2" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black opacity-50 uppercase tracking-widest">Section Subtitle</Label>
                        <Input value={selectedSection.draft.subtitle || ''} onChange={e => updateSelectedSection({ subtitle: e.target.value })} className="rounded-xl border-2" />
                      </div>
                      <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest">Destination Cards</Label>
                        <div className="grid grid-cols-2 gap-4">
                          {(selectedSection.draft.destinations || []).map((dest: any, i: number) => (
                            <div key={i} className="bg-muted/20 p-6 rounded-3xl border-2 space-y-4 relative group">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  const next = (selectedSection.draft.destinations || []).filter((_:any, idx:number) => idx !== i);
                                  updateSelectedSection({ destinations: next });
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                              <ImageUpload 
                                label="Cover Image" 
                                value={dest.img} 
                                onUpload={url => {
                                  const next = selectedSection.draft.destinations.map((d: any, idx: number) => 
                                    idx === i ? { ...d, img: url } : d
                                  );
                                  updateSelectedSection({ destinations: next });
                                }} 
                              />
                              <Input 
                                value={dest.name} 
                                onChange={e => {
                                  const next = [...selectedSection.draft.destinations];
                                  next[i].name = e.target.value.toUpperCase();
                                  updateSelectedSection({ destinations: next });
                                }} 
                                placeholder="DESTINATION NAME" 
                                className="rounded-xl border-2 font-black text-center" 
                              />
                            </div>
                          ))}
                          <Button variant="outline" className="h-full min-h-[240px] rounded-3xl border-2 border-dashed font-black text-[10px] tracking-widest flex flex-col gap-2" onClick={() => {
                            const next = [...(selectedSection.draft.destinations || []), { name: '', img: '' }];
                            updateSelectedSection({ destinations: next });
                          }}>
                            <Plus className="w-6 h-6" /> ADD DESTINATION
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedSection.type === 'cta_slider' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest">Section Title</Label>
                        <Input value={selectedSection.draft.title || ''} onChange={e => updateSelectedSection({ title: e.target.value })} className="h-14 rounded-2xl border-2 font-bold text-lg" />
                      </div>

                      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border">
                        <div className="flex flex-col gap-1">
                          <Label className="text-xs font-black uppercase tracking-widest">Show Title on Section</Label>
                          <span className="text-[10px] text-muted-foreground font-medium">Render section header and title if enabled</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateSelectedSection({ showTitle: !selectedSection.draft.showTitle })}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                            selectedSection.draft.showTitle ? 'bg-primary' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              selectedSection.draft.showTitle ? 'translate-x-4' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <VideoUpload
                          label="Upload Self-Hosted Video"
                          value={selectedSection.draft.videoUrl || ''}
                          onUpload={({ url, publicId, posterUrl }) => {
                            updateSelectedSection({
                              videoUrl: url,
                              videoPublicId: publicId,
                              videoPosterUrl: posterUrl || selectedSection.draft.videoPosterUrl,
                              videoEnabled: !!url
                            });
                          }}
                        />
                        <ImageUpload
                          label="Video Poster Image"
                          value={selectedSection.draft.videoPosterUrl || ''}
                          onUpload={url => updateSelectedSection({ videoPosterUrl: url })}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase tracking-widest">Or paste Video URL directly</Label>
                          <Input 
                            value={selectedSection.draft.videoUrl || ''} 
                            onChange={e => updateSelectedSection({ videoUrl: e.target.value })} 
                            placeholder="https://example.com/video.mp4" 
                            className="rounded-xl border-2 font-bold" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase tracking-widest">Or paste Poster Image URL directly</Label>
                          <Input 
                            value={selectedSection.draft.videoPosterUrl || ''} 
                            onChange={e => updateSelectedSection({ videoPosterUrl: e.target.value })} 
                            placeholder="https://example.com/image.jpg" 
                            className="rounded-xl border-2 font-bold" 
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest">Border Radius</Label>
                        <Select 
                          value={selectedSection.draft.borderRadius || 'rounded-[20px] md:rounded-[32px]'} 
                          onValueChange={v => updateSelectedSection({ borderRadius: v })}
                        >
                          <SelectTrigger className="h-9 rounded-lg text-xs font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl shadow-xl">
                            <SelectItem value="rounded-none">None (0px)</SelectItem>
                            <SelectItem value="rounded-xl">Extra Large (12px)</SelectItem>
                            <SelectItem value="rounded-[20px] md:rounded-[32px]">Double Extra Large (20px - Default)</SelectItem>
                            <SelectItem value="rounded-3xl">Triple Extra Large (24px)</SelectItem>
                            <SelectItem value="rounded-[32px]">Widescreen Rounded (32px)</SelectItem>
                            <SelectItem value="rounded-[40px]">Max Rounded (40px)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {selectedSection.type === 'cinematic_banner' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="space-y-6">
                        <Label className="text-xs font-black uppercase tracking-widest text-primary">Cinematic Panoramic Slides</Label>
                        <div className="space-y-6">
                          {(selectedSection.draft.slides || []).map((slide: any, i: number) => (
                            <div key={i} className="p-8 bg-muted/20 rounded-[32px] border-2 border-border/50 relative group">
                              <button 
                                onClick={() => {
                                  const next = [...selectedSection.draft.slides];
                                  next.splice(i, 1);
                                  updateSelectedSection({ slides: next });
                                }}
                                className="absolute top-6 right-6 p-2 rounded-xl bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              
                              <div className="grid grid-cols-1 gap-6">
                                <ImageUpload 
                                  label="Panoramic Image (Aspect 3:1)" 
                                  value={slide.image} 
                                  onUpload={url => {
                                    const next = [...selectedSection.draft.slides];
                                    next[i].image = url;
                                    updateSelectedSection({ slides: next });
                                  }} 
                                />
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-[10px] font-black opacity-50 uppercase tracking-widest">Small Subtitle</Label>
                                    <Input value={slide.subtitle} onChange={e => {
                                      const next = [...selectedSection.draft.slides];
                                      next[i].subtitle = e.target.value.toUpperCase();
                                      updateSelectedSection({ slides: next });
                                    }} className="rounded-xl border-2 font-black text-[10px] tracking-[0.2em]" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-[10px] font-black opacity-50 uppercase tracking-widest">Main Title</Label>
                                    <Input value={slide.title} onChange={e => {
                                      const next = [...selectedSection.draft.slides];
                                      next[i].title = e.target.value.toUpperCase();
                                      updateSelectedSection({ slides: next });
                                    }} className="rounded-xl border-2 font-black tracking-tighter" />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-black opacity-50 uppercase tracking-widest">Call-to-Action Link</Label>
                                  <Input value={slide.link} onChange={e => {
                                    const next = [...selectedSection.draft.slides];
                                    next[i].link = e.target.value;
                                    updateSelectedSection({ slides: next });
                                  }} className="rounded-xl border-2 font-mono text-xs" />
                                </div>
                              </div>
                            </div>
                          ))}
                          <Button variant="outline" className="w-full rounded-3xl border-2 border-dashed h-24 font-black text-[10px] tracking-widest gap-2 hover:bg-muted/30" onClick={() => {
                            const next = [...(selectedSection.draft.slides || []), { title: '', subtitle: '', image: '', link: '' }];
                            updateSelectedSection({ slides: next });
                          }}>
                            <Plus className="w-6 h-6" /> ADD NEW PANORAMIC SLIDE
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedSection.type === 'photo_slider' && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest text-primary">Cinematic Photo Slider</Label>
                        <div className="grid grid-cols-2 gap-4">
                          {(selectedSection.draft.slides || []).map((slide: any, i: number) => (
                            <div key={i} className="p-4 bg-muted/20 rounded-2xl border-2 relative group">
                              <button 
                                onClick={() => {
                                  const next = [...selectedSection.draft.slides];
                                  next.splice(i, 1);
                                  updateSelectedSection({ slides: next });
                                }}
                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                              <ImageUpload 
                                label="Slide Image" 
                                value={slide.image} 
                                onUpload={url => {
                                  const next = [...selectedSection.draft.slides];
                                  next[i].image = url;
                                  updateSelectedSection({ slides: next });
                                }} 
                              />
                            </div>
                          ))}
                          <div className="grid grid-cols-2 gap-4 col-span-2">
                            <Button variant="outline" className="h-36 rounded-2xl border-2 border-dashed font-black text-[10px] tracking-widest gap-2 flex flex-col items-center justify-center hover:bg-muted/30" onClick={() => {
                               const next = [...(selectedSection.draft.slides || []), { image: '' }];
                               updateSelectedSection({ slides: next });
                            }}>
                               <Plus className="w-4 h-4" />
                               <span>ADD PHOTO ROW</span>
                            </Button>
                            <div className="h-36">
                              <ImageUpload
                                compact
                                multiple
                                label=""
                                value=""
                                onUpload={() => {}}
                                onMultipleUpload={(urls) => {
                                  const newSlides = urls.map(url => ({ image: url }));
                                  const next = [...(selectedSection.draft.slides || []), ...newSlides];
                                  updateSelectedSection({ slides: next });
                                }}
                                className="h-full [&>div]:h-full [&>div]:justify-between"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}


                  {/* ── SOCIAL PROOF SECTION ── */}
                  {selectedSection.type === 'social_proof' && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest">Trust Stats</Label>
                        <div className="grid grid-cols-2 gap-4">
                          {(selectedSection.draft.stats || []).map((stat: any, i: number) => (
                            <div key={i} className="bg-muted/20 p-6 rounded-3xl border-2 space-y-4">
                              <div className="flex justify-between items-center">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Stat #{i+1}</Label>
                                <Button variant="ghost" size="icon" onClick={() => {
                                  const next = (selectedSection.draft.stats || []).filter((_:any, idx:number) => idx !== i);
                                  updateSelectedSection({ stats: next });
                                }}>
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                              <Input value={stat.label} onChange={e => {
                                const next = [...selectedSection.draft.stats];
                                next[i].label = e.target.value;
                                updateSelectedSection({ stats: next });
                              }} placeholder="e.g. 10,000+ Travelers" className="rounded-xl border-2 font-bold" />
                              <Input value={stat.icon} onChange={e => {
                                const next = [...selectedSection.draft.stats];
                                next[i].icon = e.target.value;
                                updateSelectedSection({ stats: next });
                              }} placeholder="Icon Name" className="rounded-xl border-2 text-[10px] font-mono" />
                            </div>
                          ))}
                          <Button variant="outline" className="h-full min-h-[160px] rounded-3xl border-2 border-dashed font-black text-[10px] tracking-widest flex flex-col gap-2" onClick={() => {
                            const next = [...(selectedSection.draft.stats || []), { label: '', icon: 'users' }];
                            updateSelectedSection({ stats: next });
                          }}>
                            <Plus className="w-4 h-4" /> ADD STAT
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedSection.type === 'reviews' && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest">Section Title (Reviews & Stories)</Label>
                        <Input value={selectedSection.draft.title || ''} onChange={e => updateSelectedSection({ title: e.target.value })} className="text-lg font-bold h-12 rounded-xl border-2" placeholder="What Our Travelers Say" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black opacity-50 uppercase tracking-widest">Section Subtitle</Label>
                        <Input value={selectedSection.draft.subtitle || ''} onChange={e => updateSelectedSection({ subtitle: e.target.value })} className="rounded-xl border-2" />
                      </div>
                      <div className="p-8 bg-primary/5 rounded-[32px] border-2 border-primary/10 flex flex-col items-center justify-center text-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-xl shadow-primary/10">
                          <Star className="w-8 h-8 text-primary fill-primary" />
                        </div>
                        <div>
                          <h4 className="font-black uppercase tracking-tight text-lg">Centralized Reviews</h4>
                          <p className="text-[11px] text-muted-foreground font-medium max-w-sm mx-auto mt-1">
                            This section automatically pulls featured traveler stories from your <span className="text-primary font-bold">Review Center</span>.
                            Go to the sidebar to manage, verify, and feature specific reviews.
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          className="rounded-xl font-black text-[10px] tracking-widest h-10 px-6 border-primary/30 text-primary hover:bg-primary hover:text-white"
                          onClick={() => navigate('/admin/reviews')}
                        >
                          OPEN REVIEW CENTER
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedSection.type === 'vibe' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest">Section Title (Vibe Reels)</Label>
                        <Input 
                          value={selectedSection.draft.title || ''} 
                          onChange={e => updateSelectedSection({ title: e.target.value })} 
                          className="text-lg font-bold h-12 rounded-xl border-2" 
                          placeholder="Vibe with Us" 
                        />
                      </div>
                      <div className="p-8 bg-primary/5 rounded-[32px] border-2 border-primary/10 flex flex-col items-center justify-center text-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-xl shadow-primary/10">
                          <Star className="w-8 h-8 text-primary fill-primary animate-pulse" />
                        </div>
                        <div>
                          <h4 className="font-black uppercase tracking-tight text-lg">Travel Vibe Reels</h4>
                          <p className="text-[11px] text-muted-foreground font-medium max-w-sm mx-auto mt-1">
                            This section displays a cinematic feed of Instagram-style reels highlighting actual trip vibes and user stories.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
               <div className="bg-muted/30 p-10 rounded-[60px] mb-8 border-4 border-dashed border-border/50">
                  <Layout className="w-20 h-20 text-muted-foreground/20" />
               </div>
               <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">{sections.length === 0 ? "Your Canvas is Ready" : "No Section Selected"}</h2>
               <p className="text-muted-foreground max-w-sm font-medium leading-relaxed mb-8">
                 {sections.length === 0 ? "Start from scratch or use our high-fidelity home template to build your cinematic experience." : "Choose a section from the left panel to begin crafting your cinematic experience."}
               </p>
               <div className="flex flex-col gap-4">
                 <Button className="rounded-2xl h-14 px-10 font-black text-[11px] tracking-widest shadow-2xl shadow-primary/20" onClick={() => setTypeModalOpen(true)}>
                    <Plus className="w-5 h-5 mr-2" /> ADD FIRST SECTION
                 </Button>
                 {sections.length === 0 && (
                   <Button variant="outline" className="rounded-2xl h-12 px-10 font-black text-[10px] tracking-widest border-2" onClick={initializeWithDefaultLayout}>
                      <History className="w-4 h-4 mr-2" /> START WITH HOME TEMPLATE
                   </Button>
                 )}
               </div>
            </div>
          )}
          
          {/* ── UNSAVED OVERLAY ── */}
          {saveStatus === 'dirty' && (
            <div className="absolute bottom-6 right-6 flex items-center gap-3 bg-amber-500 text-black px-6 py-3 rounded-full shadow-2xl animate-in fade-in slide-in-from-right-4 duration-500 ring-8 ring-amber-500/10">
              <AlertCircle className="w-4 h-4 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Unsaved Changes</span>
              <div className="w-px h-4 bg-black/20 mx-1" />
              <button onClick={saveDraft} className="text-[10px] font-black uppercase underline tracking-widest hover:opacity-70 transition-opacity">Save Now</button>
            </div>
          )}
        </main>
      </div>

      {/* ── TYPE MODAL ── */}
      <Dialog open={typeModalOpen} onOpenChange={setTypeModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-[40px] border-none shadow-2xl">
          <div className="p-10 border-b border-border bg-muted/20">
             <DialogHeader>
                <DialogTitle className="text-4xl font-black uppercase tracking-tighter">Add New Section</DialogTitle>
                <DialogDescription className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-2 italic">Select a component to expand your page narrative.</DialogDescription>
             </DialogHeader>
          </div>
          
          <ScrollArea className="h-[60vh]">
            <div className="p-10">
               <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {SECTION_TYPES.map(type => (
                     <button 
                        key={type.type}
                        onClick={() => addSection(type.type)}
                        className="group p-6 rounded-[32px] border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left flex flex-col gap-4 relative overflow-hidden"
                     >
                        <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                           <type.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                           <h4 className="font-black uppercase tracking-tight text-lg group-hover:text-primary transition-colors">{type.label}</h4>
                           <p className="text-xs text-muted-foreground font-medium leading-relaxed mt-1">{type.desc}</p>
                        </div>
                        <ChevronRight className="absolute bottom-6 right-6 w-5 h-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                     </button>
                  ))}
               </div>
            </div>
          </ScrollArea>
          
          <div className="p-8 bg-muted/20 border-t border-border flex justify-end">
             <Button variant="ghost" onClick={() => setTypeModalOpen(false)} className="rounded-xl font-black text-[10px] tracking-widest uppercase">Nevermind, go back</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── DELETION CONFIRMATION DIALOG ── */}
      <Dialog open={!!sectionToDelete} onOpenChange={() => setSectionToDelete(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-[40px] border-none shadow-2xl bg-white">
          <div className="p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div>
              <DialogHeader>
                <DialogTitle className="text-3xl font-black uppercase tracking-tighter text-center">Delete Section?</DialogTitle>
                <DialogDescription className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-2 italic text-center">
                  This action is permanent and will remove all content within this section.
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="flex flex-col gap-3">
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
                className="h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-destructive/20"
              >
                Yes, Delete Section
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setSectionToDelete(null)}
                className="h-14 rounded-2xl font-black uppercase tracking-widest text-muted-foreground"
              >
                No, Keep it
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
