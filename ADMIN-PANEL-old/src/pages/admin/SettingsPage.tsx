import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { settingsService } from "@/services/settings.service";
import { toast } from "sonner";
import {
  Palette, Navigation, Share2, Save, Plus, Trash2, HelpCircle, Sparkles, Settings
} from "lucide-react";
import api from "@/services/api";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { register, handleSubmit, reset, watch, setValue } = useForm<any>();

  const navbarLinks = watch('navbarLinks') || [];
  const roomSharingOptions = watch('bookingForm.roomSharingOptions') || [];
  const trainOptions = watch('bookingForm.trainOptions') || [];

  useEffect(() => {
    const load = async () => {
      try {
        const data = await settingsService.get();
        // Fallback for nested default structures
        const formatted = {
          ...data,
          navbarLinks: data.navbarLinks || [],
          socialLinks: data.socialLinks || {},
          footer: data.footer || { links: [] },
          bookingForm: data.bookingForm || { roomSharingOptions: [], trainOptions: [] },
          inquiryPopup: data.inquiryPopup || {
            enabled: true,
            delay: 12,
            title: "Plan Your Next Trip",
            description: "Connect with our destination experts"
          }
        };
        reset(formatted);
      } catch (err) {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [reset]);

  const onSubmit = async (data: any) => {
    try {
      await settingsService.update(data);
      toast.success("Settings updated");
      api.post('/revalidate', { path: '/' }).catch(() => {});
    } catch (err) {
      toast.error("Failed to update settings");
    }
  };

  const addNavbarLink = () => {
    setValue('navbarLinks', [...navbarLinks, { label: '', href: '', order: navbarLinks.length }]);
  };

  const removeNavbarLink = (index: number) => {
    setValue('navbarLinks', navbarLinks.filter((_: any, i: number) => i !== index));
  };

  const addRoomOption = () => {
    setValue('bookingForm.roomSharingOptions', [...roomSharingOptions, { label: '', priceAdjustment: 0 }]);
  };

  const removeRoomOption = (index: number) => {
    setValue('bookingForm.roomSharingOptions', roomSharingOptions.filter((_: any, i: number) => i !== index));
  };

  const addTrainOption = () => {
    setValue('bookingForm.trainOptions', [...trainOptions, { label: '', priceAdjustment: 0 }]);
  };

  const removeTrainOption = (index: number) => {
    setValue('bookingForm.trainOptions', trainOptions.filter((_: any, i: number) => i !== index));
  };

  const heroVideoUrl = watch('heroVideoUrl');
  const heroVideoEnabled = watch('heroVideoEnabled');
  const heroVideoPosterUrl = watch('heroVideoPosterUrl');

  const handleToggleVideo = async () => {
    try {
      const res = await api.patch('/settings/hero-video/toggle');
      if (res.data && res.data.success) {
        setValue('heroVideoEnabled', res.data.data.heroVideoEnabled);
        toast.success(`Hero video ${res.data.data.heroVideoEnabled ? 'enabled' : 'disabled'}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to toggle hero video");
    }
  };

  const handleDeleteVideo = async () => {
    if (!window.confirm("Are you sure you want to remove the Hero Video? This will delete it permanently.")) {
      return;
    }
    try {
      const res = await api.delete('/settings/hero-video');
      if (res.data && res.data.success) {
        setValue('heroVideoUrl', null);
        setValue('heroVideoPublicId', null);
        setValue('heroVideoPosterUrl', null);
        setValue('heroVideoEnabled', false);
        toast.success("Hero video removed successfully");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete hero video");
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.mp4', '.webm', '.mov'].includes(ext)) {
      toast.error("Only .mp4, .webm, and .mov files are accepted.");
      return;
    }

    const formData = new FormData();
    formData.append('video', file);

    setUploading(true);
    setUploadProgress(0);

    try {
      const res = await api.post('/settings/hero-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      });

      if (res.data && res.data.success) {
        setValue('heroVideoUrl', res.data.data.heroVideoUrl);
        setValue('heroVideoPublicId', res.data.data.heroVideoPublicId);
        setValue('heroVideoPosterUrl', res.data.data.heroVideoPosterUrl);
        setValue('heroVideoEnabled', res.data.data.heroVideoEnabled);
        toast.success("Hero video uploaded successfully");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload video");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return <div className="p-10 text-center font-bold uppercase tracking-widest opacity-40">Loading System Settings...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-[#F4F7FB] min-h-screen -mx-6 -my-6">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Settings className="w-5 h-5 text-[#F97316]" />
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Global Settings</h1>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Configure site-wide branding, navigation, social accounts, and checkout rules</p>
          </div>
        </div>
        <Button onClick={handleSubmit(onSubmit)} className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white flex items-center gap-1.5 shadow-sm">
          <Save className="w-4 h-4" /> Save Changes
        </Button>
      </div>

      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="flex items-center w-full border-b border-[#E2E8F0] bg-transparent p-0 h-9 rounded-none gap-6 justify-start mb-6">
          <TabsTrigger value="branding" className="bg-transparent hover:bg-transparent border-b-2 border-transparent data-[state=active]:border-[#F97316] data-[state=active]:bg-transparent rounded-none px-1 pb-2 pt-1.5 text-xs font-semibold text-slate-500 data-[state=active]:text-slate-800 shadow-none"><Palette className="w-3.5 h-3.5 mr-1.5" /> Branding</TabsTrigger>
          <TabsTrigger value="navigation" className="bg-transparent hover:bg-transparent border-b-2 border-transparent data-[state=active]:border-[#F97316] data-[state=active]:bg-transparent rounded-none px-1 pb-2 pt-1.5 text-xs font-semibold text-slate-500 data-[state=active]:text-slate-800 shadow-none"><Navigation className="w-3.5 h-3.5 mr-1.5" /> Navigation</TabsTrigger>
          <TabsTrigger value="social" className="bg-transparent hover:bg-transparent border-b-2 border-transparent data-[state=active]:border-[#F97316] data-[state=active]:bg-transparent rounded-none px-1 pb-2 pt-1.5 text-xs font-semibold text-slate-500 data-[state=active]:text-slate-800 shadow-none"><Share2 className="w-3.5 h-3.5 mr-1.5" /> Social</TabsTrigger>
          <TabsTrigger value="booking" className="bg-transparent hover:bg-transparent border-b-2 border-transparent data-[state=active]:border-[#F97316] data-[state=active]:bg-transparent rounded-none px-1 pb-2 pt-1.5 text-xs font-semibold text-slate-500 data-[state=active]:text-slate-800 shadow-none"><HelpCircle className="w-3.5 h-3.5 mr-1.5" /> Booking</TabsTrigger>
          <TabsTrigger value="inquiryPopup" className="bg-transparent hover:bg-transparent border-b-2 border-transparent data-[state=active]:border-[#F97316] data-[state=active]:bg-transparent rounded-none px-1 pb-2 pt-1.5 text-xs font-semibold text-slate-500 data-[state=active]:text-slate-800 shadow-none"><Sparkles className="w-3.5 h-3.5 mr-1.5" /> Inquiry Popup</TabsTrigger>
        </TabsList>

        {/* --- BRANDING --- */}
        <TabsContent value="branding" className="mt-6 space-y-6">
          <Card className="bg-white rounded-md border border-slate-200 shadow-sm p-5">
            <CardContent className="p-0 space-y-6">
              <h2 className="admin-heading">Brand & Identity</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="admin-label">Brand Name</Label>
                  <Input {...register("siteName")} className="admin-input" placeholder="e.g. YouthCamping" />
                </div>
                <div className="space-y-2">
                  <Label className="admin-label">Favicon URL</Label>
                  <Input {...register("favicon")} className="admin-input" placeholder="/favicon.ico" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="admin-label">Header Logo URL</Label>
                  <Input {...register("logo.url")} className="admin-input" placeholder="https://..." />
                  {watch('logo.url') && (
                    <div className="mt-2 h-14 rounded-[4px] border border-[#E2E8F0] p-2 bg-[#F8FAFC] flex items-center justify-center overflow-hidden max-w-fit">
                      <img src={watch('logo.url')} className="max-h-full object-contain" alt="Header logo" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="admin-label">Logo Alt Text</Label>
                  <Input {...register("logo.alt")} className="admin-input" placeholder="Brand Logo Alt" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-md border border-slate-200 shadow-sm p-5">
            <CardContent className="p-0 space-y-6">
              <h2 className="admin-heading">Hero Video Settings</h2>
              <p className="admin-body">Upload and manage a self-hosted hero background video. If enabled, this video plays instead of the static image or YouTube video.</p>

              <div className="space-y-4">
                <div className="flex items-center justify-between bg-[#F8FAFC] p-4 rounded-[4px] border border-[#E2E8F0]">
                  <div>
                    <Label className="admin-label block font-semibold">Enable Hero Video</Label>
                    <span className="text-[11px] text-slate-500 mt-0.5">Toggle whether the self-hosted video is active.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleVideo}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
                      heroVideoEnabled ? 'bg-primary-orange' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        heroVideoEnabled ? 'translate-x-5.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {heroVideoUrl && (
                  <div className="space-y-2">
                    <Label className="admin-label">Current Video Preview</Label>
                    <div className="rounded-[4px] overflow-hidden border border-[#E2E8F0] bg-slate-900 max-w-xl aspect-video relative flex items-center justify-center">
                      <video
                        src={heroVideoUrl}
                        controls
                        muted
                        className="w-full h-full object-cover"
                        poster={heroVideoPosterUrl || undefined}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="relative">
                      <input
                        type="file"
                        id="hero-video-file"
                        accept=".mp4,.webm,.mov"
                        className="hidden"
                        onChange={handleVideoUpload}
                        disabled={uploading}
                      />
                      <Button
                        type="button"
                        onClick={() => document.getElementById('hero-video-file')?.click()}
                        disabled={uploading}
                        className="h-8.5 px-4 rounded-[4px] font-semibold text-xs bg-primary-orange hover:bg-primary-orange/90 text-white"
                      >
                        {uploading ? `Uploading (${uploadProgress}%)` : 'Upload Video'}
                      </Button>
                    </div>

                    {heroVideoUrl && (
                      <Button
                        type="button"
                        onClick={handleDeleteVideo}
                        variant="destructive"
                        disabled={uploading}
                        className="bg-red-650 hover:bg-red-750 text-white rounded-[4px] px-3.5 h-8.5 font-semibold text-xs"
                      >
                        Remove Video
                      </Button>
                    )}
                  </div>

                  {uploading && (
                    <div className="w-full bg-slate-100 rounded-none h-1.5 overflow-hidden">
                      <div
                        className="bg-primary-orange h-1.5 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}

                  <p className="text-xs text-slate-550 font-medium">
                    Recommended: 25 seconds or less, MP4 or WebM, under 5MB. MOV files will be auto-converted.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- NAVIGATION --- */}
        <TabsContent value="navigation" className="mt-6 animate-premium">
          <Card className="bg-white rounded-md border border-slate-200 shadow-sm p-4">
            <CardContent className="p-0 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="admin-heading">Navigation Settings</h2>
                <Button variant="outline" size="sm" onClick={addNavbarLink} className="admin-button-outline h-8 text-xs">
                  <Plus className="w-3.5 h-3.5" /> Add Link
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="admin-label">CTA Button Text (Desktop Header)</Label>
                  <Input {...register("headerCtaText")} className="admin-input" placeholder="e.g. Book Now" />
                </div>
                <div className="space-y-2">
                  <Label className="admin-label">Header Style</Label>
                  <select {...register("headerStyle")} className="admin-input">
                    <option value="sticky">Sticky Header (Default)</option>
                    <option value="normal">Normal Scroll</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="admin-label">Header Menu Links</Label>
                {navbarLinks.map((link: any, index: number) => (
                  <div key={index} className="flex gap-4 items-center bg-slate-50 p-4 rounded-md border border-slate-200 border-dashed group">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input {...register(`navbarLinks.${index}.label`)} placeholder="Link Text (e.g. Trips)" className="admin-input h-9" />
                      <Input {...register(`navbarLinks.${index}.href`)} placeholder="URL Path (e.g. /trips)" className="admin-input h-9 font-mono" />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeNavbarLink(index)} className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg h-9 w-9">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {navbarLinks.length === 0 && (
                  <div className="text-center py-8 border border-dashed rounded-md border-slate-200 text-slate-400 text-xs">
                    No navbar links defined. Click Add Link to insert menu items.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- SOCIAL MEDIA --- */}
        <TabsContent value="social" className="mt-6 animate-premium">
          <Card className="bg-white rounded-md border border-slate-200 shadow-sm p-4">
            <CardContent className="p-0 space-y-6">
              <h2 className="admin-heading">Social Media Links</h2>
              <p className="admin-body">Add links to your official brand handles. These automatically map to the social icons in the footer.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['instagram', 'facebook', 'youtube', 'linkedin', 'whatsapp'].map(platform => (
                  <div key={platform} className="space-y-2">
                    <Label className="admin-label capitalize">{platform} URL</Label>
                    <Input {...register(`socialLinks.${platform}`)} className="admin-input" placeholder={`https://${platform}.com/...`} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- BOOKING CHECKOUT --- */}
        <TabsContent value="booking" className="mt-6 animate-premium">
          <Card className="bg-white rounded-md border border-slate-200 shadow-sm p-4">
            <CardContent className="p-0 space-y-6">
              <h2 className="admin-heading">Booking Options & Forms</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="admin-label">Submit Button Text</Label>
                  <Input {...register("bookingForm.submitButtonText")} className="admin-input" placeholder="Confirm Booking" />
                </div>
                <div className="space-y-2">
                  <Label className="admin-label">Booking Success Message</Label>
                  <Input {...register("bookingForm.successMessage")} className="admin-input" placeholder="Your booking has been received!" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="admin-label">Checkout Special Notes / Policy</Label>
                <textarea {...register("bookingForm.checkoutNotes")} className="admin-input h-20 py-2" placeholder="Enter special policies or warnings shown during checkout..." />
              </div>

              <div className="space-y-2">
                <Label className="admin-label">GST Calculation Rule</Label>
                <select {...register("bookingForm.gstOption")} className="admin-input">
                  <option value="full">Calculate GST on Full Package Amount (Option A)</option>
                  <option value="advance">Calculate GST only on Booking/Advance Amount (Option B)</option>
                </select>
              </div>

              {/* Room Sharing options */}
              <div className="border-t pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="admin-card-title">Room Sharing Accommodations</h3>
                  <Button variant="outline" size="sm" onClick={addRoomOption} className="admin-button-outline h-8 text-xs">
                    <Plus className="w-3.5 h-3.5" /> Add Option
                  </Button>
                </div>
                {roomSharingOptions.map((_: any, index: number) => (
                  <div key={index} className="flex gap-4 items-center bg-slate-50 p-4 rounded-md border border-slate-200 border-dashed group">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input {...register(`bookingForm.roomSharingOptions.${index}.label`)} placeholder="Label (e.g. Double Sharing)" className="admin-input h-9" />
                      <Input {...register(`bookingForm.roomSharingOptions.${index}.priceAdjustment`)} type="number" placeholder="Price Adjustment (+/-)" className="admin-input h-9" />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeRoomOption(index)} className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg h-9 w-9">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Train options */}
              <div className="border-t pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="admin-card-title">Train Class Selections</h3>
                  <Button variant="outline" size="sm" onClick={addTrainOption} className="admin-button-outline h-8 text-xs">
                    <Plus className="w-3.5 h-3.5" /> Add Option
                  </Button>
                </div>
                {trainOptions.map((_: any, index: number) => (
                  <div key={index} className="flex gap-4 items-center bg-slate-50 p-4 rounded-md border border-slate-200 border-dashed group">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input {...register(`bookingForm.trainOptions.${index}.label`)} placeholder="Label (e.g. 3AC Sleepers)" className="admin-input h-9" />
                      <Input {...register(`bookingForm.trainOptions.${index}.priceAdjustment`)} type="number" placeholder="Price Adjustment (+/-)" className="admin-input h-9" />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeTrainOption(index)} className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg h-9 w-9">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- INQUIRY POPUP --- */}
        <TabsContent value="inquiryPopup" className="mt-6 animate-premium">
          <Card className="bg-white rounded-md border border-slate-200 shadow-sm p-4">
            <CardContent className="p-0 space-y-6">
              <h2 className="admin-heading">Trip Inquiry Popup Settings</h2>
              <p className="admin-body">Configure the automatic inquiry form popup that appears on Trip Detail pages.</p>

              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-md border border-slate-200">
                  <div>
                    <Label className="admin-label block font-semibold">Enable Automatic Popup</Label>
                    <span className="text-xs text-slate-500">Toggle whether the inquiry popup is displayed automatically on trip detail pages.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setValue('inquiryPopup.enabled', !watch('inquiryPopup.enabled'))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      watch('inquiryPopup.enabled') ? 'bg-primary-orange' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        watch('inquiryPopup.enabled') ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="admin-label">Popup Delay (Seconds)</Label>
                    <Input
                      type="number"
                      min="1"
                      {...register("inquiryPopup.delay", { valueAsNumber: true })}
                      className="admin-input"
                      placeholder="e.g. 12"
                    />
                    <span className="text-xs text-slate-400">Delay in seconds before the popup triggers after the page loads.</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label className="admin-label">Popup Title</Label>
                    <Input
                      {...register("inquiryPopup.title")}
                      className="admin-input"
                      placeholder="e.g. Plan Your Next Trip"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="admin-label">Popup Description / Subtitle</Label>
                    <Input
                      {...register("inquiryPopup.description")}
                      className="admin-input"
                      placeholder="e.g. Connect with our destination experts"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
