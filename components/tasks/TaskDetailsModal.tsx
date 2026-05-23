"use client";

import React, { useState, useEffect } from 'react';
import { X, Clock, User, FileText, CheckCircle2, History, Send, MessageSquare, RotateCcw, ExternalLink, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';

interface TaskDetailsModalProps {
  taskId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function TaskDetailsModal({ taskId, onClose, onUpdate }: TaskDetailsModalProps) {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newLog, setNewLog] = useState('');
  
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [updateNote, setUpdateNote] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);

  const [activeTab, setActiveTab] = useState<'UPDATE' | 'REMINDERS'>('UPDATE');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderNote, setReminderNote] = useState('');

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setTask(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete task");
      }
      onUpdate();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert("Error: " + err.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => {
        setAttachedFile({
          name: file.name,
          content: re.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const submitStatusUpdate = async (shouldChangeStatus: boolean) => {
    if (!updateNote && !shouldChangeStatus) return;
    setUpdating(true);
    try {
      let attachments: any[] = [];
      if (attachedFile) {
        attachments.push({
          fileName: attachedFile.name,
          content: attachedFile.content
        });
      }

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: shouldChangeStatus ? pendingStatus : undefined,
          note: updateNote,
          attachments: attachments.length > 0 ? attachments : undefined
        })
      });

      const updatedData = await res.json();
      if (!res.ok) throw new Error(updatedData.error || 'Update failed');

      setTask(updatedData); // Instant UI update with logs
      setPendingStatus(null);
      setUpdateNote('');
      setAttachedFile(null);
      onUpdate();
    } catch (err: any) {
      console.error(err);
      alert('Error updating task: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const addReminder = async () => {
    if (!reminderTime) return;
    try {
      await fetch(`/api/tasks/${taskId}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remindAt: reminderTime, note: reminderNote })
      });
      setReminderTime('');
      setReminderNote('');
      fetchTask();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !task) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col md:flex-row">
        {/* Left Side: Content */}
        <div className="flex-1 p-8 overflow-y-auto border-r border-slate-800">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 mb-4 inline-block`}>
                {task.priority} Priority
              </span>
              <h2 className="text-2xl font-bold text-white">{task.title}</h2>
              {task.matter && (
                <p className="text-amber-500 font-medium text-sm mt-1">Matter: {task.matter.title}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {isAdmin && (
                <button onClick={handleDelete} className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-500 rounded-full transition-colors" title="Delete Task">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center text-slate-400">
                <User className="w-4 h-4 mr-3 text-amber-500" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Created By (Assigner)</p>
                  <p className="text-sm font-medium text-white">{task.createdBy?.name || 'System'}</p>
                </div>
              </div>
              <div className="flex items-center text-slate-400">
                <User className="w-4 h-4 mr-3 text-blue-500" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Assigned To (Executor)</p>
                  <p className="text-sm font-medium text-white">{task.assignedTo?.name || 'Unassigned'}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center text-slate-400">
                <Clock className="w-4 h-4 mr-3 text-amber-500" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Deadline</p>
                  <p className="text-sm font-medium text-white">
                    {task.deadline ? format(new Date(task.deadline), 'MMMM d, yyyy') : 'No deadline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center text-slate-400">
                <CheckCircle2 className="w-4 h-4 mr-3 text-emerald-500" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Status</p>
                  <p className="text-sm font-medium text-white">{task.status}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Description</h3>
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {task.description || 'No description provided.'}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Attachments</h3>
            <div className="grid grid-cols-2 gap-3">
              {task.attachments?.map((file: any) => (
                <div key={file.id} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 flex items-center group transition-all hover:bg-slate-800">
                  <div className="bg-blue-500/10 p-2 rounded-lg mr-3 group-hover:bg-blue-500/20 transition-colors">
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="text-xs text-slate-300 truncate font-medium">{file.fileName}</p>
                    <div className="flex space-x-3 mt-1">
                      <a 
                        href={`/api/files/download?path=${encodeURIComponent(file.fileUrl.startsWith('/') ? file.fileUrl.substring(1) : file.fileUrl)}&userId=${task.assignedToId || ''}&mode=view`} 
                        target="_blank" 
                        className="text-[9px] font-bold text-amber-500 hover:text-amber-400 uppercase tracking-widest flex items-center"
                      >
                        <ExternalLink size={10} className="mr-1" />
                        View
                      </a>
                      <a 
                        href={`/api/files/download?path=${encodeURIComponent(file.fileUrl.startsWith('/') ? file.fileUrl.substring(1) : file.fileUrl)}&userId=${task.assignedToId || ''}&mode=download`} 
                        className="text-[9px] font-bold text-slate-500 hover:text-white uppercase tracking-widest flex items-center"
                      >
                        <Download size={10} className="mr-1" />
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              ))}
              {(!task.attachments || task.attachments.length === 0) && (
                <p className="text-xs text-slate-600 italic">No files attached.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Activity Log */}
        <div className="w-full md:w-80 bg-slate-950/50 p-6 flex flex-col">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <History className="w-4 h-4 mr-2" />
              Audit Trail
            </div>
            <button 
              onClick={() => fetchTask()} 
              className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-500 hover:text-amber-500"
              title="Refresh Logs"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-4 mb-6 scrollbar-hide pr-2">
            {task.logs?.map((log: any) => (
              <div key={log.id} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm relative group">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter ${
                    log.action.includes('STATUS') ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'
                  }`}>
                    {log.action.split(':').pop()?.trim() || log.action}
                  </span>
                  <span className="text-[8px] text-slate-500 font-medium">
                    {format(new Date(log.timestamp), 'MMM d, HH:mm')}
                  </span>
                </div>
                
                {log.details && (
                  <p className="text-xs text-slate-300 leading-relaxed font-medium mb-2">
                    {log.details}
                  </p>
                )}
                
                <div className="flex items-center text-[9px] text-slate-500 italic">
                  <div className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[7px] mr-1.5 font-bold text-amber-500">
                    {log.user?.name?.substring(0, 1).toUpperCase()}
                  </div>
                  <span>by {log.user?.name}</span>
                </div>
              </div>
            ))}
            
            {(!task.logs || task.logs.length === 0) && (
              <div className="flex flex-col items-center justify-center h-48 text-slate-600 border border-dashed border-slate-800 rounded-2xl">
                <History className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-[10px] font-bold uppercase tracking-widest italic">No activity logs found</p>
              </div>
            )}
          </div>

          <div className="mt-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Activity Management</h3>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setActiveTab('UPDATE')} 
                  className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all ${activeTab === 'UPDATE' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  Updates
                </button>
                <button 
                  onClick={() => setActiveTab('REMINDERS')} 
                  className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all ${activeTab === 'REMINDERS' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  Reminders
                </button>
              </div>
            </div>
            
            {activeTab === 'UPDATE' ? (
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 animate-in slide-in-from-bottom-2">
                {!pendingStatus ? (
                  <div className="flex flex-col space-y-3">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Change Status</p>
                    <div className="grid grid-cols-3 gap-2">
                      {['ACCEPTED', 'WORKING', 'COMPLETED'].map((s) => {
                        const STAGE_ORDER = ['PENDING', 'ACCEPTED', 'WORKING', 'COMPLETED'];
                        const currentIdx = STAGE_ORDER.indexOf(task.status);
                        const buttonIdx = STAGE_ORDER.indexOf(s);
                        const isPastOrCurrent = currentIdx >= buttonIdx;

                        return (
                          <button
                            key={s}
                            onClick={() => setPendingStatus(s)}
                            disabled={updating || isPastOrCurrent}
                            className={`text-[9px] font-bold py-2 rounded-lg border transition-all ${
                              task.status === s 
                              ? 'bg-amber-500 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.3)]' 
                              : isPastOrCurrent
                              ? 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed opacity-50'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                    <div className="h-px bg-slate-800 my-1"></div>
                    <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-1 flex items-center">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Add Progress Comment
                    </p>
                    <textarea
                      value={updateNote}
                      onChange={(e) => setUpdateNote(e.target.value)}
                      placeholder="Type your progress update or comment here... (Can be added multiple times)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white h-20 resize-none outline-none focus:border-amber-500/50 transition-all shadow-inner"
                    />
                    <div className="flex space-x-2">
                      <label className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] font-bold py-2 px-3 rounded-lg cursor-pointer transition-colors flex items-center justify-center border border-slate-700">
                        <FileText size={12} className="mr-2 text-amber-500" />
                        {attachedFile ? attachedFile.name : 'Attach Document'}
                        <input type="file" className="hidden" onChange={handleFileChange} />
                      </label>
                      <button
                        onClick={() => submitStatusUpdate(false)}
                        disabled={updating || !updateNote}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold py-2 rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20"
                      >
                        {updating ? 'Posting...' : 'Post Comment'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Update to {pendingStatus}</span>
                      <button onClick={() => setPendingStatus(null)} className="text-slate-500 hover:text-white"><X size={14}/></button>
                    </div>
                    
                    <textarea
                      value={updateNote}
                      onChange={(e) => setUpdateNote(e.target.value)}
                      placeholder={`Provide a reason for moving to ${pendingStatus}...`}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white h-20 resize-none outline-none focus:border-amber-500/50"
                    />

                    <div className="flex items-center space-x-2">
                      <label className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] font-bold py-2 px-3 rounded-lg cursor-pointer transition-colors flex items-center justify-center border border-slate-700">
                        <FileText size={12} className="mr-2 text-amber-500" />
                        {attachedFile ? attachedFile.name : 'Attach Progress'}
                        <input type="file" className="hidden" onChange={handleFileChange} />
                      </label>
                    </div>

                    <button
                      onClick={() => submitStatusUpdate(true)}
                      disabled={updating}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold py-2 rounded-lg shadow-lg shadow-amber-500/20"
                    >
                      {updating ? 'Saving...' : `Confirm ${pendingStatus}`}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4 animate-in slide-in-from-bottom-2">
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Set New Reminder</p>
                  <input 
                    type="datetime-local" 
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white [color-scheme:dark]"
                  />
                  <input 
                    type="text" 
                    placeholder="Reminder note..."
                    value={reminderNote}
                    onChange={(e) => setReminderNote(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  />
                  <button 
                    onClick={addReminder}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold py-2 rounded-lg"
                  >
                    Set Reminder
                  </button>
                </div>
                
                <div className="h-px bg-slate-800"></div>
                
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {task.reminders?.map((r: any) => (
                    <div key={r.id} className="p-2 bg-slate-950/50 rounded border border-slate-800 flex justify-between items-center">
                      <div className="min-w-0">
                        <p className="text-[9px] text-slate-300 truncate">{r.note || 'No note'}</p>
                        <p className="text-[8px] text-slate-500">{new Date(r.remindAt).toLocaleString()}</p>
                      </div>
                      {new Date(r.remindAt) < new Date() && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
