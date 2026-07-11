import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface AdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export function AdminModal({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  children, 
  footer,
  maxWidth = "max-w-2xl"
}: AdminModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(maxWidth, "w-[95vw] sm:w-full flex flex-col p-0 gap-0 max-h-[95dvh] rounded-[24px] md:rounded-[40px] overflow-hidden")}>
        <DialogHeader className="px-4 md:px-8 py-4 md:py-6 border-b bg-white shrink-0 items-start text-left space-y-1">
          <DialogTitle className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900">
            {title}
          </DialogTitle>
          <DialogDescription className={cn(
            "text-[10px] md:text-xs font-medium text-slate-500 uppercase tracking-widest leading-relaxed",
            !description && "sr-only"
          )}>
            {description || title}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {children}
        </div>

        {footer && (
          <DialogFooter className="px-4 md:px-8 py-4 md:py-6 border-t bg-slate-50/50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 w-full">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
