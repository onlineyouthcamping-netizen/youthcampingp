"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, User, Clock, Share2 } from "lucide-react";
import { useEffect } from "react";
import { normalizeImageUrl } from "@/lib/api";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface BlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  blog: {
    title: string;
    author: string;
    authorImage?: string;
    readTime: string;
    image: string;
    content: string;
    createdAt?: string;
  } | null;
}

export default function BlogModal({ isOpen, onClose, blog }: BlogModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !blog) return null;

  const dateStr = blog.createdAt 
    ? new Date(blog.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : "May 2026";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-navy/80 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white hover:text-navy transition-all border border-white/30"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Main Scrollable Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {/* Hero Image Section */}
            <div className="relative h-[300px] md:h-[450px] w-full">
              <OptimizedImage 
                src={normalizeImageUrl(blog.image)} 
                alt={blog.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <div className="absolute bottom-10 left-10 right-10">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex flex-wrap gap-3">
                    <span className="px-4 py-1.5 rounded-full bg-primary text-white font-bold text-[10px] capitalize tracking-widest shadow-lg">
                      Travel Journal
                    </span>
                    <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white font-bold text-[10px] capitalize tracking-widest border border-white/20">
                      {blog.readTime}
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-bold text-white capitalize tracking-tighter leading-none drop-shadow-2xl">
                    {blog.title}
                  </h1>
                </motion.div>
              </div>
            </div>

            {/* Content Body */}
            <div className="px-6 md:px-16 py-12">
              <div className="flex flex-col md:flex-row gap-12">
                {/* Main Text Content */}
                <div className="flex-1 space-y-8">
                  {/* Meta Bar */}
                  <div className="flex items-center gap-6 p-6 bg-zinc-50 rounded-[32px] border border-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
                        <OptimizedImage 
                          src={normalizeImageUrl(blog.authorImage || "")} 
                          alt={blog.author}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold capitalize text-zinc-400 tracking-widest">Authored By</p>
                        <p className="text-sm font-bold text-navy">{blog.author}</p>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-zinc-200" />
                    <div>
                      <p className="text-[10px] font-bold capitalize text-zinc-400 tracking-widest">Published On</p>
                      <p className="text-sm font-bold text-navy">{dateStr}</p>
                    </div>
                  </div>

                  {/* HTML Content */}
                  <div 
                    className="prose prose-stone prose-lg max-w-none 
                                prose-p:text-zinc-600 prose-p:leading-relaxed prose-p:font-medium
                                prose-headings:text-navy prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter
                                prose-strong:text-navy prose-strong:font-black
                                prose-img:rounded-[32px] prose-img:shadow-xl"
                    dangerouslySetInnerHTML={{ __html: blog.content }}
                  />
                </div>

                {/* Sidebar */}
                <div className="w-full md:w-64 space-y-8">
                  <div className="p-8 bg-navy text-white rounded-[40px] shadow-xl space-y-6">
                    <p className="text-[10px] font-bold capitalize tracking-widest opacity-60">Share Adventure</p>
                    <div className="flex flex-col gap-4">
                      <button className="flex items-center gap-3 group text-sm font-bold">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#1877F2] transition-colors">
                          <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </div>
                        Facebook
                      </button>
                      <button className="flex items-center gap-3 group text-sm font-bold">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#ee2a7b] transition-colors">
                          <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        </div>
                        Instagram
                      </button>
                      <button className="flex items-center gap-3 group text-sm font-bold">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-black transition-colors">
                          <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        </div>
                        Twitter
                      </button>
                    </div>
                  </div>

                  <div className="p-8 bg-primary/5 border-2 border-primary/10 rounded-[40px] space-y-4">
                    <h4 className="font-bold text-navy capitalize text-sm tracking-tight leading-none">Ready for your own story?</h4>
                    <p className="text-[11px] text-zinc-500 font-bold leading-relaxed">Book a trip today and start your own adventure in the Himalayas.</p>
                    <button className="w-full py-3 bg-primary text-white rounded-2xl font-bold text-[10px] capitalize tracking-widest shadow-lg shadow-primary/20">
                      Explore Trips
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
