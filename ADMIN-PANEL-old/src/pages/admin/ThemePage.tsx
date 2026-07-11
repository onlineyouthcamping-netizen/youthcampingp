import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Save, RefreshCw, Type, Palette, Layout, 
  Smartphone, Monitor, MousePointer2, Box, 
  Layers, Undo2, Navigation, Image, 
  CreditCard, GripVertical, Eye, EyeOff,
  Plus, X, Bookmark, Trash2, Check,
  ChevronRight, ArrowUpRight, MapPin, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { themeService, ThemeConfig, ThemePreset } from '@/services/theme.service';
import { useTheme } from '@/components/admin/DynamicThemeProvider';

const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero Section',
  social_proof: 'Social Proof Bar',
  community_trips: 'Community Trips',
  cta_banner: 'CTA Banner',
  destinations: 'Destinations',
  bestie: 'Bestie Section',
  cta_slider: 'CTA Slider',
  blogs: 'Blog Section',
  reviews: 'Reviews',
  vibe: 'Vibe Section'
};

const FONT_OPTIONS = ['Montserrat', 'Inter', 'Poppins', 'Outfit', 'Playfair Display', 'Space Grotesk', 'DM Sans', 'Raleway', 'Lato', 'Roboto'];

const TABS = [
  { id: 'colors', label: 'Colors', icon: Palette },
  { id: 'typography', label: 'Typography', icon: Type },
  { id: 'hero', label: 'Hero', icon: Image },
  { id: 'navbar', label: 'Navbar', icon: Navigation },
  { id: 'cards', label: 'Cards', icon: CreditCard },
  { id: 'buttons', label: 'Buttons', icon: MousePointer2 },
  { id: 'sections', label: 'Sections', icon: Layers },
  { id: 'mobile', label: 'Mobile', icon: Smartphone },
  { id: 'animations', label: 'Animations', icon: Clock },
  { id: 'presets', label: 'Presets', icon: Bookmark },
] as const;

type TabId = typeof TABS[number]['id'];

