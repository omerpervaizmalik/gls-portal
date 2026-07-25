"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSession } from 'next-auth/react';
import { 
  Plus, 
  Search, 
  Bell, 
  Filter, 
  LayoutGrid, 
  List, 
  Calendar,
  AlertCircle,
  TrendingUp,
  Clock,
  Briefcase,
  Users
} from 'lucide-react';
import KanbanBoard from '@/components/tasks/KanbanBoard';
import NewTaskModal from '@/components/tasks/NewTaskModal';
import TaskDetailsModal from '@/components/tasks/TaskDetailsModal';

export default function TaskManagerPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'KANBAN' | 'LIST'>('KANBAN');
  const [showNewTask, setShowNewTask] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Filters & Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [sendingBulk, setSendingBulk] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTasks(data);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error(err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = (Array.isArray(tasks) ? tasks : []).filter((task: any) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = [
    { label: 'Active Tasks', value: filteredTasks.filter((t: any) => t.status !== 'COMPLETED').length, icon: Briefcase, color: 'text-blue-500' },
    { label: 'In Progress', value: filteredTasks.filter((t: any) => t.status === 'WORKING').length, icon: Clock, color: 'text-amber-500' },
    { label: 'Urgent', value: filteredTasks.filter((t: any) => t.priority === 'URGENT').length, icon: AlertCircle, color: 'text-red-500' },
    { label: 'Team Load', value: filteredTasks.length > 0 ? 'High' : 'Normal', icon: TrendingUp, color: 'text-emerald-500' },
  ];

  const handleBulkReminder = async () => {
    if (selectedTasks.length === 0) return;
    setSendingBulk(true);
    try {
      // Group tasks by assignee to send one WhatsApp message per assignee
      const tasksByUser: Record<string, any[]> = {};
      let count = 0;

      // For each selected task, create a reminder for the assigned user
      for (const taskId of selectedTasks) {
        const task: any = filteredTasks.find(t => t.id === taskId);
        if (!task || !task.assignedToId) continue;

        if (!tasksByUser[task.assignedToId]) {
          tasksByUser[task.assignedToId] = [];
        }
        tasksByUser[task.assignedToId].push(task);
        count++;

        await fetch(`/api/tasks/${taskId}/reminders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            remindAt: new Date(Date.now() + 3600000), // Default to 1 hour from now
            note: `Bulk Reminder: Please check progress on "${task.title}"` 
          })
        });
      }
      
      const userIds = Object.keys(tasksByUser);
      if (userIds.length > 0) {
        if (confirm(`Bulk reminders sent for ${count} tasks. Do you also want to send WhatsApp summaries to the assignees?`)) {
          userIds.forEach(userId => {
            const userTasks = tasksByUser[userId];
            const assignee = userTasks[0].assignedTo;
            
            const number = assignee?.profile?.whatsappNumber || assignee?.profile?.phoneNumber || "";
            let cleanNumber = number.replace(/[^0-9]/g, '');
            
            // Format Pakistani local numbers to international format
            if (cleanNumber.startsWith('0') && cleanNumber.length === 11) {
              cleanNumber = '92' + cleanNumber.substring(1);
            } else if (cleanNumber.startsWith('00')) {
              cleanNumber = cleanNumber.substring(2);
            }
            
            let reminderText = `*Reminder Messages For Pending Tasks at your GLS Portal. Please see the details on APP. Reply As Soon As Possible.*\n\n`;
            userTasks.forEach((t: any) => {
              reminderText += `- ${t.title}\n`;
            });
            
            const encodedText = encodeURIComponent(reminderText);
            
            if (cleanNumber) {
              window.open(`https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodedText}`, '_blank');
            } else {
              window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
            }
          });
        } else {
          alert(`Bulk reminders sent for ${count} tasks.`);
        }
      } else {
        alert("No valid tasks with assignees selected.");
      }
      
      setSelectedTasks([]);
    } catch (err) {
      alert("Error sending bulk reminders");
    } finally {
      setSendingBulk(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedTasks(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  return (
    <div className="flex h-full w-full bg-[#0a0c10] text-slate-300">
      <Sidebar />
      
      <main className="flex-1 overflow-x-auto md:overflow-x-hidden flex flex-col">
        {/* Header */}
        <header className="h-auto min-h-[5rem] border-b border-slate-800 pl-16 lg:px-8 px-4 py-4 flex flex-col md:flex-row items-start md:items-center justify-between bg-[#0a0c10]/80 backdrop-blur-md sticky top-0 z-20 space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4 md:space-x-8 w-full md:w-auto overflow-x-auto md:overflow-x-visible scrollbar-hide">
            <div className="shrink-0">
              <h1 className="text-lg md:text-xl font-bold text-white tracking-tight whitespace-nowrap md:whitespace-normal">Task Management</h1>
              <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest whitespace-nowrap md:whitespace-normal">Enterprise Architecture</p>
            </div>
            
            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800 ml-auto md:ml-0">
              <button 
                onClick={() => setView('KANBAN')}
                className={`p-1.5 md:p-2 rounded-lg transition-all ${view === 'KANBAN' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button 
                onClick={() => setView('LIST')}
                className={`p-1.5 md:p-2 rounded-lg transition-all ${view === 'LIST' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center space-x-2 bg-slate-900/50 p-1 rounded-xl border border-slate-800 w-full md:w-auto overflow-x-auto">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-[9px] font-bold uppercase tracking-widest px-2 outline-none text-slate-400 focus:text-amber-500"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="WORKING">Working</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <div className="w-px h-3 bg-slate-800"></div>
              <select 
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-transparent text-[9px] font-bold uppercase tracking-widest px-2 outline-none text-slate-400 focus:text-amber-500"
              >
                <option value="ALL">All Priority</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div className="relative flex-1 md:w-48 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-[10px] focus:ring-1 focus:ring-amber-500/30 transition-all outline-none"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              {selectedTasks.length > 0 && (
                <button 
                  onClick={handleBulkReminder}
                  disabled={sendingBulk}
                  className="bg-amber-500/10 border border-amber-500/30 text-amber-500 px-3 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all flex items-center shadow-lg"
                >
                  <Bell className="mr-1.5 h-3 w-3" />
                  {sendingBulk ? '...' : `(${selectedTasks.length})`}
                </button>
              )}

              {isAdmin && (
                <button 
                  onClick={() => setShowNewTask(true)}
                  className="hidden md:flex bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold transition-all items-center shadow-lg shadow-amber-500/20 whitespace-nowrap"
                >
                  <Plus className="mr-1.5 h-3 w-3" />
                  New Task
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-10">
            {stats.map((stat, i) => (
              <div key={i} className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl backdrop-blur-sm group hover:border-amber-500/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl bg-slate-950 border border-slate-800 ${stat.color}`}>
                    <stat.icon size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Live</span>
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Kanban Section */}
          <section className="relative min-h-[600px]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
              </div>
            ) : view === 'KANBAN' ? (
              <KanbanBoard tasks={filteredTasks} onTaskClick={(task) => setSelectedTaskId(task.id)} />
            ) : (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-x-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <table className="w-full text-left min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-950/50 border-b border-slate-800">
                      <th className="pl-6 py-4 w-12">
                        <input 
                          type="checkbox" 
                          checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedTasks(filteredTasks.map((t: any) => t.id));
                            else setSelectedTasks([]);
                          }}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500/20"
                        />
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Task Title</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assignee</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Deadline</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredTasks.map((task: any) => (
                      <tr 
                        key={task.id} 
                        className={`hover:bg-slate-800/30 transition-colors group ${selectedTasks.includes(task.id) ? 'bg-amber-500/5' : ''}`}
                      >
                        <td className="pl-6 py-4">
                          <input 
                            type="checkbox" 
                            checked={selectedTasks.includes(task.id)}
                            onChange={() => toggleSelect(task.id)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500/20"
                          />
                        </td>
                        <td className="px-6 py-4" onClick={() => setSelectedTaskId(task.id)}>
                          <p className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">{task.title}</p>
                          <p className="text-[10px] text-slate-500">{task.matter?.title || 'General'}</p>
                        </td>
                        <td className="px-6 py-4" onClick={() => setSelectedTaskId(task.id)}>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-tighter ${
                            task.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' :
                            task.status === 'WORKING' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex items-center" onClick={() => setSelectedTaskId(task.id)}>
                          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-bold mr-2 text-slate-400 border border-slate-700">
                            {task.assignedTo?.name?.substring(0, 2).toUpperCase() || '??'}
                          </div>
                          <span className="text-xs text-slate-400">{task.assignedTo?.name || 'Unassigned'}</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500" onClick={() => setSelectedTaskId(task.id)}>
                          {task.deadline ? new Date(task.deadline).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-right" onClick={() => setSelectedTaskId(task.id)}>
                          <span className={`text-[9px] font-bold px-2 py-1 rounded border ${
                            task.priority === 'URGENT' ? 'border-red-500/30 text-red-500 bg-red-500/5' :
                            task.priority === 'HIGH' ? 'border-amber-500/30 text-amber-500 bg-amber-500/5' :
                            'border-slate-700 text-slate-500'
                          }`}>
                            {task.priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Mobile Floating Action Button */}
      {isAdmin && (
        <div className="md:hidden fixed bottom-6 right-6 z-[90]">
          <button
            onClick={() => setShowNewTask(true)}
            className="w-14 h-14 bg-amber-500 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-transform"
          >
            <Plus size={28} />
          </button>
        </div>
      )}

      {/* Modals */}
      {showNewTask && <NewTaskModal onClose={() => setShowNewTask(false)} onSuccess={fetchTasks} />}
      {selectedTaskId && (
        <TaskDetailsModal 
          taskId={selectedTaskId} 
          onClose={() => setSelectedTaskId(null)} 
          onUpdate={fetchTasks} 
        />
      )}
    </div>
  );
}
