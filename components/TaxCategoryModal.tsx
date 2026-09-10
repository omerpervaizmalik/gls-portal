"use client";

import React, { useState } from "react";
import { X, Check, ShieldCheck, ShieldAlert, Plus, RotateCcw, Loader2, Search } from "lucide-react";

interface TaxCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Record<string, boolean>;
  onSaved: (updated: Record<string, boolean>) => void;
}

const DEFAULT_PRESETS: Record<string, boolean> = {
  "Staff Salaries": true,
  "Office Rent": true,
  "Bar Council Fees": true,
  "Court Filing Charges": true,
  "Stationery & Printing": true,
  "Telephone & Internet": true,
  "Software Tools": true,
  "Accountant/Audit Fees": true,
  "Miscellaneous": true,
  "Personal Drawings": false,
  "Fines & Penalties": false,
  "Client Entertainment": false,
};

export default function TaxCategoryModal({
  isOpen,
  onClose,
  categories,
  onSaved,
}: TaxCategoryModalProps) {
  const [localCategories, setLocalCategories] = useState<Record<string, boolean>>({ ...categories });
  const [searchTerm, setSearchTerm] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatDeductible, setNewCatDeductible] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleToggle = (cat: string, value: boolean) => {
    setLocalCategories((prev) => ({
      ...prev,
      [cat]: value,
    }));
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    setLocalCategories((prev) => ({
      ...prev,
      [trimmed]: newCatDeductible,
    }));
    setNewCatName("");
  };

  const handleResetDefaults = () => {
    if (confirm("Reset categories to standard FBR legal & corporate practice defaults?")) {
      setLocalCategories({ ...DEFAULT_PRESETS });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/tax-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: localCategories }),
      });

      if (res.ok) {
        onSaved(localCategories);
        onClose();
      } else {
        alert("Failed to save tax categories.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = Object.entries(localCategories).filter(([name]) =>
    name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const deductibleCount = Object.values(localCategories).filter(Boolean).length;
  const nonDeductibleCount = Object.values(localCategories).filter((v) => !v).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <ShieldCheck className="w-5 h-5 text-amber-500 mr-2" />
              Configure Tax Deductibility Categories
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Designate which expense categories qualify as deductible business expenses under FBR rules.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats & Search Bar */}
        <div className="p-4 bg-white border-b border-slate-100 space-y-3">
          <div className="flex gap-2 text-xs">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
              <Check className="w-3.5 h-3.5 mr-1" />
              {deductibleCount} Deductible
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-medium border border-rose-200">
              <ShieldAlert className="w-3.5 h-3.5 mr-1" />
              {nonDeductibleCount} Non-Deductible
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-6">No categories match your search.</p>
          ) : (
            filtered.map(([cat, isDeductible]) => (
              <div key={cat} className="py-2.5 flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-slate-800">{cat}</span>

                <div className="flex items-center rounded-lg border border-slate-200 p-0.5 bg-slate-100 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(cat, true)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      isDeductible
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Deductible
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggle(cat, false)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      !isDeductible
                        ? "bg-rose-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Non-Deductible
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add New Category Row */}
        <form onSubmit={handleAddCategory} className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2">
          <input
            type="text"
            placeholder="Add new category..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          />
          <select
            value={newCatDeductible ? "true" : "false"}
            onChange={(e) => setNewCatDeductible(e.target.value === "true")}
            className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="true">Deductible</option>
            <option value="false">Non-Deductible</option>
          </select>
          <button
            type="submit"
            disabled={!newCatName.trim()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add
          </button>
        </form>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-xs font-medium text-slate-500 hover:text-slate-700 flex items-center transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset Defaults
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-md shadow-amber-500/20 flex items-center transition-colors"
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