export default function ThemePage() {
  const { theme, updateLocalTheme, refreshTheme } = useTheme();
  const [config, setConfig] = useState<ThemeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('colors');
  const [presets, setPresets] = useState<ThemePreset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [dragItem, setDragItem] = useState<number | null>(null);

  useEffect(() => {
    if (theme) {
      setConfig(theme);
      setLoading(false);
    } else {
      themeService.get().then(data => {
        setConfig(data);
        setLoading(false);
      });
    }
  }, [theme]);

  const handleChange = useCallback((key: keyof ThemeConfig, value: any) => {
    if (!config) return;
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    updateLocalTheme(newConfig);
  }, [config, updateLocalTheme]);

  const handleNestedChange = useCallback((parentKey: keyof ThemeConfig, childKey: string, value: any) => {
    if (!config) return;
    const parent = (config[parentKey] as any) || {};
    const newParent = { ...parent, [childKey]: value };
    const newConfig = { ...config, [parentKey]: newParent };
    setConfig(newConfig);
    updateLocalTheme(newConfig);
  }, [config, updateLocalTheme]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await themeService.update(config);
      toast.success("Theme published globally!");
    } catch (err) {
      toast.error("Failed to save theme settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Reset all theme settings to default?")) return;
    setLoading(true);
    try {
      const defaultTheme = await themeService.reset();
      setConfig(defaultTheme);
      updateLocalTheme(defaultTheme);
      toast.success("Theme reset to defaults");
    } catch (err) {
      toast.error("Failed to reset theme");
    } finally {
      setLoading(false);
    }
  };

  const loadPresets = useCallback(async () => {
    try {
      const data = await themeService.getPresets();
      setPresets(data);
    } catch (e) {
      console.error('Failed to load presets');
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'presets') loadPresets();
  }, [activeTab, loadPresets]);

  const handleSavePreset = async () => {
    if (!newPresetName.trim()) return toast.error('Enter a preset name');
    try {
      await themeService.savePreset(newPresetName.trim());
      setNewPresetName('');
      toast.success('Preset saved!');
      loadPresets();
    } catch (e) {
      toast.error('Failed to save preset');
    }
  };

  const handleApplyPreset = async (name: string) => {
    try {
      const applied = await themeService.applyPreset(name);
      setConfig(applied);
      updateLocalTheme(applied);
      toast.success(`Preset "${name}" applied!`);
    } catch (e) {
      toast.error('Failed to apply preset');
    }
  };

  const handleDeletePreset = async (name: string) => {
    if (!window.confirm(`Delete preset "${name}"?`)) return;
    try {
      await themeService.deletePreset(name);
      toast.success('Preset deleted');
      loadPresets();
    } catch (e) {
      toast.error('Failed to delete preset');
    }
  };

  // Section drag handlers
  const handleDragStart = (index: number) => setDragItem(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragItem === null || dragItem === index || !config) return;
    const newOrder = [...(config.sectionOrder || [])];
    const draggedItem = newOrder[dragItem];
    newOrder.splice(dragItem, 1);
    newOrder.splice(index, 0, draggedItem);
    handleChange('sectionOrder', newOrder);
    setDragItem(index);
  };
  const handleDragEnd = () => setDragItem(null);

  // Animated text management
  const addAnimatedText = () => {
    if (!config) return;
    const texts = [...(config.heroAnimatedTexts || []), 'New Text'];
    handleChange('heroAnimatedTexts', texts);
  };
  const removeAnimatedText = (i: number) => {
    if (!config) return;
    const texts = (config.heroAnimatedTexts || []).filter((_: any, idx: number) => idx !== i);
    handleChange('heroAnimatedTexts', texts);
  };
  const updateAnimatedText = (i: number, val: string) => {
    if (!config) return;
    const texts = [...(config.heroAnimatedTexts || [])];
    texts[i] = val;
    handleChange('heroAnimatedTexts', texts);
  };

  if (loading || !config) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 max-w-[1800px] mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Design Control Center</h1>
          <p className="text-sm text-slate-500">Configure your website's look and feel in real-time.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="rounded-xl h-9 px-4 text-xs font-semibold border-slate-200">
            <Undo2 className="w-3.5 h-3.5 mr-1.5" /> Reset
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-9 px-6 text-xs font-bold uppercase tracking-wider shadow-lg shadow-orange-500/20"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
            Publish
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar bg-slate-50 p-1 rounded-xl border border-slate-100">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Controls Column */}
        <div className="xl:col-span-7 space-y-6">
          {activeTab === 'colors' && <ColorsTab config={config} onChange={handleChange} />}
          {activeTab === 'typography' && <TypographyTab config={config} onChange={handleChange} />}
          {activeTab === 'hero' && (
            <HeroTab 
              config={config} 
              onChange={handleChange}
              onAddText={addAnimatedText}
              onRemoveText={removeAnimatedText}
              onUpdateText={updateAnimatedText}
            />
          )}
          {activeTab === 'navbar' && <NavbarTab config={config} onChange={handleChange} />}
          {activeTab === 'cards' && <CardsTab config={config} onChange={handleChange} />}
          {activeTab === 'buttons' && <ButtonsTab config={config} onChange={handleChange} />}
          {activeTab === 'sections' && (
            <SectionsTab
              config={config}
              onChange={handleChange}
              onNestedChange={handleNestedChange}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            />
          )}
          {activeTab === 'mobile' && <MobileTab config={config} onChange={handleChange} />}
          {activeTab === 'animations' && <AnimationsTab config={config} onChange={handleChange} />}
          {activeTab === 'presets' && (
            <PresetsTab
              presets={presets}
              newName={newPresetName}
              onNameChange={setNewPresetName}
              onSave={handleSavePreset}
              onApply={handleApplyPreset}
              onDelete={handleDeletePreset}
              onReset={handleReset}
            />
          )}
        </div>

        {/* Live Preview Column */}
        <div className="xl:col-span-5 relative">
          <div className="sticky top-28">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live Preview</span>
              </div>
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button 
                  onClick={() => setPreviewMode('desktop')}
                  className={`p-1.5 rounded-md transition-all ${previewMode === 'desktop' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Monitor className="w-3.5 h-3.5 text-slate-600" />
                </button>
                <button 
                  onClick={() => setPreviewMode('mobile')}
                  className={`p-1.5 rounded-md transition-all ${previewMode === 'mobile' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-slate-600" />
                </button>
              </div>
            </div>

            <div className={`mx-auto transition-all duration-500 ${previewMode === 'mobile' ? 'max-w-[320px]' : 'max-w-full'}`}>
              <LivePreview config={config} mode={previewMode} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================
   TAB COMPONENTS
   ======================================================================== */

function ColorsTab({ config, onChange }: { config: ThemeConfig; onChange: (k: keyof ThemeConfig, v: any) => void }) {
  return (
    <div className="space-y-6">
      <ThemeSection icon={<Palette className="w-4 h-4" />} title="Brand Colors">
        <div className="grid grid-cols-2 gap-6">
          <ColorInput label="Primary Color" value={config.primaryColor} onChange={v => onChange('primaryColor', v)} />
          <ColorInput label="Secondary Color" value={config.secondaryColor} onChange={v => onChange('secondaryColor', v)} />
          <ColorInput label="Accent Color" value={config.accentColor} onChange={v => onChange('accentColor', v)} />
          <ColorInput label="Background" value={config.backgroundColor} onChange={v => onChange('backgroundColor', v)} />
          <ColorInput label="Text Color" value={config.textColor} onChange={v => onChange('textColor', v)} />
          <ColorInput label="Border Color" value={config.borderColor} onChange={v => onChange('borderColor', v)} />
        </div>
      </ThemeSection>

      <ThemeSection icon={<Layers className="w-4 h-4" />} title="Effects">
        <div className="grid grid-cols-2 gap-6">
          <SelectInput label="Gradient Overlay" value={config.gradientOverlay} onChange={v => onChange('gradientOverlay', v)}
            options={[
              { value: 'none', label: 'None' },
              { value: 'subtle', label: 'Subtle' },
              { value: 'cinematic', label: 'Cinematic' },
            ]}
          />
          <SelectInput label="Shadow Intensity" value={config.shadowIntensity} onChange={v => onChange('shadowIntensity', v)}
            options={[
              { value: 'none', label: 'None' },
              { value: 'subtle', label: 'Subtle' },
              { value: 'medium', label: 'Medium' },
              { value: 'strong', label: 'Strong' },
            ]}
          />
        </div>
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl mt-4">
          <div>
            <Label className="text-sm font-semibold text-slate-900">Dark Mode</Label>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">Enable dark theme</p>
          </div>
          <Switch checked={config.darkMode} onCheckedChange={v => onChange('darkMode', v)} />
        </div>
      </ThemeSection>
    </div>
  );
}

function TypographyTab({ config, onChange }: { config: ThemeConfig; onChange: (k: keyof ThemeConfig, v: any) => void }) {
  return (
    <div className="space-y-6">
      <ThemeSection icon={<Type className="w-4 h-4" />} title="Font Family">
        <div className="grid grid-cols-2 gap-6">
          <SelectInput label="Heading Font" value={config.headingFont} onChange={v => onChange('headingFont', v)}
            options={FONT_OPTIONS.map(f => ({ value: f, label: f }))}
          />
          <SelectInput label="Body Font" value={config.bodyFont} onChange={v => onChange('bodyFont', v)}
            options={FONT_OPTIONS.map(f => ({ value: f, label: f }))}
          />
        </div>
      </ThemeSection>

      <ThemeSection icon={<Type className="w-4 h-4" />} title="Font Sizes (Typography Scale)">
        <div className="grid grid-cols-2 gap-6">
          <SliderControl label={`Base Size: ${config.fontSizeBase}px`} value={Number(config.fontSizeBase)} min={12} max={24} onChange={v => onChange('fontSizeBase', v.toString())} />
          <SliderControl label={`H1 Heading Size: ${config.fontSizeHeading}px`} value={Number(config.fontSizeHeading)} min={24} max={80} onChange={v => onChange('fontSizeHeading', v.toString())} />
          <SliderControl label={`H2 Section Title Size: ${config.fontSizeH2 || 28}px`} value={Number(config.fontSizeH2 || 28)} min={20} max={60} onChange={v => onChange('fontSizeH2', v.toString())} />
          <SliderControl label={`H3 Card Title Size: ${config.fontSizeH3 || 20}px`} value={Number(config.fontSizeH3 || 20)} min={16} max={40} onChange={v => onChange('fontSizeH3', v.toString())} />
          <SliderControl label={`H4 Metadata Size: ${config.fontSizeH4 || 16}px`} value={Number(config.fontSizeH4 || 16)} min={12} max={30} onChange={v => onChange('fontSizeH4', v.toString())} />
          <SliderControl label={`Navbar Link Size: ${config.navbarFontSize || 15}px`} value={Number(config.navbarFontSize || 15)} min={12} max={24} onChange={v => onChange('navbarFontSize', v.toString())} />
          <SliderControl label={`Button Font Size: ${config.buttonFontSize}px`} value={Number(config.buttonFontSize)} min={8} max={20} onChange={v => onChange('buttonFontSize', v.toString())} />
        </div>
      </ThemeSection>

      <ThemeSection icon={<Type className="w-4 h-4" />} title="Section Heading Style">
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              id: 'default',
              label: 'Default',
              preview: (
                <div className="flex flex-col items-center justify-center h-16 w-full text-center">
                  <span className="text-xs font-bold text-slate-800" style={{ fontFamily: config.headingFont }}>Section Heading</span>
                  <div className="w-10 h-0.5 mt-1" style={{ backgroundColor: config.secondaryColor }} />
                </div>
              )
            },
            {
              id: 'star',
              label: 'Embellishment - Star',
              preview: (
                <div className="flex flex-col items-center justify-center h-16 w-full text-center">
                  <span className="text-xs font-bold text-slate-800" style={{ fontFamily: config.headingFont }}>Section Heading</span>
                  <div className="flex items-center gap-2 mt-1 w-full max-w-[120px]">
                    <div className="flex-1 h-[1px] bg-slate-300" />
                    <span className="text-[8px]" style={{ color: config.secondaryColor }}>★</span>
                    <div className="flex-1 h-[1px] bg-slate-300" />
                  </div>
                </div>
              )
            },
            {
              id: 'side-lines',
              label: 'Side Lines',
              preview: (
                <div className="flex items-center justify-center gap-2 h-16 w-full text-center">
                  <div className="w-8 h-[1px] bg-slate-400" />
                  <span className="text-xs font-bold text-slate-800" style={{ fontFamily: config.headingFont }}>Section Heading</span>
                  <div className="w-8 h-[1px] bg-slate-400" />
                </div>
              )
            },
            {
              id: 'left-aligned',
              label: 'Left Aligned',
              preview: (
                <div className="flex flex-col items-start justify-center h-16 w-full px-4">
                  <span className="text-xs font-bold text-slate-800" style={{ fontFamily: config.headingFont }}>Section Heading</span>
                  <div className="w-16 h-1 mt-1 rounded-full" style={{ backgroundColor: config.secondaryColor }} />
                </div>
              )
            }
          ].map(style => {
            const isSelected = (config.sectionHeadingStyle || 'default') === style.id;
            return (
              <div 
                key={style.id}
                onClick={() => onChange('sectionHeadingStyle', style.id)}
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-1 bg-slate-50/50 hover:bg-slate-50 ${isSelected ? 'border-orange-500 bg-white shadow-md shadow-orange-500/5' : 'border-slate-100'}`}
              >
                <div className="flex items-center gap-2 w-full justify-start border-b border-slate-100 pb-2">
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-orange-500' : 'border-slate-300'}`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{style.label}</span>
                </div>
                <div className="w-full mt-2 bg-white rounded-lg border border-slate-100/80 shadow-sm flex items-center justify-center">
                  {style.preview}
                </div>
              </div>
            );
          })}
        </div>
      </ThemeSection>

      <ThemeSection icon={<Type className="w-4 h-4" />} title="Font Style">
        <div className="grid grid-cols-2 gap-6">
          <SelectInput label="Heading Weight" value={config.fontWeightHeading} onChange={v => onChange('fontWeightHeading', v)}
            options={[
              { value: '400', label: 'Regular (400)' },
              { value: '500', label: 'Medium (500)' },
              { value: '600', label: 'Semi-Bold (600)' },
              { value: '700', label: 'Bold (700)' },
              { value: '800', label: 'Extra-Bold (800)' },
              { value: '900', label: 'Black (900)' },
            ]}
          />
          <SelectInput label="Heading Transform" value={config.headingTextTransform} onChange={v => onChange('headingTextTransform', v)}
            options={[
              { value: 'none', label: 'None' },
              { value: 'uppercase', label: 'UPPERCASE' },
              { value: 'capitalize', label: 'Capitalize' },
              { value: 'lowercase', label: 'lowercase' },
            ]}
          />
          <TextInput label="Heading Letter Spacing" value={config.headingLetterSpacing} onChange={v => onChange('headingLetterSpacing', v)} placeholder="-0.02em" />
          <TextInput label="Body Line Height" value={config.bodyLineHeight} onChange={v => onChange('bodyLineHeight', v)} placeholder="1.6" />
          <TextInput label="Body Letter Spacing" value={config.bodyLetterSpacing} onChange={v => onChange('bodyLetterSpacing', v)} placeholder="normal" />
        </div>
      </ThemeSection>
    </div>
  );
}

