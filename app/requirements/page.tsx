"use client";

import React, { useState } from "react";
import { Search, Share2, ClipboardList, CheckCircle2, Phone, Briefcase, Building2, Scale } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { requirementsData } from "./data";

export default function RequirementsPage() {
    const [search, setSearch] = useState("");

    const categories = Object.keys(requirementsData);
    const filteredCategories = categories.filter(cat => 
        cat.toLowerCase().includes(search.toLowerCase())
    );

    const handleShare = (title: string, items: string[]) => {
        let text = `*${title}*\n\nDocuments / Details Required:\n`;
        items.forEach(item => {
            if (item.startsWith('---')) {
                text += `\n*${item.replace(/---/g, '').trim()}*\n`;
            } else {
                text += `• ${item}\n`;
            }
        });
        
        text += `\n\nRegards.\n*OMER PERVAIZ MALIK*\nAdvocate High Court\nCEO Get Legal Solution\nContact: 03014991700`;

        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    };

    return (
        <div className="flex h-full w-full bg-slate-50">
            <Sidebar />
            
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto space-y-8 pb-12">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="pl-12 lg:pl-0">
                                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center">
                                    <ClipboardList className="w-7 h-7 md:w-8 md:h-8 mr-3 text-amber-500" />
                                    Doc Requirements
                                </h1>
                                <p className="text-sm md:text-base text-slate-500 font-medium mt-1">Official checklists for business registrations and compliance.</p>
                            </div>
                            
                            <div className="relative w-full md:w-96">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search requirements..." 
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-sm md:text-base"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCategories.map((title) => {
                                const items = requirementsData[title as keyof typeof requirementsData];
                                return (
                                    <div key={title} className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all duration-300 flex flex-col overflow-hidden relative h-[420px] md:h-[480px]">
                                        {/* Card Header Decoration */}
                                        <div className="h-1.5 w-full bg-slate-100 group-hover:bg-amber-500 transition-colors" />
                                        
                                        <div className="p-5 md:p-6 flex-1 flex flex-col min-h-0">
                                            <div className="flex justify-between items-start mb-4 md:mb-6">
                                                <div className="bg-slate-50 p-2 md:p-2.5 rounded-xl group-hover:bg-amber-50 transition-colors">
                                                    {title.includes('Company') || title.includes('SECP') ? (
                                                        <Building2 className="w-5 h-5 md:w-6 md:h-6 text-slate-600 group-hover:text-amber-600" />
                                                    ) : title.includes('Tax') || title.includes('FBR') || title.includes('PRA') || title.includes('NTN') ? (
                                                        <Scale className="w-5 h-5 md:w-6 md:h-6 text-slate-600 group-hover:text-amber-600" />
                                                    ) : (
                                                        <Briefcase className="w-5 h-5 md:w-6 md:h-6 text-slate-600 group-hover:text-amber-600" />
                                                    )}
                                                </div>
                                                <button 
                                                    onClick={() => handleShare(title, items)}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-100"
                                                >
                                                    <Share2 className="w-3.5 h-3.5" />
                                                    Share
                                                </button>
                                            </div>

                                            <h3 className="text-sm md:text-lg font-black text-slate-800 leading-tight mb-4 group-hover:text-amber-600 transition-colors">
                                                {title}
                                            </h3>

                                            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar touch-pan-y min-h-0">
                                                {items.map((item, i) => (
                                                    item.startsWith('---') ? (
                                                        <div key={i} className="pt-2 pb-1 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                                            {item.replace(/---/g, '').trim()}
                                                        </div>
                                                    ) : (
                                                        <div key={i} className="flex items-start gap-2 text-[13px] md:text-sm text-slate-600">
                                                            <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500 mt-0.5 shrink-0" />
                                                            <span>{item}</span>
                                                        </div>
                                                    )
                                                ))}
                                            </div>

                                            <div className="mt-6 md:mt-8 pt-4 border-t border-slate-50 flex items-center justify-between">
                                                <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Official Checklist</span>
                                                <button 
                                                    onClick={() => handleShare(title, items)}
                                                    className="text-[11px] md:text-xs font-bold text-slate-900 group-hover:text-amber-600 flex items-center gap-1.5"
                                                >
                                                    Send to Client <Phone className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {filteredCategories.length === 0 && (
                            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-500">No requirements found</h3>
                                <p className="text-slate-400 mt-1">Try adjusting your search terms.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

