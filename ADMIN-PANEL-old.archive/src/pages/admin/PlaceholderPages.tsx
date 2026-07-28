import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from "recharts";
import { 
  LayoutGrid, Star, Share2, BarChart3, CreditCard, Users, 
  Construction, ArrowUpRight, Target, Zap, TrendingUp,
  Download, Filter, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SAMPLE_DATA = [
  { name: 'Mon', val: 4000 }, { name: 'Tue', val: 3000 },
  { name: 'Wed', val: 5000 }, { name: 'Thu', val: 2780 },
  { name: 'Fri', val: 1890 }, { name: 'Sat', val: 2390 },
  { name: 'Sun', val: 3490 },
];

export default function PlaceholderPage({ title, description, icon: Icon }: { title: string, description: string, icon: any }) {
  return (
    <div className="space-y-10 animate-fade-in">
       <div className="flex items-center justify-between">
          <div className="space-y-1">
             <h1 className="text-3xl font-black uppercase tracking-tight">{title}</h1>
             <p className="text-muted-foreground font-medium text-sm">{description}</p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest opacity-50 cursor-not-allowed">
               <Download className="w-4 h-4 mr-2" /> Export
             </Button>
             <Button className="rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest bg-black text-white hover:bg-black/90">
               Request Early Access
             </Button>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
             <Card key={i} className="rounded-[32px] border-2 border-border/50 bg-white/50 overflow-hidden group">
                <CardContent className="p-8 space-y-4">
                   <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                      <Zap className="w-6 h-6 text-muted-foreground opacity-40" />
                   </div>
                   <div className="h-4 w-1/2 bg-muted rounded-full animate-pulse" />
                   <div className="h-8 w-3/4 bg-muted/40 rounded-full animate-pulse" />
                </CardContent>
             </Card>
          ))}
       </div>

       <div className="bg-white border-2 border-dashed border-border rounded-[48px] p-20 flex flex-col items-center justify-center text-center space-y-8 min-h-[400px]">
          <div className="w-24 h-24 bg-primary/5 rounded-[40px] flex items-center justify-center text-primary relative">
             <div className="absolute inset-0 bg-primary/10 rounded-[40px] animate-ping opacity-20" />
             <Icon className="w-10 h-10 relative z-10" />
          </div>
          <div className="space-y-2">
             <h2 className="text-xl font-black uppercase tracking-tight">Module Integration Pending</h2>
             <p className="text-sm text-muted-foreground max-w-sm mx-auto font-medium">This professional administrative module is currently being optimized for high-volume data processing.</p>
          </div>
       </div>
    </div>
  );
}

export const CollectionsPage = () => <PlaceholderPage title="Collections" description="Organize your trips into curated categories for better discoverability." icon={LayoutGrid} />;
export const PromotionsPage = () => <PlaceholderPage title="Promotions" description="Manage discount codes and seasonal campaign triggers." icon={Star} />;
export const DistributionPage = () => <PlaceholderPage title="Distribution" description="Connect with OTAs and external travel marketplaces." icon={Share2} />;
export const CustomersPage = () => <PlaceholderPage title="Customers" description="Manage your global customer database and loyalty tiers." icon={Users} />;

