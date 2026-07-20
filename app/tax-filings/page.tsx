"use client";

import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { 
  Search, 
  Plus, 
  Filter, 
  CheckCircle2, 
  Clock, 
  FileText, 
  CreditCard, 
  PhoneCall, 
  FileSearch,
  MoreVertical,
  ChevronDown,
  RefreshCw,
  Loader2,
  Calendar,
  Save,
  Trash2,
  MessageSquare,
  History,
  X,
  Send,
  User,
  CheckSquare,
  Square,
  Edit3
} from "lucide-react";
import { useSession } from "next-auth/react";

interface Filing {
  id: string;
  clientId: string;
  year: number;
  status: string;
  isContacted: boolean;
  docsObtained: boolean;
  isWorking: boolean;
  isFiled: boolean;
  isBilled: boolean;
  isPaid: boolean;
  billAmount: number;
  paymentAmount: number;
  notes: string;
  filledBy?: string;
  client: {
    cfNo: string;
    name: string;
    mobileNo?: string;
  };
}

export default function TaxFilingsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [filings, setFilings] = useState<Filing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedFiling, setSelectedFiling] = useState<Filing | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [stageFilter, setStageFilter] = useState("ALL");

  const fetchYears = async () => {
    try {
      const res = await fetch("/api/tax-filings");
      const data = await res.json();
      const years = data.map((y: any) => y.year);
      setAvailableYears(years);
      if (years.length > 0 && !selectedYear) {
        setSelectedYear(years[0]);
      }
    } catch (e) {
      console.error("Failed to fetch years");
    }
  };

  const fetchFilings = useCallback(async () => {
    if (!selectedYear) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tax-filings?year=${selectedYear}`);
      const data = await res.json();
      setFilings(Array.isArray(data) ? data : []);
      setSelectedIds(new Set()); 
    } catch (e) {
      console.error("Failed to fetch filings");
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => { fetchYears(); }, []);
  useEffect(() => { fetchFilings(); }, [fetchFilings]);

  const handleInitializeYear = async () => {
    const yearStr = prompt("Enter Tax Year to initialize (e.g. 2024):", new Date().getFullYear().toString());
    if (!yearStr) return;
    const year = parseInt(yearStr);
    if (isNaN(year)) return alert("Invalid year");

    try {
      const res = await fetch("/api/tax-filings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year })
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else {
        alert(data.message);
        fetchYears();
        setSelectedYear(year);
      }
    } catch (e) {
      alert("Failed to initialize year");
    }
  };

  const handleDeleteYear = async () => {
    if (!selectedYear) return;
    if (!confirm(`Are you sure you want to delete all tax filing records for Tax Year ${selectedYear}? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/tax-filings?year=${selectedYear}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else {
        alert(data.message);
        setSelectedYear(null);
        fetchYears();
      }
    } catch (e) {
      alert("Failed to delete year");
    }
  };

  const handleSyncFilings = async () => {
    if (!selectedYear) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tax-filings/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: selectedYear })
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      // Even if there's an error, let's fetch to be safe
      fetchFilings();
    } catch (e) {
      alert("Failed to sync client data");
      fetchFilings();
    }
  };

  const updateFiling = async (id: string, updates: Partial<Filing>) => {
    setSavingId(id);
    setFilings(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    
    try {
      const filing = filings.find(f => f.id === id);
      if (!filing) return;

      const body = { ...filing, ...updates };
      await fetch(`/api/tax-filings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    } catch (e) {
      alert("Failed to save changes");
      fetchFilings();
    } finally {
      setSavingId(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredFilings.map(f => f.id);
    if (selectedIds.size === filteredIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredIds));
    }
  };

  const generateMessage = (filing: Filing, template: string) => {
    return template
      .replace(/\[Name\]/g, filing.client?.name || "Client")
      .replace(/\[Year\]/g, filing.year.toString());
  };

  const sendWhatsAppReminder = (filing: Filing) => {
    const defaultTemplate = "Assalam-o-Alaikum [Name], this is a reminder from Get Legal Solution regarding your Tax Return for year [Year]. Please provide the required documents so we can proceed with your filing. JazakAllah.";
    const message = generateMessage(filing, defaultTemplate);
    const number = filing.client?.mobileNo;
    if (!number) return alert("No mobile number found");

    const cleanNumber = number.replace(/\D/g, "");
    const url = `https://wa.me/${cleanNumber.startsWith('92') ? cleanNumber : '92' + cleanNumber.replace(/^0/, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    
    fetch(`/api/tax-filings/${filing.id}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: "WhatsApp Reminder Sent", stage: "Awaiting Docs", type: "REMINDER" })
    });
  };

  const filteredFilings = filings.filter(f => {
    const matchesSearch = f.client?.name?.toLowerCase().includes(search.toLowerCase()) || 
                         f.client?.cfNo?.includes(search);
    
    if (stageFilter === "ALL") return matchesSearch;
    if (stageFilter === "CONTACTED") return matchesSearch && f.isContacted;
    if (stageFilter === "DOCS") return matchesSearch && f.docsObtained;
    if (stageFilter === "WORKING") return matchesSearch && f.isWorking;
    if (stageFilter === "FILED") return matchesSearch && f.isFiled;
    if (stageFilter === "BILLED") return matchesSearch && f.isBilled;
    if (stageFilter === "PAID") return matchesSearch && f.isPaid;
    
    return matchesSearch;
  });

  const stats = {
    total: filings.length,
    contacted: filings.filter(f => f.isContacted).length,
    filed: filings.filter(f => f.isFiled).length,
    paid: filings.filter(f => f.isPaid).length,
  };

  return (
    <div className="flex h-full w-full bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-x-auto md:overflow-x-hidden">
        {/* Header */}
        <header className="h-auto min-h-[5rem] bg-white border-b border-slate-200 pl-16 lg:px-8 px-4 py-4 flex flex-col md:flex-row items-start md:items-center justify-between shrink-0 space-y-4 md:space-y-0 sticky top-0 z-20">
          <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-6 w-full md:w-auto">
            <div className="overflow-x-auto md:overflow-x-visible scrollbar-hide">
              <h1 className="text-lg md:text-xl font-bold text-slate-900 whitespace-nowrap md:whitespace-normal">Tax Filing Record</h1>
              <p className="text-[10px] md:text-xs text-slate-500 whitespace-nowrap md:whitespace-normal">Manage annual returns & status</p>
            </div>
            
            <div className="flex items-center bg-slate-100 rounded-xl p-1 w-full md:w-auto">
              <select 
                value={selectedYear || ""} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full md:w-auto bg-transparent border-none text-xs md:text-sm font-bold text-slate-700 focus:ring-0 px-3 py-1.5 cursor-pointer"
              >
                <option value="" disabled>Select Year</option>
                {availableYears.map(y => <option key={y} value={y}>Tax Year {y}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-3 w-full md:w-auto">
            {selectedIds.size > 0 && (
              <button 
                onClick={() => setShowBulkModal(true)}
                className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-600 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[10px] md:text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center animate-pulse"
              >
                <MessageSquare size={16} className="mr-1.5 md:mr-2" /> {selectedIds.size}
              </button>
            )}
            <button 
              onClick={handleSyncFilings}
              className="p-2 md:p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
              title="Sync & Refresh Data"
            >
              <RefreshCw size={16} />
            </button>
            {isAdmin && selectedYear && (
              <button 
                onClick={handleDeleteYear}
                className="hidden md:flex flex-1 md:flex-none bg-red-500 hover:bg-red-600 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[10px] md:text-sm font-bold shadow-lg shadow-red-500/20 transition-all items-center justify-center whitespace-nowrap"
              >
                <Trash2 size={16} className="mr-1.5 md:mr-2" /> Delete Year
              </button>
            )}
            <button 
              onClick={handleInitializeYear}
              className="hidden md:flex flex-1 md:flex-none bg-amber-500 hover:bg-amber-600 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[10px] md:text-sm font-bold shadow-lg shadow-amber-500/20 transition-all items-center justify-center whitespace-nowrap"
            >
              <Plus size={16} className="mr-1.5 md:mr-2" /> Add New Tax Year
            </button>
          </div>
        </header>

        {/* Stats Row */}
        <div className="px-4 md:px-8 py-4 md:py-6 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 bg-white border-b border-slate-100 shrink-0">
          <StatCard icon={Calendar} label="Total" value={stats.total} color="blue" />
          <StatCard icon={PhoneCall} label="Called" value={stats.contacted} color="amber" />
          <StatCard icon={CheckCircle2} label="Filed" value={stats.filed} color="emerald" />
          {isAdmin && <StatCard icon={CreditCard} label="Paid" value={stats.paid} color="purple" />}
        </div>

        {/* Search & Actions Bar */}
        <div className="px-4 md:px-8 py-3 bg-white border-b border-slate-100 shrink-0 flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0">
          <div className="relative w-full max-w-2xl flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40"
              />
            </div>
            
            <div className="relative w-full md:w-auto">
              <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select 
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="w-full md:w-auto pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] md:text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/40 appearance-none cursor-pointer"
              >
                <option value="ALL">ALL STAGES</option>
                <option value="CONTACTED">CONTACTED</option>
                <option value="DOCS">DOCS OBTAINED</option>
                <option value="WORKING">WORKING</option>
                <option value="FILED">FILED</option>
                {isAdmin && (
                  <>
                    <option value="BILLED">BILLED</option>
                    <option value="PAID">PAID</option>
                  </>
                )}
              </select>
              <ChevronDown size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          
          {filteredFilings.length > 0 && (
            <button 
              onClick={selectAllFiltered}
              className="text-[10px] font-bold text-slate-500 hover:text-amber-600 flex items-center justify-end"
            >
              {selectedIds.size === filteredFilings.length ? <CheckSquare size={12} className="mr-1" /> : <Square size={12} className="mr-1" />}
              {selectedIds.size === filteredFilings.length ? "Deselect All" : "Select All"}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto bg-slate-50/50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto md:overflow-x-visible scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[1200px] overflow-x-auto">
            <thead className="bg-slate-100/50 sticky top-0 z-10 backdrop-blur-md border-b border-slate-200">
              <tr>
                <th className="px-4 py-4 w-10 text-center">
                   <button onClick={selectAllFiltered} className="text-slate-300 hover:text-amber-500">
                     {selectedIds.size === filteredFilings.length && filteredFilings.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                   </button>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-20 text-center">CF No</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[200px]">Client Name</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Contacted</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Docs</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Working</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Filed</th>
                {isAdmin && (
                  <>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Billed</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Paid</th>
                  </>
                )}
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[250px]">Notes</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr><td colSpan={11} className="py-20 text-center text-slate-400"><Loader2 className="animate-spin mx-auto mb-2" /> Loading records...</td></tr>
              ) : filteredFilings.length === 0 ? (
                <tr><td colSpan={11} className="py-20 text-center text-slate-400">No records found.</td></tr>
              ) : filteredFilings.map((filing) => (
                <tr 
                  key={filing.id} 
                  className={`hover:bg-slate-50/50 transition-colors group ${selectedIds.has(filing.id) ? "bg-amber-50/10" : ""}`}
                >
                  <td className="px-4 py-4 text-center">
                    <button 
                      onClick={() => toggleSelect(filing.id)}
                      className={`transition-colors ${selectedIds.has(filing.id) ? "text-amber-500" : "text-slate-200 group-hover:text-slate-300"}`}
                    >
                      {selectedIds.has(filing.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-mono">{filing.client?.cfNo || "???"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-800">{filing.client?.name || "Unknown Client"}</div>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <div className="text-[10px] text-slate-400 font-medium">{filing.client?.mobileNo || "No contact info"}</div>
                      {filing.filledBy && (
                        <>
                          <span className="text-[10px] text-slate-300">•</span>
                          <div className="flex items-center text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">
                            <User size={8} className="mr-1" /> {filing.filledBy}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  
                  <WorkflowCell 
                    checked={filing.isContacted} 
                    onChange={(val) => updateFiling(filing.id, { isContacted: val })} 
                    activeColor="bg-amber-500"
                    icon={PhoneCall}
                  />
                  <WorkflowCell 
                    checked={filing.docsObtained} 
                    onChange={(val) => updateFiling(filing.id, { docsObtained: val })} 
                    activeColor="bg-blue-500"
                    icon={FileSearch}
                  />
                  <WorkflowCell 
                    checked={filing.isWorking} 
                    onChange={(val) => updateFiling(filing.id, { isWorking: val })} 
                    activeColor="bg-indigo-500"
                    icon={Clock}
                  />
                  <WorkflowCell 
                    checked={filing.isFiled} 
                    onChange={(val) => updateFiling(filing.id, { isFiled: val })} 
                    activeColor="bg-emerald-500"
                    icon={CheckCircle2}
                  />
                  {isAdmin && (
                    <>
                      <WorkflowCell 
                        checked={filing.isBilled} 
                        onChange={(val) => updateFiling(filing.id, { isBilled: val })} 
                        activeColor="bg-purple-500"
                        icon={FileText}
                      />
                      <WorkflowCell 
                        checked={filing.isPaid} 
                        onChange={(val) => updateFiling(filing.id, { isPaid: val })} 
                        activeColor="bg-rose-500"
                        icon={CreditCard}
                      />
                    </>
                  )}

                  <td className="px-6 py-4">
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 transition-all"
                      placeholder="Add note..."
                      defaultValue={filing.notes || ""}
                      onBlur={(e) => {
                        if (e.target.value !== filing.notes) {
                          updateFiling(filing.id, { notes: e.target.value });
                        }
                      }}
                    />
                  </td>
                  
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => sendWhatsAppReminder(filing)}
                        className="p-1.5 hover:bg-emerald-50 text-emerald-500 rounded-md transition-colors"
                        title="Send WhatsApp Reminder"
                      >
                        <MessageSquare size={16} />
                      </button>
                      <button 
                        onClick={() => setSelectedFiling(filing)}
                        className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-md transition-colors"
                        title="View History Log"
                      >
                        <History size={16} />
                      </button>
                      {isAdmin && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if(confirm("Delete this filing record?")) {
                              fetch(`/api/tax-filings/${filing.id}`, { method: 'DELETE' }).then(() => fetchFilings());
                            }
                          }}
                          className="p-1.5 hover:bg-red-50 text-red-400 rounded-md transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>

      {showBulkModal && (
        <BulkWhatsAppModal 
          selectedFilings={filings.filter(f => selectedIds.has(f.id))}
          onClose={() => { setShowBulkModal(false); setSelectedIds(new Set()); }}
          generateMessage={generateMessage}
        />
      )}

      {selectedFiling && (
        <FilingLogModal 
          filing={selectedFiling} 
          onClose={() => setSelectedFiling(null)} 
        />
      )}

      {/* Mobile Floating Action Button for Add Tax Year */}
      <button
        onClick={handleInitializeYear}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-amber-500 text-white rounded-full shadow-2xl flex items-center justify-center z-[100] active:scale-95 transition-transform"
      >
        <Plus size={28} />
      </button>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
  const colors: any = {
    blue: "bg-blue-500/10 text-blue-600",
    amber: "bg-amber-500/10 text-amber-600",
    emerald: "bg-emerald-500/10 text-emerald-600",
    purple: "bg-purple-500/10 text-purple-600"
  };
  
  return (
    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center space-x-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function WorkflowCell({ checked, onChange, activeColor, icon: Icon }: { checked: boolean, onChange: (val: boolean) => void, activeColor: string, icon: any }) {
  return (
    <td className="px-4 py-4 text-center">
      <button 
        onClick={() => onChange(!checked)}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm ${
          checked 
            ? `${activeColor} text-white shadow-lg ring-4 ring-white` 
            : "bg-slate-50 text-slate-300 hover:bg-slate-100 border border-slate-100"
        }`}
      >
        <Icon size={18} strokeWidth={checked ? 2.5 : 2} />
      </button>
    </td>
  );
}

function BulkWhatsAppModal({ selectedFilings, onClose, generateMessage }: { selectedFilings: Filing[], onClose: () => void, generateMessage: (f: Filing, t: string) => string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [template, setTemplate] = useState("Assalam-o-Alaikum [Name], this is a reminder from Get Legal Solution regarding your Tax Return for year [Year]. Please provide the required documents so we can proceed with your filing. JazakAllah.");
  const [editingMsg, setEditingMsg] = useState("");
  const currentFiling = selectedFilings[currentIndex];

  useEffect(() => {
    if (currentFiling) {
      setEditingMsg(generateMessage(currentFiling, template));
    }
  }, [currentIndex, currentFiling, template, generateMessage]);

  const handleNext = () => {
    if (currentIndex < selectedFilings.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handleOpenWhatsApp = () => {
    const number = currentFiling.client?.mobileNo;
    if (!number) {
      alert("No mobile number found");
      return handleNext();
    }
    const cleanNumber = number.replace(/\D/g, "");
    const url = `https://wa.me/${cleanNumber.startsWith('92') ? cleanNumber : '92' + cleanNumber.replace(/^0/, '')}?text=${encodeURIComponent(editingMsg)}`;
    window.open(url, "_blank");
    
    fetch(`/api/tax-filings/${currentFiling.id}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: `WhatsApp: ${editingMsg.substring(0, 50)}...`, stage: "Bulk Reminder", type: "REMINDER" })
    });
    handleNext();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] animate-in zoom-in duration-200">
        {/* Sidebar: Template Editor */}
        <div className="w-full md:w-72 bg-slate-50 border-r border-slate-100 p-6 flex flex-col">
          <div className="flex items-center space-x-2 text-emerald-600 mb-4">
            <Edit3 size={18} />
            <h3 className="font-bold text-sm">Global Template</h3>
          </div>
          <p className="text-[10px] text-slate-400 mb-4 uppercase font-bold tracking-wider">Variables: [Name], [Year]</p>
          <textarea 
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="flex-1 w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 focus:outline-none transition-all resize-none"
            placeholder="Write your global template here..."
          />
          <div className="mt-4 p-3 bg-emerald-50 rounded-xl text-[10px] text-emerald-700 font-medium italic">
            This template is used as a base for all selected clients.
          </div>
        </div>

        {/* Main: Review & Send */}
        <div className="flex-1 p-8 flex flex-col bg-white">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <MessageSquare size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Review & Send</h2>
                <p className="text-xs text-slate-500 font-medium">Client {currentIndex + 1} of {selectedFilings.length}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={20} /></button>
          </div>

          <div className="flex-1 flex flex-col">
            {/* Recipient Card */}
            <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-5 mb-6 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Recipient</p>
                <p className="text-lg font-bold text-slate-800">{currentFiling?.client?.name}</p>
                <p className="text-xs font-medium text-emerald-600">{currentFiling?.client?.mobileNo || "Missing Mobile"}</p>
              </div>
              <div className="w-12 h-12 bg-white border border-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-400 shadow-sm">
                {currentIndex + 1}/{selectedFilings.length}
              </div>
            </div>

            {/* Custom Message Editor for this client */}
            <div className="flex-1 flex flex-col mb-8">
              <div className="flex items-center justify-between mb-2 px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message for this client</label>
                <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">Auto-generated from template</span>
              </div>
              <textarea 
                value={editingMsg}
                onChange={(e) => setEditingMsg(e.target.value)}
                className="flex-1 w-full bg-white border border-slate-200 rounded-[1.5rem] p-5 text-sm focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 focus:outline-none transition-all resize-none shadow-sm font-medium text-slate-700"
                placeholder="Modify message if needed..."
              />
            </div>

            <div className="flex flex-col space-y-3">
              <button 
                onClick={handleOpenWhatsApp}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-[1.25rem] font-bold shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center group"
              >
                <Send size={18} className="mr-2 group-hover:translate-x-1 transition-transform" /> 
                Open WhatsApp & Next
              </button>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={handleNext}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-500 py-3 rounded-[1rem] font-bold transition-colors text-xs"
                >
                  Skip Client
                </button>
                <button 
                  onClick={onClose}
                  className="flex-1 bg-white border border-slate-100 text-slate-300 py-3 rounded-[1rem] font-bold hover:bg-slate-50 transition-colors text-xs"
                >
                  Cancel Session
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilingLogModal({ filing, onClose }: { filing: Filing, onClose: () => void }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [newStage, setNewStage] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tax-filings/${filing.id}/logs`);
      const data = await res.json();
      setLogs(data);
    } catch (e) {
      console.error("Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  }, [filing.id]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote) return;
    setAdding(true);
    try {
      await fetch(`/api/tax-filings/${filing.id}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote, stage: newStage || "General", type: "CONTACT" })
      });
      setNewNote("");
      setNewStage("");
      fetchLogs();
    } catch (e) {
      alert("Failed to add log");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-lg h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Communication Log</h2>
            <p className="text-xs text-slate-500">{filing.client?.name} · Tax Year {filing.year}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <form onSubmit={handleAddLog} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
             <div>
               <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Update Status / Notes</label>
               <textarea 
                 value={newNote}
                 onChange={(e) => setNewNote(e.target.value)}
                 className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400"
                 placeholder="What did the client say? What happened?"
                 rows={3}
               />
             </div>
             <div>
               <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Process Bottleneck (Stuck at?)</label>
               <input 
                 type="text"
                 value={newStage}
                 onChange={(e) => setNewStage(e.target.value)}
                 className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400"
                 placeholder="e.g. Awaiting Bank Statement"
               />
             </div>
             <button 
               type="submit" 
               disabled={adding}
               className="w-full bg-slate-900 text-white py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors flex items-center justify-center disabled:opacity-50"
             >
               {adding ? <Loader2 size={16} className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
               Save Log Entry
             </button>
          </form>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">History Timeline</h3>
            {loading ? (
               <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-slate-300" /></div>
            ) : logs.length === 0 ? (
               <div className="text-center py-10 text-slate-400 text-sm italic">No history recorded yet.</div>
            ) : (
               <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                 {logs.map((log: any) => (
                   <div key={log.id} className="relative pl-10">
                     <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${
                       log.type === 'REMINDER' ? 'bg-emerald-500' : 'bg-amber-500'
                     }`}>
                       {log.type === 'REMINDER' ? <MessageSquare size={10} className="text-white" /> : <PhoneCall size={10} className="text-white" />}
                     </div>
                     <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                       <div className="flex justify-between items-start mb-2">
                         <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                           <span className="text-[9px] font-black text-slate-900 uppercase flex items-center mt-1">
                             <User size={8} className="mr-1 text-amber-500" /> {log.userName || "System"}
                           </span>
                         </div>
                         <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">{log.stage}</span>
                       </div>
                       <p className="text-sm text-slate-700 leading-relaxed">{log.note}</p>
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
