import React, { useState, useEffect } from 'react';
import { 
  Sheet, 
  Settings, 
  Eye, 
  RefreshCw, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import api from '../../services/api';

const DynamicFormAdmin = () => {
  const [forms, setForms] = useState<any[]>([]);
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<any>(null);

  const fetchForms = async () => {
    try {
      const res = await api.get('/dynamic-forms');
      const data = res.data;
      if (data.success) {
        setForms(data.data);
        if (data.data.length > 0 && !selectedForm) {
          setSelectedForm(data.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleSync = async () => {
    if (!selectedForm) return;
    setSyncing(true);
    try {
      const res = await api.get(`/dynamic-forms/${selectedForm._id}/structure?sync=true`);
      const data = res.data;
      if (data.success) {
        // Refresh to get updated fields
        await fetchForms();
        const updated = forms.find(f => f._id === selectedForm._id);
        if (updated) setSelectedForm(updated);
        setMessage({ type: 'success', text: 'Columns synced from Google Sheet!' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Sync failed' });
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.post('/dynamic-forms/config', selectedForm);
      const data = res.data;
      if (data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (index: number, key: string, value: any) => {
    const updatedFields = [...selectedForm.fields];
    updatedFields[index] = { ...updatedFields[index], [key]: value };
    setSelectedForm({ ...selectedForm, fields: updatedFields });
  };

  if (loading) return <div className="p-8 text-center animate-pulse font-black uppercase tracking-widest text-xs opacity-50">Loading Dynamic Sync...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dynamic Booking Forms</h1>
            <p className="text-muted-foreground">Manage forms that mirror Google Sheet columns 1:1.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSync} disabled={syncing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              Sync Columns
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Form List */}
          <Card className="p-4 lg:col-span-1 h-fit">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Sheet size={18} /> Available Forms
            </h3>
            <div className="space-y-1">
              {forms.map(f => (
                <button
                  key={f._id}
                  onClick={() => setSelectedForm(f)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedForm?._id === f._id ? 'bg-primary text-white font-medium' : 'hover:bg-zinc-100'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4 justify-start text-muted-foreground">
              <Plus className="mr-2 h-4 w-4" /> New Form
            </Button>
          </Card>

          {/* Main Panel - Config */}
          <div className="lg:col-span-3 space-y-6">
            {selectedForm && (
              <>
                <Card className="p-6">
                  <h3 className="font-bold mb-6 flex items-center gap-2">
                    <Settings size={18} /> General Config
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Form Name</label>
                      <Input 
                        value={selectedForm.name} 
                        onChange={(e) => setSelectedForm({...selectedForm, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Apps Script URL</label>
                      <Input 
                        value={selectedForm.appsScriptUrl} 
                        onChange={(e) => setSelectedForm({...selectedForm, appsScriptUrl: e.target.value})}
                      />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold flex items-center gap-2">
                      <Eye size={18} /> Field Mapping & Visibility
                    </h3>
                    <span className="text-xs bg-zinc-100 px-2 py-1 rounded text-zinc-500">
                      Total Columns: {selectedForm.fields.length}
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="pb-3 font-semibold">Order</th>
                          <th className="pb-3 font-semibold">Sheet Column (Header)</th>
                          <th className="pb-3 font-semibold">Type</th>
                          <th className="pb-3 font-semibold">Required</th>
                          <th className="pb-3 font-semibold">Visible</th>
                          <th className="pb-3 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedForm.fields.sort((a:any, b:any) => a.order - b.order).map((field: any, index: number) => (
                          <tr key={field.header} className="hover:bg-zinc-50/50">
                            <td className="py-4 text-muted-foreground font-mono">{index + 1}</td>
                            <td className="py-4 font-medium">{field.header}</td>
                            <td className="py-4">
                              <select 
                                className="bg-transparent outline-none border rounded px-2 py-1"
                                value={field.type}
                                onChange={(e) => updateField(index, 'type', e.target.value)}
                              >
                                <option value="text">Text</option>
                                <option value="email">Email</option>
                                <option value="phone">Phone</option>
                                <option value="number">Number</option>
                                <option value="date">Date</option>
                                <option value="select">Dropdown</option>
                                <option value="textarea">Textarea</option>
                              </select>
                            </td>
                            <td className="py-4">
                              <input 
                                type="checkbox" 
                                checked={field.required}
                                onChange={(e) => updateField(index, 'required', e.target.checked)}
                              />
                            </td>
                            <td className="py-4">
                              <input 
                                type="checkbox" 
                                checked={field.visible}
                                onChange={(e) => updateField(index, 'visible', e.target.checked)}
                              />
                            </td>
                            <td className="py-4 text-right">
                              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                <Trash2 size={16} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
    </div>
  );
};

export default DynamicFormAdmin;
