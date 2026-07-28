import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Palette, Type, Image, Navigation, CreditCard, MousePointer2, Layers, 
  Smartphone, Clock, Bookmark, History, FileCode, CheckCircle, Save, 
  ArrowLeft, Search, Sliders, Layout, Monitor, Tablet, RefreshCw, Trash2, 
  Eye, EyeOff, Upload, Plus, ChevronRight, HelpCircle
} from 'lucide-react';
import { designService, DesignPresetRecord, DesignVersionRecord } from '@/services/design.service';
import { themeService, ThemeConfig } from '@/services/theme.service';

const CATEGORIES = [
  { id: 'overview', label: 'Overview', icon: Layout },
  { id: 'global', label: 'Global Styles', icon: Sliders },
  { id: 'typography', label: 'Typography', icon: Type },
  { id: 'colors', label: 'Colors', icon: Palette },
  { id: 'layout', label: 'Layout & Spacing', icon: Layers },
  { id: 'header', label: 'Header & Navigation', icon: Navigation },
  { id: 'footer', label: 'Footer', icon: CreditCard },
  { id: 'buttons', label: 'Buttons & Forms', icon: MousePointer2 },
  { id: 'cards', label: 'Cards & Components', icon: CreditCard },
  { id: 'backgrounds', label: 'Background Manager', icon: Image },
  { id: 'pages', label: 'Page Designer', icon: Layout },
  { id: 'sections', label: 'Section Designer', icon: Layers },
  { id: 'mobile', label: 'Mobile Designer', icon: Smartphone },
  { id: 'presets', label: 'Presets & Templates', icon: Bookmark },
  { id: 'css', label: 'Custom CSS', icon: FileCode },
  { id: 'history', label: 'Version History', icon: History }
] as const;

const PAGES = [
  { id: 'homepage', label: 'Homepage' },
  { id: 'trips', label: 'Trip Listing' },
  { id: 'trip-detail', label: 'Trip Details' },
  { id: 'booking', label: 'Booking Page' },
  { id: 'about', label: 'About Us' },
  { id: 'contact', label: 'Contact Page' }
];

const SECTIONS = [
  { id: 'hero', label: 'Hero Banner' },
  { id: 'upcoming_trips', label: 'Upcoming Trips' },
  { id: 'why_us', label: 'Why YouthCamping' },
  { id: 'destinations', label: 'Featured Destinations' },
  { id: 'reviews', label: 'Reviews & Testimonials' },
  { id: 'cta', label: 'Call to Action Section' }
];