function HeroTab({ config, onChange, onAddText, onRemoveText, onUpdateText }: { 
  config: ThemeConfig; onChange: (k: keyof ThemeConfig, v: any) => void;
  onAddText: () => void; onRemoveText: (i: number) => void; onUpdateText: (i: number, v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <ThemeSection icon={<Image className="w-4 h-4" />} title="Hero Content">
        <div className="space-y-5">
          <TextInput label="Hero Title" value={config.heroTitle} onChange={v => onChange('heroTitle', v)} placeholder="One Trip At a Time" />
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Animated Rotating Texts</Label>
              <Button variant="outline" size="sm" onClick={onAddText} className="h-7 px-2 text-[10px] rounded-lg">
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {(config.heroAnimatedTexts || []).map((text: string, i: number) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input 
                    value={text} 
                    onChange={e => onUpdateText(i, e.target.value)}
                    className="h-9 rounded-lg text-sm border-slate-200 flex-1"
                  />
                  <button onClick={() => onRemoveText(i)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <TextInput label="CTA Button Text" value={config.heroCtaText} onChange={v => onChange('heroCtaText', v)} placeholder="Explore Trips" />
            <TextInput label="CTA Link" value={config.heroCtaLink} onChange={v => onChange('heroCtaLink', v)} placeholder="/trips" />
          </div>
          <SelectInput label="CTA Style" value={config.heroCtaStyle} onChange={v => onChange('heroCtaStyle', v)}
            options={[{ value: 'filled', label: 'Filled' }, { value: 'outline', label: 'Outline' }]}
          />
        </div>
      </ThemeSection>

      <ThemeSection icon={<Image className="w-4 h-4" />} title="Hero Appearance">
        <div className="space-y-5">
          <TextInput label="Video URL (YouTube)" value={config.heroVideoUrl} onChange={v => onChange('heroVideoUrl', v)} placeholder="https://youtube.com/..." />
          <TextInput label="Background Image URL" value={config.heroBgImage} onChange={v => onChange('heroBgImage', v)} placeholder="https://..." />
          <div className="grid grid-cols-2 gap-5">
            <SliderControl label={`Overlay Darkness: ${config.heroOverlayDarkness}%`} value={Number(config.heroOverlayDarkness)} min={0} max={100} onChange={v => onChange('heroOverlayDarkness', v.toString())} />
            <SliderControl label={`Hero Height: ${config.heroHeight}vh`} value={Number(config.heroHeight)} min={50} max={100} onChange={v => onChange('heroHeight', v.toString())} />
          </div>
          <SelectInput label="Text Alignment" value={config.heroAlign} onChange={v => onChange('heroAlign', v)}
            options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]}
          />
        </div>
      </ThemeSection>
    </div>
  );
}

function NavbarTab({ config, onChange }: { config: ThemeConfig; onChange: (k: keyof ThemeConfig, v: any) => void }) {
  const links = config.navbarLinks || [];
  const [newTitle, setNewTitle] = React.useState('');
  const [newUrl, setNewUrl] = React.useState('');
  const [newOpen, setNewOpen] = React.useState(false);

  const handleAddLink = () => {
    if (!newTitle.trim() || !newUrl.trim()) return;
    const updated = [...links, { title: newTitle.trim(), link: newUrl.trim(), openNewWindow: newOpen }];
    onChange('navbarLinks', updated);
    setNewTitle('');
    setNewUrl('');
    setNewOpen(false);
  };

  const handleRemoveLink = (index: number) => {
    const updated = links.filter((_, i) => i !== index);
    onChange('navbarLinks', updated);
  };

  const handleMoveLink = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === links.length - 1) return;
    const updated = [...links];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onChange('navbarLinks', updated);
  };

  return (
    <div className="space-y-6">
      <ThemeSection icon={<Navigation className="w-4 h-4" />} title="Header Style Preset">
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'default', label: 'Default Header' },
            { id: 'centered', label: 'Centered Header' },
            { id: 'split', label: 'Minimal / Split' },
          ].map(preset => {
            const isSelected = (config.headerStylePreset || 'default') === preset.id;
            return (
              <div 
                key={preset.id}
                onClick={() => onChange('headerStylePreset', preset.id)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2 bg-slate-50/50 hover:bg-slate-50 text-center ${isSelected ? 'border-orange-500 bg-white shadow-md shadow-orange-500/5' : 'border-slate-100'}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-orange-500' : 'border-slate-300'}`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{preset.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </ThemeSection>

      <ThemeSection icon={<Navigation className="w-4 h-4" />} title="Support Contact Details">
        <div className="grid grid-cols-3 gap-6">
          <TextInput label="Support Email" value={config.supportEmail || ''} onChange={v => onChange('supportEmail', v)} placeholder="support@youthcamping.online" />
          <TextInput label="Support Phone" value={config.supportPhone || ''} onChange={v => onChange('supportPhone', v)} placeholder="+91 99242 46267" />
          <TextInput label="Support Subtext" value={config.supportText || ''} onChange={v => onChange('supportText', v)} placeholder="Available 10AM to 07PM" />
        </div>
      </ThemeSection>

      <ThemeSection icon={<Navigation className="w-4 h-4" />} title="Navbar Layout Controls">
        <div className="grid grid-cols-3 gap-6">
          <SliderControl label={`Navbar Height: ${config.navbarHeight}px`} value={Number(config.navbarHeight)} min={48} max={120} onChange={v => onChange('navbarHeight', v.toString())} />
          <SliderControl label={`Logo Width Size: ${config.navbarLogoSize}px`} value={Number(config.navbarLogoSize)} min={40} max={250} onChange={v => onChange('navbarLogoSize', v.toString())} />
          <SliderControl label={`Menu Spacing: ${config.navbarSpacing}px`} value={Number(config.navbarSpacing)} min={8} max={48} onChange={v => onChange('navbarSpacing', v.toString())} />
        </div>
      </ThemeSection>

      <ThemeSection icon={<Layers className="w-4 h-4" />} title="Interactive Navbar Navigation Links">
        <div className="space-y-4">
          {links.map((link, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">{link.title}</p>
                <p className="text-[10px] font-mono text-slate-400 truncate">{link.link} {link.openNewWindow ? '(New Window)' : ''}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600" onClick={() => handleMoveLink(idx, 'up')} disabled={idx === 0}>
                  ▲
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600" onClick={() => handleMoveLink(idx, 'down')} disabled={idx === links.length - 1}>
                  ▼
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-rose-500 hover:bg-rose-50" onClick={() => handleRemoveLink(idx)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          <div className="border-t border-slate-100 pt-4 mt-2">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Add Custom Navigation Link</h4>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <Input placeholder="Link Title (e.g. Tours)" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="h-10 rounded-lg text-sm" />
              <Input placeholder="URL Destination (e.g. /trips)" value={newUrl} onChange={e => setNewUrl(e.target.value)} className="h-10 rounded-lg text-sm" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 cursor-pointer">
                <input type="checkbox" checked={newOpen} onChange={e => setNewOpen(e.target.checked)} className="rounded border-slate-300 text-orange-500 focus:ring-orange-500" />
                Open link in new window tab
              </label>
              <Button onClick={handleAddLink} size="sm" className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg h-9 font-bold">
                <Plus className="w-4 h-4 mr-1" /> Add Link
              </Button>
            </div>
          </div>
        </div>
      </ThemeSection>

      <ThemeSection icon={<Navigation className="w-4 h-4" />} title="Navbar Style & Behavior">
        <div className="space-y-4">
          <ToggleRow label="Sticky Header Scroll" description="Main header stays static at page top when scrolling down" checked={config.navbarSticky} onChange={v => onChange('navbarSticky', v)} />
          <ToggleRow label="Transparent Overlay Mode" description="Transparent header overlaying background banner until scrolling begins" checked={config.navbarTransparent} onChange={v => onChange('navbarTransparent', v)} />
          <ToggleRow label="Apply Blur backdrop filter" description="Sleek glass backdrop filter overlay on header background fills" checked={config.navbarBlur} onChange={v => onChange('navbarBlur', v)} />
        </div>
      </ThemeSection>

      <ThemeSection icon={<Palette className="w-4 h-4" />} title="Header Link States Colors">
        <div className="grid grid-cols-2 gap-6">
          <ColorInput label="Active Link Highlight" value={config.navbarActiveColor} onChange={v => onChange('navbarActiveColor', v)} />
          <ColorInput label="Hover Link Highlight" value={config.navbarHoverColor} onChange={v => onChange('navbarHoverColor', v)} />
        </div>
      </ThemeSection>

      <ThemeSection icon={<Smartphone className="w-4 h-4" />} title="Mobile Viewport Navbar">
        <div className="grid grid-cols-2 gap-6">
          <SelectInput label="Mobile Navigation Menu Drawer" value={config.mobileNavStyle} onChange={v => onChange('mobileNavStyle', v)}
            options={[{ value: 'drawer', label: 'Drawer Menu (Slide-in)' }, { value: 'fullscreen', label: 'Fullscreen overlay panel' }]}
          />
          <SliderControl label={`Mobile Navbar Height: ${config.mobileNavbarHeight}px`} value={Number(config.mobileNavbarHeight)} min={48} max={96} onChange={v => onChange('mobileNavbarHeight', v.toString())} />
        </div>
      </ThemeSection>
    </div>
  );
}

function CardsTab({ config, onChange }: { config: ThemeConfig; onChange: (k: keyof ThemeConfig, v: any) => void }) {
  return (
    <div className="space-y-6">
      <ThemeSection icon={<CreditCard className="w-4 h-4" />} title="Card Dimensions">
        <div className="grid grid-cols-2 gap-6">
          <SliderControl label={`Radius: ${config.cardRadius}px`} value={Number(config.cardRadius)} min={0} max={60} onChange={v => onChange('cardRadius', v.toString())} />
          <SliderControl label={`Height: ${config.cardHeight}px`} value={Number(config.cardHeight)} min={300} max={700} onChange={v => onChange('cardHeight', v.toString())} />
          <SliderControl label={`Width: ${config.cardWidth}px`} value={Number(config.cardWidth)} min={250} max={500} onChange={v => onChange('cardWidth', v.toString())} />
        </div>
      </ThemeSection>

      <ThemeSection icon={<CreditCard className="w-4 h-4" />} title="Card Appearance">
        <div className="grid grid-cols-2 gap-6">
          <SliderControl label={`Overlay Darkness: ${config.cardOverlayDarkness}%`} value={Number(config.cardOverlayDarkness)} min={0} max={100} onChange={v => onChange('cardOverlayDarkness', v.toString())} />
          <SliderControl label={`Image Brightness: ${config.cardImageBrightness}%`} value={Number(config.cardImageBrightness)} min={50} max={150} onChange={v => onChange('cardImageBrightness', v.toString())} />
          <SliderControl label={`Title Size: ${config.cardTitleSize}px`} value={Number(config.cardTitleSize)} min={14} max={32} onChange={v => onChange('cardTitleSize', v.toString())} />
          <SelectInput label="Card Shadow" value={config.cardShadow} onChange={v => onChange('cardShadow', v)}
            options={[
              { value: 'none', label: 'None' },
              { value: '0 4px 6px rgba(0,0,0,0.05)', label: 'Subtle' },
              { value: '0 10px 40px rgba(0,0,0,0.03)', label: 'Luxury Soft' },
              { value: '0 20px 50px rgba(0,0,0,0.1)', label: 'Modern Deep' },
              { value: '0 30px 60px rgba(0,0,0,0.15)', label: 'Ultra Premium' },
            ]}
          />
        </div>
      </ThemeSection>

      <ThemeSection icon={<Palette className="w-4 h-4" />} title="Card Colors">
        <div className="grid grid-cols-2 gap-6">
          <ColorInput label="Card Background" value={config.cardBgColor} onChange={v => onChange('cardBgColor', v)} />
          <ColorInput label="Price Color" value={config.cardPriceColor} onChange={v => onChange('cardPriceColor', v)} />
          <ColorInput label="Badge Background" value={config.cardBadgeBg} onChange={v => onChange('cardBadgeBg', v)} />
          <ColorInput label="Badge Text" value={config.cardBadgeText} onChange={v => onChange('cardBadgeText', v)} />
        </div>
      </ThemeSection>

      <ThemeSection icon={<CreditCard className="w-4 h-4" />} title="Tour Card Style Preset (VacationLabs Style)">
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'default', label: 'Default', desc: 'Classic tour grid card' },
            { id: 'description', label: 'Default + Description', desc: 'Card with a text snippet' },
            { id: 'modular', label: 'Modular', desc: 'VacationLabs standard modular grid' },
            { id: 'concise', label: 'Concise', desc: 'Compact styling for small grids' },
            { id: 'detailed', label: 'Detailed', desc: 'Explicit detail breakdown card' },
          ].map(preset => {
            const isSelected = (config.tourCardStyle || 'modular') === preset.id;
            return (
              <div 
                key={preset.id}
                onClick={() => onChange('tourCardStyle', preset.id)}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between bg-slate-50/50 hover:bg-slate-50 min-h-[90px] ${isSelected ? 'border-orange-500 bg-white shadow-md shadow-orange-500/5' : 'border-slate-100'}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-orange-500' : 'border-slate-300'}`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{preset.label}</span>
                </div>
                <p className="text-[9px] text-slate-400 mt-2 leading-snug">{preset.desc}</p>
              </div>
            );
          })}
        </div>
      </ThemeSection>

      <ThemeSection icon={<CreditCard className="w-4 h-4" />} title="Collection Card Style Preset">
        <div className="grid grid-cols-4 gap-4">
          {[
            { id: 'default', label: 'Default' },
            { id: 'semi-overlay', label: 'Semi Overlay' },
            { id: 'circular', label: 'Circular Layout' },
            { id: 'no-overlay', label: 'No Overlay' },
          ].map(preset => {
            const isSelected = (config.collectionCardStyle || 'default') === preset.id;
            return (
              <div 
                key={preset.id}
                onClick={() => onChange('collectionCardStyle', preset.id)}
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-3 bg-slate-50/50 hover:bg-slate-50 text-center ${isSelected ? 'border-orange-500 bg-white shadow-md shadow-orange-500/5' : 'border-slate-100'}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-orange-500' : 'border-slate-300'}`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{preset.label}</span>
                </div>
                <div className={`w-10 h-10 border border-slate-200 shadow-sm flex items-center justify-center bg-white ${preset.id === 'circular' ? 'rounded-full' : 'rounded-lg'}`}>
                  <span className="text-[8px] text-slate-300">★</span>
                </div>
              </div>
            );
          })}
        </div>
      </ThemeSection>
    </div>
  );
}

function ButtonsTab({ config, onChange }: { config: ThemeConfig; onChange: (k: keyof ThemeConfig, v: any) => void }) {
  return (
    <div className="space-y-6">
      <ThemeSection icon={<MousePointer2 className="w-4 h-4" />} title="Button Style Preset (VacationLabs Style)">
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'fill-box', label: 'Fill - Box', bg: config.buttonColor || '#FF6B00', text: '#FFFFFF', radius: '0px', border: 'none' },
            { id: 'fill-curved', label: 'Fill - Curved', bg: config.buttonColor || '#FF6B00', text: '#FFFFFF', radius: '8px', border: 'none' },
            { id: 'fill-rounded', label: 'Fill - Rounded', bg: config.buttonColor || '#FF6B00', text: '#FFFFFF', radius: '9999px', border: 'none' },
            { id: 'hollow-box', label: 'Hollow - Box', bg: 'transparent', text: config.buttonColor || '#FF6B00', radius: '0px', border: `2px solid ${config.buttonColor || '#FF6B00'}` },
            { id: 'hollow-curved', label: 'Hollow - Curved', bg: 'transparent', text: config.buttonColor || '#FF6B00', radius: '8px', border: `2px solid ${config.buttonColor || '#FF6B00'}` },
            { id: 'hollow-rounded', label: 'Hollow - Rounded', bg: 'transparent', text: config.buttonColor || '#FF6B00', radius: '9999px', border: `2px solid ${config.buttonColor || '#FF6B00'}` },
          ].map(preset => {
            const isSelected = (config.buttonStylePreset || 'fill-rounded') === preset.id;
            return (
              <div 
                key={preset.id}
                onClick={() => onChange('buttonStylePreset', preset.id)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-3 bg-slate-50/50 hover:bg-slate-50 ${isSelected ? 'border-orange-500 bg-white shadow-md shadow-orange-500/5' : 'border-slate-100'}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-orange-500' : 'border-slate-300'}`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{preset.label}</span>
                </div>
                <button
                  type="button"
                  style={{
                    backgroundColor: preset.bg,
                    color: preset.text,
                    border: preset.border,
                    borderRadius: preset.radius,
                  }}
                  className="px-4 py-1.5 text-[8px] font-bold uppercase tracking-widest pointer-events-none select-none"
                >
                  BOOK NOW
                </button>
              </div>
            );
          })}
        </div>
      </ThemeSection>

      <ThemeSection icon={<MousePointer2 className="w-4 h-4" />} title="Primary Button Details">
        <div className="grid grid-cols-3 gap-6">
          <SliderControl label={`Padding X: ${config.buttonPaddingX}px`} value={Number(config.buttonPaddingX)} min={8} max={48} onChange={v => onChange('buttonPaddingX', v.toString())} />
          <SliderControl label={`Padding Y: ${config.buttonPaddingY}px`} value={Number(config.buttonPaddingY)} min={4} max={24} onChange={v => onChange('buttonPaddingY', v.toString())} />
          <SliderControl label={`Button Font Size: ${config.buttonFontSize}px`} value={Number(config.buttonFontSize)} min={8} max={20} onChange={v => onChange('buttonFontSize', v.toString())} />
        </div>
        <div className="grid grid-cols-3 gap-6 mt-6">
          <ColorInput label="Background Color" value={config.buttonColor} onChange={v => onChange('buttonColor', v)} />
          <ColorInput label="Text Color" value={config.buttonTextColor} onChange={v => onChange('buttonTextColor', v)} />
          <ColorInput label="Hover Color" value={config.buttonHoverColor} onChange={v => onChange('buttonHoverColor', v)} />
        </div>
      </ThemeSection>

      <ThemeSection icon={<Box className="w-4 h-4" />} title="Secondary Button Details">
        <div className="grid grid-cols-3 gap-6">
          <ColorInput label="Background" value={config.buttonSecondaryBg} onChange={v => onChange('buttonSecondaryBg', v)} />
          <ColorInput label="Text Color" value={config.buttonSecondaryText} onChange={v => onChange('buttonSecondaryText', v)} />
          <ColorInput label="Hover Color" value={config.buttonSecondaryHover} onChange={v => onChange('buttonSecondaryHover', v)} />
        </div>
      </ThemeSection>
    </div>
  );
}

