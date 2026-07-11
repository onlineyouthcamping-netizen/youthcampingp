import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, MoreHorizontal, Edit, Trash, HelpCircle, LayoutGrid, Sparkles, CheckCircle2, ChevronRight, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/services/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
  _id: string;
  title: string;
  options: string[];
  answer: string;
  category: string;
  createdAt: string;
}

export default function QuestionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    options: ["", ""],
    answer: "",
    category: "General"
  });

  const queryClient = useQueryClient();

  // Fetch Questions
  const { data: questions, isLoading } = useQuery({
    queryKey: ["questions"],
    queryFn: async () => {
      const res = await api.get("/questions");
      return res.data.data as Question[];
    }
  });

  // Create/Update Mutation
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingQuestion) {
        return api.put(`/questions/${editingQuestion._id}`, data);
      }
      return api.post("/questions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      toast.success(editingQuestion ? "Question updated" : "Question created");
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/questions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      toast.success("Question deleted");
    }
  });

  const handleOpenModal = (question?: Question) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        title: question.title,
        options: [...question.options],
        answer: question.answer,
        category: question.category
      });
    } else {
      setEditingQuestion(null);
      setFormData({
        title: "",
        options: ["", ""],
        answer: "",
        category: "General"
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingQuestion(null);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    setFormData({ ...formData, options: [...formData.options, ""] });
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({ ...formData, options: newOptions });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.answer || formData.options.some(o => !o)) {
      toast.error("Please fill all fields");
      return;
    }
    mutation.mutate(formData);
  };

  const filteredQuestions = questions?.filter(q => 
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] -m-10">
      {/* Header Section (Matching Frontend Hero) */}
      <section className="bg-slate-900 py-16 px-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
           <div className="absolute top-10 left-10 w-40 h-40 bg-primary rounded-full blur-3xl" />
           <div className="absolute bottom-10 right-10 w-60 h-60 bg-teal-500 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
              <Sparkles size={12} /> Admin Console
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter leading-none">
              QUESTION <span className="text-primary italic font-serif font-light">SYSTEM</span>
            </h1>
            <p className="text-slate-400 mt-2 font-light text-sm uppercase tracking-widest">
              Syncing Knowledge across the platform
            </p>
          </div>
          
          <Button 
            onClick={() => handleOpenModal()} 
            className="bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus size={16} /> Add New Question
          </Button>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="px-10 -mt-8 pb-20">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Search Bar */}
          <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-100 border border-slate-50 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                placeholder="Search by title, category, or options..." 
                className="w-full pl-12 pr-4 h-12 bg-slate-50 rounded-xl border-none text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Questions Grid (Matching Frontend QuestionList) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-100 border border-slate-50 h-[300px] animate-pulse">
                  <div className="h-4 w-20 bg-slate-100 rounded-full mb-6" />
                  <div className="h-8 w-full bg-slate-100 rounded-lg mb-8" />
                  <div className="space-y-3">
                    <div className="h-10 w-full bg-slate-50 rounded-xl" />
                    <div className="h-10 w-full bg-slate-50 rounded-xl" />
                  </div>
                </div>
              ))
            ) : filteredQuestions?.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                 <HelpCircle className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                 <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No questions found</p>
              </div>
            ) : (
              filteredQuestions?.map((q) => (
                <motion.div 
                  layout
                  key={q._id}
                  className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-100 border border-slate-50 flex flex-col group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500"
                >
                  <div className="flex justify-between items-start mb-6">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {q.category}
                    </Badge>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(q)} className="p-2 bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => { if(confirm("Delete this question?")) deleteMutation.mutate(q._id) }}
                        className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-6 leading-tight flex-grow">
                    {q.title}
                  </h3>

                  <div className="space-y-2 mb-6">
                    {q.options.slice(0, 3).map((opt, i) => (
                      <div key={i} className={`text-xs p-3 rounded-xl border flex justify-between items-center ${opt === q.answer ? 'bg-emerald-50 border-emerald-100 text-emerald-700 font-bold' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                        <span className="truncate">{opt}</span>
                        {opt === q.answer && <CheckCircle2 size={12} />}
                      </div>
                    ))}
                    {q.options.length > 3 && (
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-2">
                        + {q.options.length - 3} more options
                      </p>
                    )}
                  </div>

                  <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <HelpCircle size={14} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 leading-none">Correct</p>
                        <p className="text-[11px] font-bold text-emerald-600 truncate max-w-[120px]">{q.answer}</p>
                      </div>
                    </div>
                    <button onClick={() => handleOpenModal(q)} className="text-slate-300 hover:text-primary transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal (Matching Frontend Design) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-900 p-8 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-20">
              <Sparkles size={48} className="text-primary" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
                {editingQuestion ? "Refine Question" : "New Knowledge Entry"}
              </DialogTitle>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Configure interactive content</p>
            </DialogHeader>
          </div>
          
          <form onSubmit={handleSubmit} className="p-10 space-y-8 bg-white">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Question Statement</Label>
                <Input 
                  className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all text-sm font-medium"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What would you like to ask?"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Category</Label>
                  <Input 
                    className="h-12 rounded-xl border-slate-100 bg-slate-50/50"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Adventure"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Total Options</Label>
                  <div className="h-12 flex items-center px-4 bg-slate-50 rounded-xl text-xs font-bold text-slate-500 border border-slate-100">
                    {formData.options.length} Interactive Choices
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center ml-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Choice Configuration</Label>
                  <button type="button" onClick={addOption} className="text-[10px] font-black uppercase text-primary tracking-widest hover:text-teal-600 flex items-center gap-1 transition-colors">
                    <Plus size={12} /> Add Choice
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formData.options.map((option, idx) => (
                    <div key={idx} className="relative group">
                      <Input 
                        className={`h-12 pr-10 rounded-xl text-xs font-medium transition-all ${formData.answer === option && option !== "" ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 bg-slate-50/30'}`}
                        value={option}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                      />
                      <button 
                        type="button" 
                        onClick={() => removeOption(idx)}
                        disabled={formData.options.length <= 2}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 disabled:opacity-0 transition-all"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Validated Correct Answer</Label>
                <div className="relative">
                  <select 
                    className="w-full h-14 px-4 pr-10 rounded-2xl border border-slate-100 bg-slate-50/50 text-sm font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  >
                    <option value="">Select validated answer</option>
                    {formData.options.filter(o => o).map((option, idx) => (
                      <option key={idx} value={option}>{option}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                    <ChevronRight size={18} className="rotate-90" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={handleCloseModal}
                className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                className="flex-[2] h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-slate-200 transition-all active:scale-95"
              >
                {mutation.isPending ? "Synchronizing..." : editingQuestion ? "Update Knowledge" : "Publish Entry"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
