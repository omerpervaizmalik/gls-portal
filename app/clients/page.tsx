"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Search, UserPlus, X, Trash2, ChevronLeft, ChevronRight,
  Loader2, Check, RefreshCw, Pencil, FolderOpen, Camera, Upload, 
  BookOpen, Folder, Menu
} from "lucide-react";
import { Cell } from "./Cell";
import { InfoRow } from "./InfoRow";
import { useSession } from "next-auth/react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Client {
  id: string;
  cfNo: string;
  name: string;
  cnic?: string;
  email?: string;
  irisPassword?: string;
  mobileNo?: string;
  address?: string;
  city?: string;
  ntn?: string;
  strn?: string;
  businessName?: string;
  profileImage?: string;
  description?: string;
  category?: string;
  reference?: string;
  status: string;
  entryDate?: string;
}

type EditRow = Omit<Client, "id">;

import { STATUS_OPTIONS, SERVICE_CATEGORIES } from "./constants";

// ─── Add Client Modal ─────────────────────────────────────────────────────────
function AddClientModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState<EditRow>({
    cfNo: "", name: "", cnic: "", email: "",
    irisPassword: "", mobileNo: "", reference: "", status: "ACTIVE",
    address: "", city: "", ntn: "", strn: "", businessName: "", profileImage: "",
    description: "", category: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [prevCf, setPrevCf] = useState("");

  useEffect(() => {
    fetch("/api/clients/next-cf")
      .then(res => res.json())
      .then(data => {
        if (data.nextCf) {
          setForm(f => ({ ...f, cfNo: data.nextCf.toString() }));
        }
        if (data.prevCf) {
          setPrevCf(data.prevCf.toString());
        }
      });
  }, []);

  const handleSave = async () => {
    if (!form.cfNo || !form.name) { setError("CF No and Name are required"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      onSave();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const REQUIRED_UNIQUE_FIELDS: (keyof EditRow)[] = ["cfNo", "cnic", "ntn"];

  const fields: { label: string; key: keyof EditRow; placeholder?: string }[] = [
    { label: "CF No",         key: "cfNo",         placeholder: "e.g. 101" },
    { label: "Full Name",     key: "name",         placeholder: "Client full name" },
    { label: "CNIC",          key: "cnic",         placeholder: "0000000000000" },
    { label: "Mobile No",     key: "mobileNo",     placeholder: "03XX-XXXXXXX" },
    { label: "Email",         key: "email",        placeholder: "email@example.com" },
    { label: "NTN",           key: "ntn",          placeholder: "NTN Number" },
    { label: "Business Name", key: "businessName", placeholder: "Company name" },
    { label: "Address",       key: "address",      placeholder: "Full address" },
    { label: "City",          key: "city",         placeholder: "City" },
    { label: "Iris Password", key: "irisPassword", placeholder: "IRIS portal password" },
    { label: "Reference",     key: "reference",    placeholder: "Referred by" },
    { label: "Description",   key: "description",  placeholder: "Relevant information..." },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-900">Add New Client</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={18} /></button>
        </div>
        <div className="p-8 space-y-4 overflow-y-auto">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
          <p className="text-[10px] text-slate-400"><span className="text-red-500 font-bold">★</span> = Required &amp; must be unique</p>
          <div className="grid grid-cols-2 gap-4">
            {fields.map(({ label, key, placeholder }) => (
              <div key={key} className={key === "reference" ? "col-span-2" : ""}>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  {label}
                  {REQUIRED_UNIQUE_FIELDS.includes(key) && (
                    <span className="text-red-500 font-bold">★</span>
                  )}
                  {key === "cfNo" && prevCf && (
                    <span className="text-amber-500 lowercase font-normal tracking-normal normal-case">(last was {prevCf})</span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder={placeholder}
                  value={(form as any)[key] || ""}
                  onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 ${
                    REQUIRED_UNIQUE_FIELDS.includes(key)
                      ? "border-amber-300 bg-amber-50/30"
                      : "border-slate-200"
                  }`}
                />
              </div>
            ))}
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Service Category</label>
              <div className="flex space-x-2">
                <select
                  value={SERVICE_CATEGORIES.includes(form.category || "") ? form.category : "Other"}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value === "Other" ? "" : e.target.value }))}
                  className="w-1/2 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">-- Select Category --</option>
                  {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="Other">Other (Manual Entry)</option>
                </select>
                {(!SERVICE_CATEGORIES.includes(form.category || "") || form.category === "") && (
                  <input
                    type="text"
                    placeholder="Type manual category..."
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                )}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
              >
                {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="px-8 py-5 border-t border-slate-100 flex justify-end space-x-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-lg shadow-amber-500/20 flex items-center disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Check size={16} className="mr-2" />}
            {saving ? "Saving..." : "Create Client"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Client Detail Modal ──────────────────────────────────────────────────────
function ClientDetailModal({ client, onClose, onRefresh }: { client: Client; onClose: () => void; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Client>(client);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/clients/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setForm(prev => ({ ...prev, profileImage: data.url }));
      }
    } catch (err) {
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleViewFolder = async () => {
    try {
      const res = await fetch(`/api/clients/folder?cfNo=${form.cfNo}`);
      const data = await res.json();
      if (data.path) {
        window.location.href = `/files?path=${encodeURIComponent(data.path)}`;
      } else {
        alert("Client folder not found.");
      }
    } catch {
      alert("Error opening folder.");
    }
  };

  const handleViewLedger = () => {
    window.location.href = `/fams/ledger/${form.id}`;
  };

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Update failed");
      setEditing(false);
      onRefresh();
    } catch (e) {
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const statusColorLocal = (s: string) => {
    const v = (s || "").toLowerCase();
    if (v === "cleared" || v === "active") return "bg-emerald-100 text-emerald-700";
    if (v === "pending")  return "bg-amber-100 text-amber-700";
    if (v === "left")     return "bg-red-100 text-red-600";
    return "bg-slate-100 text-slate-500";
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-4 md:px-8 py-6 md:py-10 relative shrink-0">
          <button onClick={onClose} className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10">
            <X size={18} />
          </button>
          
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6 text-center md:text-left">
            <div 
              className={`w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center overflow-hidden shadow-xl relative group ${editing ? 'cursor-pointer hover:bg-white/30 transition-all' : ''}`}
              onClick={() => editing && fileInputRef.current?.click()}
            >
              {form.profileImage ? (
                <img src={form.profileImage} alt={form.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-white uppercase">{form.name.charAt(0)}</span>
              )}
              
              {editing && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploading ? (
                    <Loader2 size={24} className="text-white animate-spin" />
                  ) : (
                    <>
                      <Camera size={24} className="text-white mb-1" />
                      <span className="text-[10px] text-white font-bold uppercase tracking-tighter">Change</span>
                    </>
                  )}
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-black text-white leading-tight">{form.name}</h2>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-sm ${statusColorLocal(form.status)}`}>
                  {form.status}
                </span>
              </div>
              <p className="text-amber-50/80 font-mono text-sm mt-1">CF Account: #{form.cfNo}</p>
              <div className="flex items-center space-x-4 mt-3">
                {form.mobileNo && (
                   <span className="flex items-center text-xs text-white/90 font-medium">
                     <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center mr-2">📞</span>
                     {form.mobileNo}
                   </span>
                )}
                {form.email && (
                   <span className="flex items-center text-xs text-white/90 font-medium">
                     <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center mr-2">✉️</span>
                     {form.email}
                   </span>
                )}
              </div>
            </div>
            <div className="w-full md:w-auto shrink-0 flex items-center justify-center space-x-2">
              {!editing && (
                <>
                  <button
                    onClick={handleViewLedger}
                    className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/20 flex items-center group shadow-lg"
                    title="View Ledger"
                  >
                    <BookOpen size={18} />
                  </button>
                  <button
                    onClick={handleViewFolder}
                    className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/20 flex items-center group shadow-lg"
                    title="Open Folder"
                  >
                    <Folder size={18} />
                  </button>
                  <div className="w-px h-8 bg-white/20 mx-1" />
                </>
              )}
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="bg-white hover:bg-amber-50 text-amber-600 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xl flex items-center border border-transparent"
                >
                  <Pencil size={14} className="mr-2" /> Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : <Check size={14} className="mr-2" />}
                    Save Changes
                  </button>
                  <button
                    onClick={() => { setEditing(false); setForm(client); }}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50/50">
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Personal Information */}
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 border-l-4 border-amber-500 pl-3">Personal & Contact Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  <InfoRow label="Full Name" value={form.name} field="name" editing={editing} onChange={handleChange} />
                  <InfoRow label="Category / Service" value={form.category} field="category" editing={editing} onChange={handleChange} />
                  <InfoRow label="CNIC Number" value={form.cnic} field="cnic" editing={editing} onChange={handleChange} />
                  <InfoRow label="Mobile Number" value={form.mobileNo} field="mobileNo" editing={editing} onChange={handleChange} />
                  <InfoRow label="Email Address" value={form.email} field="email" editing={editing} onChange={handleChange} />
                </div>
              </section>

              {/* Business Details */}
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 border-l-4 border-emerald-500 pl-3">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  <InfoRow label="Business Name" value={form.businessName} field="businessName" editing={editing} onChange={handleChange} />
                  <InfoRow label="NTN Number" value={form.ntn} field="ntn" editing={editing} onChange={handleChange} />
                  <InfoRow label="STRN Number" value={form.strn} field="strn" editing={editing} onChange={handleChange} />
                  <InfoRow label="City" value={form.city} field="city" editing={editing} onChange={handleChange} />
                  <div className="md:col-span-2">
                    <InfoRow label="Full Address" value={form.address} field="address" editing={editing} onChange={handleChange} />
                  </div>
                  <div className="col-span-2 mt-2">
                    <div className="flex flex-col space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-emerald-600">Business Description / Notes</span>
                      {editing ? (
                        <textarea
                          value={form.description || ""}
                          onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="w-full border border-emerald-200 rounded-lg px-3 py-2 text-sm bg-emerald-50/30 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                          placeholder="Add any relevant business information or notes..."
                        />
                      ) : (
                        <div className="p-4 bg-emerald-50/30 rounded-xl border border-emerald-100 min-h-[80px]">
                           <p className={`text-sm leading-relaxed ${!form.description ? "text-slate-300 italic" : "text-slate-600"}`}>
                             {form.description || "No description provided."}
                           </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-8">
               {/* Account Metadata */}
               <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 border-l-4 border-blue-500 pl-3">Account Details</h3>
                <div className="space-y-6">
                  <InfoRow label="IRIS Password" value={form.irisPassword} field="irisPassword" editing={editing} onChange={handleChange} />
                  <InfoRow label="Reference / Referrer" value={form.reference} field="reference" editing={editing} onChange={handleChange} />
                  <InfoRow label="Client Status" value={form.status} field="status" editing={editing} onChange={handleChange} />
                  <div className="pt-4 border-t border-slate-50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Registration Date</span>
                    <span className="text-sm font-mono text-slate-600">
                      {form.entryDate ? new Date(form.entryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : "—"}
                    </span>
                  </div>
                </div>
              </section>

              {/* Quick Actions / Profile Meta */}
              <section className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                 <h3 className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-4">Account Status</h3>
                 <div className="space-y-3">
                   <div className="flex items-center space-x-3 p-3 bg-white rounded-xl border border-amber-200/50">
                     <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                       <Upload size={18} />
                     </div>
                     <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Profile Photo</p>
                       <p className="text-xs font-semibold text-slate-700">
                         {form.profileImage ? "Custom photo uploaded" : "Using default initials"}
                       </p>
                     </div>
                   </div>
                   <div className="pt-2">
                     <p className="text-[10px] text-amber-700/60 leading-relaxed italic">
                       * To update the profile photo, click on the photo box in the header while in Edit Mode.
                     </p>
                   </div>
                 </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Column Definitions ───────────────────────────────────────────────────────
const COLUMNS: { label: string; key: keyof Client; width?: string }[] = [
  { label: "CF No",        key: "cfNo",         width: "w-16" },
  { label: "Full Name",    key: "name",         width: "w-44" },
  { label: "Category",     key: "category",     width: "w-48" },
  { label: "CNIC",         key: "cnic",         width: "w-36" },
  { label: "Mobile No",    key: "mobileNo",     width: "w-36" },
  { label: "Email",        key: "email",        width: "w-48" },
  { label: "Iris Password",key: "irisPassword", width: "w-32" },
  { label: "Reference",    key: "reference",    width: "w-32" },
  { label: "Status",       key: "status",       width: "w-28" },
];

// Status badge color
const statusColor = (s: string) => {
  const v = (s || "").toLowerCase();
  if (v === "cleared" || v === "active") return "bg-emerald-100 text-emerald-700";
  if (v === "pending")  return "bg-amber-100 text-amber-700";
  if (v === "left")     return "bg-red-100 text-red-600";
  return "bg-slate-100 text-slate-500";
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const [clients, setClients]     = useState<Client[]>([]);
  const [total, setTotal]         = useState(0);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [saving, setSaving]       = useState(false);

  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/clients?search=${encodeURIComponent(search)}&status=${encodeURIComponent(statusFilter)}`);
      const data = await res.json();
      setClients(Array.isArray(data.clients) ? data.clients : []);
      setTotal(data.total || 0);
    } catch { setClients([]); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete client");
      }
      fetchClients();
    } catch (err: any) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setDeleting(null);
    }
  };

  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleSyncStatus = async (clientId: string) => {
    setSyncingId(clientId);
    try {
      const res = await fetch("/api/clients/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else {
        alert("Sync successful! Client status updated.");
        fetchClients();
      }
    } catch {
      alert("Sync failed");
    } finally {
      setSyncingId(null);
    }
  };

  const handleViewFolder = async (cfNo: string) => {
    try {
      const res = await fetch(`/api/clients/folder?cfNo=${cfNo}`);
      const data = await res.json();
      if (data.path) {
        window.location.href = `/files?path=${encodeURIComponent(data.path)}`;
      } else {
        alert("Client folder not found in the tax return directory.");
      }
    } catch (err) {
      alert("Error finding folder.");
    }
  };

  return (
    <div className="flex h-full w-full bg-slate-50">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-x-auto md:overflow-x-hidden">
        {/* Header */}
        <header className="h-auto min-h-[5rem] bg-white border-b border-slate-200 pl-16 lg:px-8 px-4 py-4 flex flex-col md:flex-row items-start md:items-center justify-between shrink-0 space-y-4 md:space-y-0 sticky top-0 z-10">
          <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-6 w-full md:w-auto overflow-x-auto md:overflow-x-visible scrollbar-hide">
            <div className="shrink-0">
              <h1 className="text-lg md:text-xl font-bold text-slate-900 whitespace-nowrap md:whitespace-normal">Client Accounts</h1>
              <p className="text-[10px] md:text-xs text-slate-500 whitespace-nowrap md:whitespace-normal">Management & Directory</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <button onClick={fetchClients} className="p-2 md:p-2.5 hover:bg-slate-100 rounded-xl text-slate-400" title="Refresh">
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex-1 md:flex-none bg-amber-500 hover:bg-amber-600 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center shadow-lg shadow-amber-500/20 transition-all"
            >
              <UserPlus size={16} className="mr-2" /> Add Client
            </button>
          </div>
        </header>

        {/* Search & Filter */}
        <div className="px-8 py-3 bg-white border-b border-slate-100 shrink-0 flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
          <div className="relative flex-1 max-w-lg">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, CF No, CNIC or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <X size={13} />
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto md:overflow-x-visible scrollbar-hide">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">#</th>
                  {COLUMNS.map(c => (
                    <th key={c.key} className={`px-3 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider ${c.width}`}>{c.label}</th>
                  ))}
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && clients.length === 0 ? (
                  <tr><td colSpan={COLUMNS.length + 2} className="text-center py-20 text-slate-400">
                    <Loader2 size={24} className="animate-spin inline-block mb-2" /><br />Loading...
                  </td></tr>
                ) : clients.length === 0 && !loading ? (
                  <tr><td colSpan={COLUMNS.length + 2} className="text-center py-20 text-slate-400">
                    No clients found{search ? ` for "${search}"` : ""}.
                  </td></tr>
                ) : clients.map((client, idx) => {
                  return (
                    <tr
                      key={client.id}
                      className="group transition-colors cursor-pointer hover:bg-amber-50/30"
                      onClick={() => setSelectedClient(client)}
                    >
                      <td className="px-4 py-3.5">
                        <span className="text-[11px] text-slate-400 font-mono">{idx + 1}</span>
                      </td>

                      {COLUMNS.map(col => (
                        <td key={col.key} className="px-3 py-3.5">
                          {col.key === "cfNo" ? (
                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 font-mono">{client.cfNo}</span>
                          ) : col.key === "status" ? (
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-tighter shadow-sm ${statusColor(client.status)}`}>{client.status}</span>
                          ) : col.key === "name" ? (
                            <span className="text-sm font-bold text-slate-800 group-hover:text-amber-600 transition-all">
                              {client.name}
                            </span>
                          ) : col.key === "irisPassword" ? (
                            <span className="text-xs font-mono text-slate-500">{client[col.key] || "—"}</span>
                          ) : (
                            <span className={`text-xs ${!client[col.key] ? "text-slate-300 italic" : "text-slate-600"}`}>
                              {client[col.key] || "—"}
                            </span>
                          )}
                        </td>
                      ))}

                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center space-x-1.5 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleSyncStatus(client.id)}
                            disabled={syncingId === client.id}
                            className="p-2 hover:bg-emerald-100 rounded-xl text-emerald-500 transition-all border border-transparent hover:border-emerald-200 disabled:opacity-40"
                            title="Sync IRIS"
                          >
                            {syncingId === client.id ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                          </button>
                          <button
                            onClick={() => handleViewFolder(client.cfNo)}
                            className="p-2 hover:bg-blue-100 rounded-xl text-blue-500 transition-all border border-transparent hover:border-blue-200"
                            title="Open Folder"
                          >
                            <FolderOpen size={16} />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(client.id, client.name)}
                              disabled={deleting === client.id}
                              className="p-2 hover:bg-red-100 rounded-xl text-red-400 transition-all border border-transparent hover:border-red-200 disabled:opacity-40"
                              title="Delete"
                            >
                              {deleting === client.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showAdd && (
        <AddClientModal onClose={() => setShowAdd(false)} onSave={() => { setShowAdd(false); fetchClients(); }} />
      )}

      {selectedClient && (
        <ClientDetailModal 
          client={selectedClient} 
          onClose={() => setSelectedClient(null)} 
          onRefresh={() => { fetchClients(); }} 
        />
      )}
    </div>
  );
}