export default function DesignControlCenterPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('overview');
  const [selectedPage, setSelectedPage] = useState<string>('homepage');
  const [selectedSection, setSelectedSection] = useState<string>('hero');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Status states
  const [status, setStatus] = useState<'clean' | 'unsaved' | 'saved' | 'published' | 'error'>('clean');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Config data states
  const [config, setConfig] = useState<any>({});
  const [draftConfig, setDraftConfig] = useState<any>({});
  const [versions, setVersions] = useState<DesignVersionRecord[]>([]);
  const [presets, setPresets] = useState<DesignPresetRecord[]>([]);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  
  // Custom CSS state
  const [customCss, setCustomCss] = useState('');

  // Initial load
  useEffect(() => {
    loadDesignData();
  }, [selectedPage, selectedSection]);

  const loadDesignData = async () => {
    setLoading(true);
    try {
      // Determine scope
      let scope = 'global';
      if (activeCategory === 'pages') scope = `page:${selectedPage}`;
      if (activeCategory === 'sections' || activeCategory === 'backgrounds') {
        scope = `section:${selectedPage}:${selectedSection}`;
      }

      // Fetch fallback primary theme first to populate initial defaults
      const primaryTheme = await themeService.get();
      
      // Fetch draft config
      const draft = await designService.getConfig(scope, 'draft');
      const published = await designService.getConfig(scope, 'published');

      const merged = { ...primaryTheme, ...published, ...draft };
      setConfig(merged);
      setDraftConfig(draft || {});
      setCustomCss(merged.customCss || '');

      // Load versions & presets
      const verList = await designService.getVersions(scope);
      setVersions(verList);

      const presetList = await designService.getPresets();
      setPresets(presetList);

      setStatus('clean');
    } catch (err) {
      toast.error('Failed to load design configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: string, value: any) => {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    
    const updatedDraft = { ...draftConfig, [key]: value };
    setDraftConfig(updatedDraft);
    setStatus('unsaved');
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      let scope = 'global';
      if (activeCategory === 'pages') scope = `page:${selectedPage}`;
      if (activeCategory === 'sections' || activeCategory === 'backgrounds') {
        scope = `section:${selectedPage}:${selectedSection}`;
      }

      // Embed custom CSS if in CSS panel
      const configToSave = { ...draftConfig };
      if (activeCategory === 'css') {
        configToSave.customCss = customCss;
      }

      await designService.saveDraft(scope, configToSave);
      toast.success('Draft design configuration saved');
      setStatus('saved');
      loadDesignData();
    } catch (err) {
      toast.error('Failed to save draft configuration');
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      let scope = 'global';
      if (activeCategory === 'pages') scope = `page:${selectedPage}`;
      if (activeCategory === 'sections' || activeCategory === 'backgrounds') {
        scope = `section:${selectedPage}:${selectedSection}`;
      }

      await designService.publish(scope);
      toast.success('Design successfully published to the live frontend!');
      setStatus('published');
      setShowPublishDialog(false);
      loadDesignData();
    } catch (err) {
      toast.error('Failed to publish changes');
    } finally {
      setPublishing(false);
    }
  };

  const handleDiscard = async () => {
    if (!window.confirm('Are you sure you want to discard your unsaved draft changes?')) return;
    try {
      let scope = 'global';
      if (activeCategory === 'pages') scope = `page:${selectedPage}`;
      if (activeCategory === 'sections' || activeCategory === 'backgrounds') {
        scope = `section:${selectedPage}:${selectedSection}`;
      }
      await designService.discardDraft(scope);
      toast.success('Draft configuration discarded');
      loadDesignData();
    } catch (err) {
      toast.error('Failed to discard draft');
    }
  };

  const handleRestore = async (versionId: string) => {
    if (!window.confirm('Are you sure you want to restore this older published version?')) return;
    try {
      await designService.restoreVersion(versionId);
      toast.success('Configuration restored to target version');
      loadDesignData();
    } catch (err) {
      toast.error('Failed to restore version');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA] text-[#333333]">
      {/* Sticky Top Action Bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-3.5 bg-white border-b border-[#E2E8F0] shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/website')}
            className="h-8.5 rounded-[4px] px-2 text-xs font-semibold gap-1.5 text-slate-650 hover:bg-slate-100 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Portal</span>
          </Button>
          <div className="w-px h-5 bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Website</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">Design Control Center</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-xs font-bold text-primary-orange uppercase tracking-wider">
              {CATEGORIES.find(c => c.id === activeCategory)?.label}
            </span>
          </div>
        </div>

        {/* Status label and actions */}
        <div className="flex items-center gap-3">
          {status === 'unsaved' && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-amber-50 text-amber-600 rounded-[4px] border border-amber-200">
              ● Unsaved Changes
            </span>
          )}
          {status === 'saved' && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-blue-50 text-blue-600 rounded-[4px] border border-blue-200">
              ● Draft Saved
            </span>
          )}
          {status === 'published' && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-emerald-50 text-emerald-600 rounded-[4px] border border-emerald-200">
              ✔ Published
            </span>
          )}
          {status === 'clean' && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-slate-50 text-slate-500 rounded-[4px] border border-slate-200">
              No changes
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleDiscard}
            disabled={status === 'clean'}
            className="h-8.5 text-xs text-slate-650 rounded-[4px] border-[#E2E8F0] hover:bg-slate-50"
          >
            Discard
          </Button>

          <Button
            size="sm"
            onClick={handleSaveDraft}
            disabled={status === 'clean' || saving}
            className="h-8.5 text-xs font-semibold rounded-[4px] bg-slate-800 text-white hover:bg-slate-900 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>

          <Button
            size="sm"
            onClick={() => setShowPublishDialog(true)}
            className="h-8.5 text-xs font-semibold rounded-[4px] bg-primary-orange hover:bg-primary-orange/90 text-white"
          >
            Publish Live
          </Button>
        </div>
      </div>

      {/* Main Page Layout */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-60px)]">
        {/* Left Sidebar Menu */}
        <div className="w-[200px] border-r border-[#E2E8F0] bg-white overflow-y-auto flex flex-col justify-between p-3 shrink-0">
          <div className="space-y-1">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    loadDesignData();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-[4px] transition-all text-left ${
                    isActive 
                      ? 'bg-orange-50 text-primary-orange font-semibold border-l-2 border-primary-orange' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary-orange' : 'text-slate-400'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
          <div className="pt-4 border-t border-slate-100 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              YouthCamping OS
            </span>
          </div>
        </div>

        {/* Center Panel (Settings Editor) */}
        <div className="flex-1 bg-[#F8F9FA] overflow-y-auto p-6 border-r border-[#E2E8F0]">
          {/* Breadcrumb & Scope selector details */}
          <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  Configure Preset Overrides
                </h2>
                <p className="text-[11px] text-slate-400">
                  Select target page or section details to configure fine overrides.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Page Scope</label>
                  <select 
                    value={selectedPage} 
                    onChange={e => setSelectedPage(e.target.value)}
                    className="h-8.5 rounded-[4px] border border-[#E2E8F0] bg-white text-xs px-2.5 font-medium min-w-[130px]"
                  >
                    {PAGES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Section Scope</label>
                  <select 
                    value={selectedSection} 
                    onChange={e => setSelectedSection(e.target.value)}
                    className="h-8.5 rounded-[4px] border border-[#E2E8F0] bg-white text-xs px-2.5 font-medium min-w-[130px]"
                  >
                    {SECTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Render Active Category Panels */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="w-8 h-8 text-primary-orange animate-spin" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Loading Settings...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {activeCategory === 'overview' && (
                <div className="space-y-6">
                  <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-5">
                    <h3 className="text-sm font-bold text-slate-800 mb-2">Design Control Center Dashboard</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Welcome to the design portal. Manage branding colors, responsive sizes, buttons, and backgrounds.
                      All changes are first stored safely as <strong className="text-slate-800">Draft</strong> and will not reflect on the public website until you press the <strong className="text-primary-orange">Publish Live</strong> button.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-4 flex flex-col gap-2">
                      <Palette className="w-5 h-5 text-indigo-500" />
                      <span className="text-xs font-bold text-slate-800">Global Styles</span>
                      <p className="text-[11px] text-slate-400">Configure global layout sizing, borders, shadow styles, and typography values.</p>
                      <Button variant="link" onClick={() => setActiveCategory('global')} className="text-xs text-primary-orange self-start p-0">Configure →</Button>
                    </div>
                    <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-4 flex flex-col gap-2">
                      <Image className="w-5 h-5 text-emerald-500" />
                      <span className="text-xs font-bold text-slate-800">Backgrounds</span>
                      <p className="text-[11px] text-slate-400">Manage image background positions, overlay darkness, gradients, and video fallbacks.</p>
                      <Button variant="link" onClick={() => setActiveCategory('backgrounds')} className="text-xs text-primary-orange self-start p-0">Configure →</Button>
                    </div>
                    <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-4 flex flex-col gap-2">
                      <Smartphone className="w-5 h-5 text-amber-500" />
                      <span className="text-xs font-bold text-slate-800">Mobile Styles</span>
                      <p className="text-[11px] text-slate-400">Add separate responsive rules for padding, navigation bar height, and hero alignment.</p>
                      <Button variant="link" onClick={() => setActiveCategory('mobile')} className="text-xs text-primary-orange self-start p-0">Configure →</Button>
                    </div>
                  </div>
                </div>
              )}

              {activeCategory === 'colors' && (
                <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b pb-2 mb-4">Brand Colors</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-slate-650">Primary brand color</Label>
                      <div className="flex gap-2 items-center mt-1">
                        <input type="color" value={config.primaryColor || '#0B1F4D'} onChange={e => handleConfigChange('primaryColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer p-0" />
                        <Input value={config.primaryColor || '#0B1F4D'} onChange={e => handleConfigChange('primaryColor', e.target.value)} className="h-8.5 text-xs" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-650">Secondary brand color</Label>
                      <div className="flex gap-2 items-center mt-1">
                        <input type="color" value={config.secondaryColor || '#FF6B00'} onChange={e => handleConfigChange('secondaryColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer p-0" />
                        <Input value={config.secondaryColor || '#FF6B00'} onChange={e => handleConfigChange('secondaryColor', e.target.value)} className="h-8.5 text-xs" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-650">Accent / Yellow color</Label>
                      <div className="flex gap-2 items-center mt-1">
                        <input type="color" value={config.accentColor || '#FF6B00'} onChange={e => handleConfigChange('accentColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer p-0" />
                        <Input value={config.accentColor || '#FF6B00'} onChange={e => handleConfigChange('accentColor', e.target.value)} className="h-8.5 text-xs" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-650">Background color</Label>
                      <div className="flex gap-2 items-center mt-1">
                        <input type="color" value={config.backgroundColor || '#F8F7F4'} onChange={e => handleConfigChange('backgroundColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer p-0" />
                        <Input value={config.backgroundColor || '#F8F7F4'} onChange={e => handleConfigChange('backgroundColor', e.target.value)} className="h-8.5 text-xs" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeCategory === 'typography' && (
                <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b pb-2 mb-4">Typography Sizing</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-slate-650">Font Family</Label>
                      <select value={config.fontFamily || 'Montserrat'} onChange={e => handleConfigChange('fontFamily', e.target.value)} className="w-full h-8.5 mt-1 rounded-[4px] border border-[#E2E8F0] bg-white text-xs px-2.5">
                        <option value="Montserrat">Montserrat</option>
                        <option value="Inter">Inter</option>
                        <option value="Outfit">Outfit</option>
                        <option value="Roboto">Roboto</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-650">Base Font Size (px)</Label>
                      <Input type="number" value={config.fontSizeBase || '16'} onChange={e => handleConfigChange('fontSizeBase', e.target.value)} className="h-8.5 text-xs mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-650">Heading H1 Size (px)</Label>
                      <Input type="number" value={config.fontSizeHeading || '32'} onChange={e => handleConfigChange('fontSizeHeading', e.target.value)} className="h-8.5 text-xs mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-650">Heading H2 Size (px)</Label>
                      <Input type="number" value={config.fontSizeH2 || '28'} onChange={e => handleConfigChange('fontSizeH2', e.target.value)} className="h-8.5 text-xs mt-1" />
                    </div>
                  </div>
                </div>
              )}

              {activeCategory === 'backgrounds' && (
                <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b pb-2 mb-4">Background Image Manager</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-slate-650">Background Type</Label>
                      <div className="flex gap-2 mt-1">
                        {['color', 'image', 'video', 'transparent'].map(t => (
                          <button
                            key={t}
                            onClick={() => handleConfigChange('bgType', t)}
                            className={`px-3 py-1.5 text-xs font-semibold uppercase rounded-[4px] transition-all border ${
                              config.bgType === t 
                                ? 'bg-primary-orange text-white border-primary-orange' 
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {config.bgType === 'image' && (
                      <div className="space-y-3 pt-2">
                        <div>
                          <Label className="text-xs text-slate-650">Background Image URL</Label>
                          <Input value={config.bgImage || ''} onChange={e => handleConfigChange('bgImage', e.target.value)} className="h-8.5 text-xs mt-1" placeholder="https://example.com/image.jpg" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-slate-650">Size Fit</Label>
                            <select value={config.bgSize || 'cover'} onChange={e => handleConfigChange('bgSize', e.target.value)} className="w-full h-8.5 mt-1 rounded-[4px] border border-[#E2E8F0] bg-white text-xs px-2.5">
                              <option value="cover">Cover</option>
                              <option value="contain">Contain</option>
                              <option value="auto">Auto</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-650">Position</Label>
                            <select value={config.bgPosition || 'center'} onChange={e => handleConfigChange('bgPosition', e.target.value)} className="w-full h-8.5 mt-1 rounded-[4px] border border-[#E2E8F0] bg-white text-xs px-2.5">
                              <option value="center">Center</option>
                              <option value="top">Top</option>
                              <option value="bottom">Bottom</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeCategory === 'css' && (
                <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b pb-2 mb-4">Custom CSS (Superadmin Only)</h3>
                  <textarea 
                    value={customCss} 
                    onChange={e => {
                      setCustomCss(e.target.value);
                      setStatus('unsaved');
                    }}
                    className="w-full h-64 font-mono text-xs p-3 rounded-[4px] border border-[#E2E8F0] focus:ring-1 focus:ring-primary-orange"
                    placeholder="/* Custom CSS overrides */"
                  />
                </div>
              )}

              {activeCategory === 'history' && (
                <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b pb-2 mb-4">Version History & Rollbacks</h3>
                  {versions.length === 0 ? (
                    <p className="text-xs text-slate-400">No version history logs found for this scope.</p>
                  ) : (
                    <div className="space-y-3">
                      {versions.map(v => (
                        <div key={v.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-[4px] hover:bg-slate-50 transition-all">
                          <div>
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{v.action}</span>
                            <span className="text-[11px] text-slate-400 ml-2">Version {v.version}</span>
                            <p className="text-[11px] text-slate-550 mt-0.5">{v.changeSummary}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-medium">By {v.changedByName}</span>
                            <Button size="sm" onClick={() => handleRestore(v.id)} className="h-7 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[4px] px-2.5">
                              Restore
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel (Sticky Live Preview) */}
        <div className="w-[420px] bg-white border-l border-[#E2E8F0] p-4 sticky top-[60px] h-[calc(100vh-60px)] flex flex-col justify-between shrink-0">
          <div className="space-y-4 flex-1 flex flex-col justify-start">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Draft Preview</span>
              </div>
              
              <div className="flex bg-slate-100 rounded-[4px] p-0.5">
                <button 
                  onClick={() => setPreviewMode('desktop')}
                  className={`p-1.5 rounded-[4px] transition-all ${previewMode === 'desktop' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Monitor className="w-3.5 h-3.5 text-slate-650" />
                </button>
                <button 
                  onClick={() => setPreviewMode('tablet')}
                  className={`p-1.5 rounded-[4px] transition-all ${previewMode === 'tablet' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Tablet className="w-3.5 h-3.5 text-slate-650" />
                </button>
                <button 
                  onClick={() => setPreviewMode('mobile')}
                  className={`p-1.5 rounded-[4px] transition-all ${previewMode === 'mobile' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-slate-650" />
                </button>
              </div>
            </div>

            {/* Simulating the Preview Device Frame */}
            <div className="flex-1 flex items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-[4px] overflow-hidden p-4 relative min-h-[300px]">
              <div 
                className="bg-white border rounded-[6px] shadow-sm flex flex-col justify-between transition-all duration-300 w-full overflow-hidden"
                style={{
                  maxWidth: previewMode === 'mobile' ? '280px' : previewMode === 'tablet' ? '360px' : '100%',
                  height: '100%',
                  minHeight: '320px'
                }}
              >
                {/* Simulation Top Header */}
                <div 
                  className="px-3 py-2 border-b flex items-center justify-between shrink-0" 
                  style={{ backgroundColor: config.primaryColor || '#0B1F4D', color: '#ffffff' }}
                >
                  <span className="text-[10px] font-bold tracking-tight">YouthCamping</span>
                  <div className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  </div>
                </div>

                {/* Simulation Hero Section Body */}
                <div 
                  className="flex-1 p-6 flex flex-col justify-center items-center text-center gap-3 relative"
                  style={{
                    backgroundColor: config.bgType === 'color' ? (config.backgroundColor || '#F8F7F4') : '#f1f5f9',
                    color: config.textColor || '#111111'
                  }}
                >
                  <h4 className="text-sm font-bold tracking-tight" style={{ fontFamily: config.fontFamily || 'Montserrat' }}>
                    One Trip At A Time
                  </h4>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold max-w-[200px]">
                    Find Freedom • Collect Stories
                  </p>
                  
                  <button 
                    className="text-[10px] font-bold tracking-wider uppercase px-4 py-2 mt-2 rounded-[4px]"
                    style={{ 
                      backgroundColor: config.buttonColor || '#FF6B00', 
                      color: config.buttonTextColor || '#FFFFFF' 
                    }}
                  >
                    View Packages
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t flex flex-col gap-2">
            <Button
              onClick={() => window.open('/preview?draft=true', '_blank')}
              className="w-full text-xs font-semibold rounded-[4px] border-[#E2E8F0] hover:bg-slate-50 text-slate-650 bg-slate-100"
            >
              Open External Live Preview
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog before Publish */}
      {showPublishDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border rounded-[6px] shadow-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Publish Design Settings to Production?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              This action will push all your saved draft configuration overrides to the live public website. Any changes to backgrounds, colors, spacing, and buttons will become immediately visible to customers.
            </p>
            <div className="bg-slate-55 p-3 rounded-[4px] text-[11px] text-slate-600 space-y-1 font-medium">
              <div>Scope: <strong className="text-slate-800">{activeCategory === 'global' ? 'Global' : activeCategory === 'pages' ? `Page: ${selectedPage}` : `Section: ${selectedSection}`}</strong></div>
              <div>Author: <strong className="text-slate-800">Admin</strong></div>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowPublishDialog(false)} className="h-8.5 text-xs text-slate-650 rounded-[4px]">
                Cancel
              </Button>
              <Button size="sm" onClick={handlePublish} disabled={publishing} className="h-8.5 text-xs font-semibold rounded-[4px] bg-primary-orange hover:bg-primary-orange/90 text-white">
                {publishing ? 'Publishing...' : 'Yes, Publish Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