export const ReportsPage = () => (
  <div className="space-y-10 animate-fade-in pb-20">
     <div className="flex items-center justify-between">
        <div className="space-y-1">
           <h1 className="text-3xl font-black uppercase tracking-tight">Reports & Analytics</h1>
           <p className="text-muted-foreground font-medium text-sm">Deep-dive into revenue analytics and customer behavior.</p>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" className="rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest border-2">
             <Calendar className="w-4 h-4 mr-2" /> Last 30 Days
           </Button>
           <Button className="rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest bg-black text-white">
             <Download className="w-4 h-4 mr-2" /> Download Full Audit
           </Button>
        </div>
     </div>

     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Conversion Rate', val: '4.2%', change: '+0.5%', icon: Target },
          { label: 'Avg Order Value', val: '₹12,450', change: '+12%', icon: TrendingUp },
          { label: 'New Customers', val: '124', change: '+18%', icon: Users },
          { label: 'Net Profit', val: '₹4.2L', change: '+5.2%', icon: ArrowUpRight },
        ].map((kpi, i) => (
           <Card key={i} className="rounded-[32px] border-2 border-border bg-white shadow-sm overflow-hidden transition-all hover:border-primary">
              <CardContent className="p-8 space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                       <kpi.icon className="w-5 h-5 text-gray-400" />
                    </div>
                    <span className="text-[10px] font-black text-green-500 bg-green-50 px-2 py-1 rounded-full">{kpi.change}</span>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{kpi.label}</p>
                    <p className="text-2xl font-black tracking-tight">{kpi.val}</p>
                 </div>
              </CardContent>
           </Card>
        ))}
     </div>

     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-[40px] border-2 border-border bg-white overflow-hidden p-10 space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="font-black uppercase tracking-widest text-xs">Revenue Projection</h3>
              <div className="flex gap-2">
                 <div className="h-3 w-3 rounded-full bg-primary" />
                 <div className="h-3 w-3 rounded-full bg-muted" />
              </div>
           </div>
           <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={SAMPLE_DATA}>
                    <defs>
                       <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2 }} />
                    <Area type="monotone" dataKey="val" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorVal)" strokeWidth={4} />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </Card>

        <Card className="rounded-[40px] border-2 border-border bg-white overflow-hidden p-10 space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="font-black uppercase tracking-widest text-xs">Marketing Reach</h3>
              <Filter className="w-4 h-4 text-muted-foreground" />
           </div>
           <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={SAMPLE_DATA}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: '#f8f8f8' }} />
                    <Bar dataKey="val" fill="#000" radius={[12, 12, 12, 12]} barSize={20} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </Card>
     </div>
  </div>
);

export const BillingPage = () => (
  <div className="max-w-4xl mx-auto space-y-10 animate-fade-in">
     <div className="space-y-1">
        <h1 className="text-3xl font-black uppercase tracking-tight">Billing & Plans</h1>
        <p className="text-muted-foreground font-medium text-sm">Manage your platform subscription and payment nodes.</p>
     </div>

     <Card className="rounded-[40px] border-2 border-black bg-black text-white overflow-hidden p-10 relative">
        <div className="absolute right-10 top-10 w-20 h-20 bg-primary rounded-full blur-3xl opacity-20" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
           <div className="space-y-4">
              <div className="px-4 py-1 bg-primary text-black text-[9px] font-black uppercase rounded-full w-fit">Current Plan: Enterprise</div>
              <h2 className="text-4xl font-black tracking-tight uppercase">Infinite Growth Plan</h2>
              <p className="text-gray-400 text-sm font-medium">Your next billing cycle starts on <strong className="text-white">May 12, 2024</strong>.</p>
           </div>
           <div className="flex flex-col items-end gap-2">
              <p className="text-4xl font-black tracking-tighter">₹4,999<span className="text-xs text-gray-500 uppercase ml-2">/month</span></p>
              <Button className="rounded-xl h-11 px-8 bg-white text-black font-black uppercase text-[10px] tracking-widest hover:bg-gray-200">Manage Billing</Button>
           </div>
        </div>
     </Card>

     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="rounded-[40px] border-2 border-border bg-white p-10 space-y-6">
           <h3 className="font-black uppercase tracking-widest text-xs">Payment Method</h3>
           <div className="flex items-center gap-6 p-6 border-2 border-border rounded-3xl">
              <div className="w-14 h-10 bg-muted rounded-lg flex items-center justify-center">
                 <CreditCard className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                 <p className="font-black text-sm uppercase">Visa •••• 4242</p>
                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Expires 12/26</p>
              </div>
              <Button variant="ghost" className="ml-auto text-primary text-[10px] font-black uppercase tracking-widest">Edit</Button>
           </div>
        </Card>

        <Card className="rounded-[40px] border-2 border-border bg-white p-10 space-y-6">
           <h3 className="font-black uppercase tracking-widest text-xs">Recent Invoices</h3>
           <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-tighter">INV-00{i+24}</span>
                      <span className="text-[8px] text-muted-foreground font-bold">April 12, 2024</span>
                   </div>
                   <Button variant="ghost" size="icon"><Download className="w-4 h-4" /></Button>
                </div>
              ))}
           </div>
        </Card>
     </div>
  </div>
);