function SectionsTab({ config, onChange, onNestedChange, onDragStart, onDragOver, onDragEnd }: { 
  config: ThemeConfig; onChange: (k: keyof ThemeConfig, v: any) => void;
  onNestedChange: (parent: keyof ThemeConfig, child: string, v: any) => void;
  onDragStart: (i: number) => void; onDragOver: (e: React.DragEvent, i: number) => void; onDragEnd: () => void;
}) {
  const sections = config.sectionOrder || [];
  const visibility = config.sectionVisibility || {};
  
  return (
    <div className="space-y-6">
      <ThemeSection icon={<Layers className="w-4 h-4" />} title="Section Order & Visibility">
        <p className="text-xs text-slate-400 mb-4">Drag to reorder. Toggle to show/hide sections on the homepage.</p>
        <div className="space-y-2">
          {sections.map((sectionId: string, i: number) => (
            <div
              key={sectionId}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={(e) => onDragOver(e, i)}
              onDragEnd={onDragEnd}
              className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-slate-200 cursor-grab active:cursor-grabbing transition-all"
            >
              <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
              <span className="text-sm font-medium text-slate-700 flex-1">{SECTION_LABELS[sectionId] || sectionId}</span>
              <button 
                onClick={() => onNestedChange('sectionVisibility', sectionId, !visibility[sectionId])}
                className={`p-1.5 rounded-lg transition-all ${visibility[sectionId] !== false ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300 bg-slate-50'}`}
              >
                {visibility[sectionId] !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      </ThemeSection>

      <ThemeSection icon={<Layout className="w-4 h-4" />} title="Spacing System">
        <div className="grid grid-cols-2 gap-6">
          <SliderControl label={`Base Spacing Unit: ${config.spacingUnit || 4}px`} value={Number(config.spacingUnit || 4)} min={2} max={12} onChange={v => onChange('spacingUnit', v.toString())} />
          <SliderControl label={`Section Spacing: ${config.sectionSpacing}px`} value={Number(config.sectionSpacing)} min={20} max={160} onChange={v => onChange('sectionSpacing', v.toString())} />
          <SliderControl label={`Container Max Width: ${config.containerWidth || 1280}px`} value={Number(config.containerWidth || 1280)} min={960} max={1600} step={20} onChange={v => onChange('containerWidth', v.toString())} />
        </div>
        <div className="mt-4">
          <ToggleRow label="Alternate Section Backgrounds" description="Even sections get a slightly different background" checked={config.sectionBgAlternate} onChange={v => onChange('sectionBgAlternate', v)} />
        </div>
      </ThemeSection>
    </div>
  );
}

function MobileTab({ config, onChange }: { config: ThemeConfig; onChange: (k: keyof ThemeConfig, v: any) => void }) {
  return (
    <div className="space-y-6">
      <ThemeSection icon={<Smartphone className="w-4 h-4" />} title="Mobile Typography">
        <div className="grid grid-cols-2 gap-6">
          <SliderControl label={`Base Font: ${config.mobileFontSizeBase}px`} value={Number(config.mobileFontSizeBase)} min={10} max={20} onChange={v => onChange('mobileFontSizeBase', v.toString())} />
          <SliderControl label={`Heading Font: ${config.mobileFontSizeHeading}px`} value={Number(config.mobileFontSizeHeading)} min={18} max={48} onChange={v => onChange('mobileFontSizeHeading', v.toString())} />
        </div>
      </ThemeSection>

      <ThemeSection icon={<Smartphone className="w-4 h-4" />} title="Mobile Layout">
        <div className="grid grid-cols-2 gap-6">
          <SliderControl label={`Spacing Unit: ${config.mobileSpacingUnit}px`} value={Number(config.mobileSpacingUnit)} min={2} max={8} onChange={v => onChange('mobileSpacingUnit', v.toString())} />
          <SliderControl label={`Hero Height: ${config.mobileHeroHeight}vh`} value={Number(config.mobileHeroHeight)} min={40} max={100} onChange={v => onChange('mobileHeroHeight', v.toString())} />
          <SliderControl label={`Navbar Height: ${config.mobileNavbarHeight}px`} value={Number(config.mobileNavbarHeight)} min={48} max={96} onChange={v => onChange('mobileNavbarHeight', v.toString())} />
          <SelectInput label="Card Layout" value={config.mobileCardLayout} onChange={v => onChange('mobileCardLayout', v)}
            options={[{ value: 'scroll', label: 'Horizontal Scroll' }, { value: 'grid', label: 'Grid (2 columns)' }, { value: 'stack', label: 'Vertical Stack' }]}
          />
          <SelectInput label="Mobile Video Hero Size" value={config.mobileHeroVideoHeight || 'aspect-video'} onChange={v => onChange('mobileHeroVideoHeight', v)}
            options={[
              { value: 'aspect-video', label: 'Aspect Ratio (16:9)' },
              { value: '40', label: 'Short (40vh)' },
              { value: '50', label: 'Medium-Short (50vh)' },
              { value: '60', label: 'Medium (60vh)' },
              { value: '70', label: 'Medium-Tall (70vh)' },
              { value: '80', label: 'Tall (80vh)' },
              { value: '90', label: 'Very Tall (90vh)' },
              { value: '100', label: 'Full Screen (100vh)' }
            ]}
          />
        </div>
      </ThemeSection>
    </div>
  );
}

function AnimationsTab({ config, onChange }: { config: ThemeConfig; onChange: (k: keyof ThemeConfig, v: any) => void }) {
  return (
    <div className="space-y-6">
      <ThemeSection icon={<Clock className="w-4 h-4" />} title="Global Transitions">
        <div className="grid grid-cols-2 gap-6">
          <SliderControl 
            label={`Transition Speed: ${config.transitionSpeed || '300'}ms`} 
            value={Number(config.transitionSpeed || '300')} 
            min={100} 
            max={1000} 
            step={50}
            onChange={v => onChange('transitionSpeed', v.toString())} 
          />
          <SelectInput 
            label="Transition Easing" 
            value={config.transitionEasing || 'ease-in-out'} 
            onChange={v => onChange('transitionEasing', v)}
            options={[
              { value: 'linear', label: 'Linear' },
              { value: 'ease', label: 'Ease' },
              { value: 'ease-in', label: 'Ease In' },
              { value: 'ease-out', label: 'Ease Out' },
              { value: 'ease-in-out', label: 'Ease In Out' },
              { value: 'cubic-bezier(0.4, 0, 0.2, 1)', label: 'Smooth/Standard' },
              { value: 'cubic-bezier(0.34, 1.56, 0.64, 1)', label: 'Bouncy / Playful' },
            ]}
          />
        </div>
      </ThemeSection>

      <ThemeSection icon={<MousePointer2 className="w-4 h-4" />} title="Hover Presets">
        <div className="grid grid-cols-2 gap-6">
          <SelectInput 
            label="Button Hover Preset" 
            value={config.buttonHoverAnimation || 'darken'} 
            onChange={v => onChange('buttonHoverAnimation', v)}
            options={[
              { value: 'none', label: 'None' },
              { value: 'darken', label: 'Darken Background' },
              { value: 'scale', label: 'Scale Up (Subtle)' },
              { value: 'lift', label: 'Lift Up' },
            ]}
          />
          <SelectInput 
            label="Card Hover Preset" 
            value={config.cardHoverAnimation || 'scale'} 
            onChange={v => onChange('cardHoverAnimation', v)}
            options={[
              { value: 'none', label: 'None' },
              { value: 'scale', label: 'Scale Up' },
              { value: 'lift', label: 'Lift & Shadow' },
              { value: 'shadow', label: 'Shadow Only' },
            ]}
          />
        </div>
      </ThemeSection>

      <ThemeSection icon={<Layout className="w-4 h-4" />} title="Scroll & Interaction Behavior">
        <div className="space-y-4">
          <ToggleRow 
            label="Animate on Scroll" 
            description="Reveal sections and elements smoothly as you scroll down the page" 
            checked={config.animateOnScroll !== false} 
            onChange={v => onChange('animateOnScroll', v)} 
          />
        </div>
      </ThemeSection>
    </div>
  );
}

function PresetsTab({ presets, newName, onNameChange, onSave, onApply, onDelete, onReset }: {
  presets: ThemePreset[]; newName: string; onNameChange: (v: string) => void;
  onSave: () => void; onApply: (n: string) => void; onDelete: (n: string) => void; onReset: () => void;
}) {
  return (
    <div className="space-y-6">
      <ThemeSection icon={<Bookmark className="w-4 h-4" />} title="Save Current Theme">
        <div className="flex gap-3">
          <Input 
            value={newName} 
            onChange={e => onNameChange(e.target.value)}
            placeholder="My Theme Preset..."
            className="h-10 rounded-xl border-slate-200 flex-1"
          />
          <Button onClick={onSave} className="h-10 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider">
            <Save className="w-3.5 h-3.5 mr-1.5" /> Save
          </Button>
        </div>
      </ThemeSection>

      <ThemeSection icon={<Layers className="w-4 h-4" />} title="Saved Presets">
        {presets.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No presets saved yet. Save your current theme to create one.</p>
        ) : (
          <div className="space-y-2">
            {presets.map(preset => (
              <div key={preset.name} className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-all">
                <Bookmark className="w-4 h-4 text-orange-500 shrink-0" />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-slate-800">{preset.name}</span>
                  <p className="text-[10px] text-slate-400">Saved {new Date(preset.createdAt).toLocaleDateString()}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => onApply(preset.name)} className="h-8 px-3 rounded-lg text-[10px] font-bold border-slate-200">
                  <Check className="w-3 h-3 mr-1" /> Apply
                </Button>
                <button onClick={() => onDelete(preset.name)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </ThemeSection>

      <ThemeSection icon={<Undo2 className="w-4 h-4" />} title="Restore Defaults">
        <p className="text-sm text-slate-500 mb-4">Reset all theme settings to the original default values.</p>
        <Button variant="outline" onClick={onReset} className="h-10 rounded-xl border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold uppercase tracking-wider">
          <Undo2 className="w-3.5 h-3.5 mr-1.5" /> Reset to Defaults
        </Button>
      </ThemeSection>
    </div>
  );
}

/* ========================================================================
   LIVE PREVIEW
   ======================================================================== */

function LivePreview({ config, mode }: { config: ThemeConfig; mode: 'desktop' | 'mobile' }) {
  const isMobile = mode === 'mobile';
  
  // Resolve heights from overrides or base configs
  const navHeight = isMobile ? `${config.mobileNavbarHeight || 64}px` : `${config.navbarHeight || 80}px`;
  const heroHeight = isMobile ? `${config.mobileHeroHeight || 70}vh` : '200px';
  const spacingUnit = isMobile ? Number(config.mobileSpacingUnit || 3) : Number(config.spacingUnit || 4);
  
  // Resolve typography sizes
  const baseSize = isMobile ? `${config.mobileFontSizeBase || 14}px` : `${config.fontSizeBase || 16}px`;
  const headingSize = isMobile ? `${config.mobileFontSizeHeading || 28}px` : `${Number(config.fontSizeHeading || 32) * 0.6}px`;
  
  // Dynamic scale ratios for preview container sizing
  const h2Size = `${Number(config.fontSizeH2 || 28) * 0.6}px`;
  const h3Size = `${Number(config.fontSizeH3 || 20) * 0.8}px`;
  const navbarFontSize = `${Number(config.navbarFontSize || 15) * 0.9}px`;
  
  return (
    <div 
      className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col transition-all duration-500"
      style={{ 
        backgroundColor: config.backgroundColor,
        color: config.textColor,
        fontFamily: config.bodyFont,
        height: isMobile ? '580px' : '620px',
        fontSize: baseSize
      }}
    >
      {/* Mock Navbar */}
      <div className="flex items-center justify-between border-b px-4 transition-all" style={{ 
        borderColor: config.borderColor,
        height: navHeight
      }}>
        <div className="font-bold italic tracking-tighter" style={{ color: config.secondaryColor, fontFamily: config.headingFont, fontSize: navbarFontSize }}>
          YC
        </div>
        <div className="flex items-center" style={{ gap: `${spacingUnit * 2}px` }}>
          {!isMobile && (
            <>
              <div className="w-8 h-1 rounded-full" style={{ backgroundColor: config.borderColor }} />
              <div className="w-8 h-1 rounded-full" style={{ backgroundColor: config.borderColor }} />
            </>
          )}
          <div className="w-7 h-7 rounded-full" style={{ backgroundColor: config.secondaryColor }}>
            <span className="flex items-center justify-center h-full text-[9px] text-white font-bold">
              {isMobile ? '☰' : 'U'}
            </span>
          </div>
        </div>
      </div>

      {/* Mock Hero */}
      <div className="relative flex flex-col justify-center items-center text-center p-6 flex-shrink-0 transition-all" style={{
        background: `linear-gradient(135deg, ${config.secondaryColor}, #1a1a2e)`,
        height: isMobile ? '180px' : '200px',
      }}>
        <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${Number(config.heroOverlayDarkness) / 100})` }} />
        <div className="relative z-10 space-y-2">
          <div className="inline-block px-2.5 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest" style={{ color: config.accentColor, backgroundColor: `${config.accentColor}20` }}>
            The Ultimate Adventure
          </div>
          <h3 className="font-bold leading-tight text-white transition-all" style={{ 
            fontFamily: config.headingFont, 
            fontSize: headingSize,
            textTransform: config.headingTextTransform as any,
            letterSpacing: config.headingLetterSpacing
          }}>
            {config.heroTitle || 'One Trip at a Time'}
          </h3>
          <p className="text-[9px] text-white/60 font-medium">{(config.heroAnimatedTexts || [])[0] || 'Find Freedom'}</p>
          
          {config.heroCtaText && (
            <button 
              className={cn(
                "mt-2 font-bold text-[8px] tracking-widest transition-all duration-300",
                config.buttonHoverAnimation === 'scale' ? "hover:scale-105" : "",
                config.buttonHoverAnimation === 'darken' ? "hover:brightness-90" : ""
              )} 
              style={{
                backgroundColor: config.heroCtaStyle === 'filled' ? config.buttonColor : 'transparent',
                color: config.heroCtaStyle === 'filled' ? config.buttonTextColor : config.buttonColor,
                border: config.heroCtaStyle === 'outline' ? `2px solid ${config.buttonColor}` : 'none',
                borderRadius: `${config.buttonRadius}px`,
                padding: `6px 14px`,
                textTransform: config.buttonTextTransform as any,
                fontSize: `${Number(config.buttonFontSize || 12) * 0.8}px`
              }}
            >
              {config.heroCtaText}
            </button>
          )}
        </div>
      </div>

      {/* Mock Cards */}
      <div className="p-4 flex-1 overflow-hidden" style={{ padding: `${spacingUnit * 3}px` }}>
        <p className="font-bold uppercase tracking-widest mb-3" style={{ color: config.secondaryColor, fontFamily: config.headingFont, fontSize: h2Size }}>
          Upcoming Trips
        </p>
        <div 
          className={cn(
            "grid gap-3 transition-all",
            isMobile && config.mobileCardLayout === 'stack' ? 'grid-cols-1' : 'grid-cols-2'
          )}
          style={{ gap: `${spacingUnit * 2}px` }}
        >
          {[0, 1].map(i => (
            <div 
              key={i} 
              className={cn(
                "relative overflow-hidden border transition-all duration-300 cursor-pointer",
                config.cardHoverAnimation === 'lift' ? "hover:-translate-y-1 hover:shadow-lg" : "",
                config.cardHoverAnimation === 'scale' ? "hover:scale-[1.02]" : "",
                config.cardHoverAnimation === 'shadow' ? "hover:shadow-lg" : ""
              )} 
              style={{ 
                borderRadius: `${config.cardRadius}px`, 
                boxShadow: config.cardShadow,
                backgroundColor: config.cardBgColor,
                borderColor: config.borderColor,
              }}
            >
              <div className="aspect-[4/3] relative" style={{ filter: `brightness(${config.cardImageBrightness}%)` }}>
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${config.secondaryColor}40, ${config.accentColor}30)` }} />
                <div className="absolute inset-0" style={{ background: `linear-gradient(to top, rgba(0,0,0,${Number(config.cardOverlayDarkness)/100}), transparent)` }} />
              </div>
              <div className="absolute top-2 right-2">
                <div className="px-2 py-0.5 rounded-full text-[7px] font-bold flex items-center gap-0.5" style={{ backgroundColor: config.cardBadgeBg, color: config.cardBadgeText }}>
                  <MapPin className="w-2 h-2" /> Manali
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <p className="font-semibold mb-1" style={{ fontSize: h3Size }}>Mountain Trek</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-white/80">
                      <Clock className="w-2 h-2" style={{ color: config.cardPriceColor }} />
                      <span className="text-[8px]">3 Days</span>
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: config.cardPriceColor }}>₹8,999</span>
                  </div>
                  
                  {config.cardButtonStyle === 'pill' ? (
                    <div className="px-2 py-0.5 rounded-full bg-white text-navy text-[7px] font-bold">Book</div>
                  ) : config.cardButtonStyle === 'none' ? null : (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white/90">
                      <ChevronRight className="w-3 h-3" style={{ color: config.secondaryColor }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================
   SHARED UI COMPONENTS
   ======================================================================== */

function ThemeSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">{icon}</div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-700">{title}</h2>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">{children}</div>
    </section>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</Label>
      <div className="flex gap-2 items-center">
        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shadow-sm cursor-pointer hover:scale-105 transition-transform shrink-0">
          <input type="color" value={value} onChange={e => onChange(e.target.value)} className="absolute inset-[-8px] w-[calc(100%+16px)] h-[calc(100%+16px)] cursor-pointer" />
        </div>
        <Input value={value} onChange={e => onChange(e.target.value)} className="font-mono uppercase text-xs h-10 rounded-lg border-slate-200" />
      </div>
    </div>
  );
}

function SliderControl({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-3">
      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</Label>
      <Slider value={[value]} onValueChange={v => onChange(v[0])} min={min} max={max} step={step || 1} className="py-1" />
    </div>
  );
}

function SelectInput({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</Label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium focus:ring-2 focus:ring-orange-500/20 transition-all">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</Label>
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="h-10 rounded-lg border-slate-200 text-sm" />
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
      <div>
        <Label className="text-sm font-semibold text-slate-900">{label}</Label>
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
