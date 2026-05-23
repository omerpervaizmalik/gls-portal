"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

interface NewTaskModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewTaskModal({ onClose, onSuccess }: NewTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [matters, setMatters] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    deadline: '',
    matterId: '',
    assignedToId: '',
  });

  const [conflictStatus, setConflictStatus] = useState<'IDLE' | 'CHECKING' | 'CLEARED' | 'FLAGGED'>('IDLE');

  const checkConflict = async () => {
    if (!formData.assignedToId || !formData.matterId) return;
    setConflictStatus('CHECKING');
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1500));
    // Simulate a clear check for demo purposes
    setConflictStatus('CLEARED');
  };

  useEffect(() => {
    if (formData.assignedToId && formData.matterId) {
      setConflictStatus('IDLE');
    }
  }, [formData.assignedToId, formData.matterId]);

  useEffect(() => {
    // Fetch potential assignees (Admins/Junior Associates)
    fetch('/api/admin/users').then(res => res.json()).then(setUsers).catch(console.error);
    fetch('/api/matters').then(res => res.json()).then(setMatters).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create task');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg max-h-[calc(100dvh-2rem)] md:max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Create New Task</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto min-h-0">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg flex items-center text-sm">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Task Title</label>
            <input
              required
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all outline-none"
              placeholder="e.g., Drafting Shareholders' Agreement"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all outline-none h-24 resize-none"
              placeholder="Detailed instructions for the associate..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500/50 transition-all outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500/50 transition-all outline-none [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Assign Matter</label>
              <select
                value={formData.matterId}
                onChange={(e) => setFormData({ ...formData, matterId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500/50 transition-all outline-none"
              >
                <option value="">No Matter (Internal)</option>
                {matters.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Assignee</label>
              <select
                value={formData.assignedToId}
                onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500/50 transition-all outline-none"
              >
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>

          {formData.assignedToId && formData.matterId && (
            <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Conflict Check</p>
                <p className="text-xs text-slate-400">Validate associate's prior engagements</p>
              </div>
              <button
                type="button"
                onClick={checkConflict}
                disabled={conflictStatus === 'CHECKING'}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${
                  conflictStatus === 'CLEARED' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50' :
                  conflictStatus === 'FLAGGED' ? 'bg-red-500/20 text-red-500 border border-red-500/50' :
                  'bg-amber-500/20 text-amber-500 border border-amber-500/50 hover:bg-amber-500/30'
                }`}
              >
                {conflictStatus === 'CHECKING' ? 'Checking...' : 
                 conflictStatus === 'CLEARED' ? 'Clear - No Conflicts' : 
                 conflictStatus === 'FLAGGED' ? 'Conflict Detected!' : 'Run Check'}
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              disabled={loading}
              type="submit"
              className="flex-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-xl transition-all flex items-center justify-center disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
