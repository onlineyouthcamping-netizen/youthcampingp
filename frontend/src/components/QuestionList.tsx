"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ChevronRight, CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { API_BASE_URL as API_URL } from "@/lib/api";

interface Question {
  _id: string;
  title: string;
  options: string[];
  answer: string;
  category: string;
}

export default function QuestionList() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/questions`);
      const data = await res.json();
      if (data.success) {
        setQuestions(data.data);
      } else {
        setError("Failed to load questions");
      }
    } catch (err) {
      setError("Unable to connect to the server. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleSelect = (questionId: string, option: string) => {
    if (showResults[questionId]) return;
    setSelectedAnswers({ ...selectedAnswers, [questionId]: option });
  };

  const handleCheck = (questionId: string) => {
    if (!selectedAnswers[questionId]) return;
    setShowResults({ ...showResults, [questionId]: true });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-slate-400 font-bold capitalize tracking-widest text-xs">Loading Knowledge Quest...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2rem] text-center space-y-4">
        <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-xl font-bold text-rose-900">Oops! Something went wrong</h3>
        <p className="text-rose-600 max-w-md mx-auto">{error}</p>
        <button 
          onClick={fetchQuestions}
          className="bg-rose-500 text-white px-6 py-2 rounded-xl font-bold text-sm capitalize tracking-widest hover:bg-rose-600 transition-colors flex items-center gap-2 mx-auto"
        >
          <RefreshCw size={14} /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {questions.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
             <HelpCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
             <p className="text-slate-400 font-bold capitalize tracking-widest text-xs">No questions available yet</p>
          </div>
        ) : (
          questions.map((q, idx) => (
            <motion.div 
              key={q._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-100 border border-slate-50 flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold capitalize tracking-widest">
                  {q.category}
                </span>
                <HelpCircle className="text-primary/30" size={24} />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-8 leading-tight">
                {q.title}
              </h3>

              <div className="space-y-3 flex-grow">
                {q.options.map((opt, i) => {
                  const isSelected = selectedAnswers[q._id] === opt;
                  const isCorrect = q.answer === opt;
                  const showResult = showResults[q._id];

                  let buttonClass = "w-full text-left p-4 rounded-2xl border transition-all duration-300 font-medium ";
                  if (showResult) {
                    if (isCorrect) buttonClass += "bg-emerald-50 border-emerald-200 text-emerald-700 ";
                    else if (isSelected) buttonClass += "bg-rose-50 border-rose-200 text-rose-700 ";
                    else buttonClass += "bg-slate-50 border-slate-100 text-slate-400 ";
                  } else {
                    if (isSelected) buttonClass += "bg-primary border-primary text-black shadow-lg shadow-primary/20 ";
                    else buttonClass += "bg-white border-slate-100 text-slate-600 hover:border-primary/30 hover:bg-slate-50 ";
                  }

                  return (
                    <button 
                      key={i} 
                      onClick={() => handleSelect(q._id, opt)}
                      className={buttonClass}
                    >
                      <div className="flex items-center justify-between">
                        <span>{opt}</span>
                        {showResult && isCorrect && <CheckCircle2 size={18} className="text-emerald-500" />}
                        {showResult && isSelected && !isCorrect && <XCircle size={18} className="text-rose-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8">
                {showResults[q._id] ? (
                  <div className={`p-4 rounded-2xl text-center font-bold text-sm capitalize tracking-widest ${selectedAnswers[q._id] === q.answer ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {selectedAnswers[q._id] === q.answer ? 'Correct!' : 'Wrong Answer'}
                  </div>
                ) : (
                  <button 
                    disabled={!selectedAnswers[q._id]}
                    onClick={() => handleCheck(q._id)}
                    className={`w-full py-4 rounded-2xl font-bold capitalize tracking-[0.2em] text-[10px] transition-all ${selectedAnswers[q._id] ? 'bg-black text-white shadow-xl active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                  >
                    Check Answer
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
