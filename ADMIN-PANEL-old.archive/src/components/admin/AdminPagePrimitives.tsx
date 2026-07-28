import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AdminPageHeaderProps {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}

export function AdminPageHeader({ title, subtitle, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="admin-title">{title}</h1>
        <p className="mt-2 text-[13px] text-slate-500">{subtitle}</p>
      </div>
      {actions ? <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto sm:justify-end">{actions}</div> : null}
    </div>
  );
}

export function AdminKpiGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-2 gap-4 lg:grid-cols-4', className)}>{children}</div>;
}

type KpiTone = 'orange' | 'green' | 'blue' | 'amber' | 'slate';

const kpiToneClasses: Record<KpiTone, string> = {
  orange: 'bg-orange-50 text-primary',
  green: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  slate: 'bg-slate-100 text-slate-600',
};

interface AdminKpiCardProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: KpiTone;
}

export function AdminKpiCard({ icon: Icon, label, value, detail, tone = 'slate' }: AdminKpiCardProps) {
  return (
    <Card className="min-w-0 rounded-lg border-slate-200 shadow-none">
      <div className="flex min-h-[92px] items-center gap-3 p-4">
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-md', kpiToneClasses[tone])}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 truncate text-[20px] font-bold leading-none text-slate-900">{value}</p>
          {detail ? <p className="mt-1 truncate text-[11px] text-slate-500">{detail}</p> : null}
        </div>
      </div>
    </Card>
  );
}

export type AdminStatusTone = 'success' | 'pending' | 'danger' | 'info' | 'neutral';

const statusToneClasses: Record<AdminStatusTone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  neutral: 'border-slate-200 bg-slate-100 text-slate-600',
};

export function AdminStatusBadge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: AdminStatusTone; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded border px-2 py-1 text-[10px] font-bold uppercase leading-none tracking-wide', statusToneClasses[tone], className)}>
      {children}
    </span>
  );
}
