"use client";

import React from 'react';
import { Clock, AlertCircle, CheckCircle2, User, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface TaskCardProps {
  task: any;
  onClick: (task: any) => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'HIGH': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'MEDIUM': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div 
      onClick={() => onClick(task)}
      className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl hover:border-amber-500/50 transition-all cursor-pointer group backdrop-blur-sm"
    >
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        {task.deadline && (
          <div className="flex items-center text-[10px] text-slate-500">
            <Clock className="w-3 h-3 mr-1" />
            {format(new Date(task.deadline), 'MMM d')}
          </div>
        )}
      </div>

      <h4 className="text-sm font-semibold text-white mb-1 group-hover:text-amber-400 transition-colors">
        {task.title}
      </h4>
      <p className="text-xs text-slate-400 line-clamp-2 mb-4">
        {task.description || 'No description provided.'}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-medium text-slate-300">
            {task.assignedTo?.name?.substring(0, 2).toUpperCase() || '??'}
          </div>
          <span className="text-[10px] text-slate-500 truncate max-w-[80px]">
            {task.assignedTo?.name || 'Unassigned'}
          </span>
        </div>
        
        <div className="flex items-center space-x-3 text-slate-500">
          <div className="flex items-center text-[10px]">
            <MessageSquare className="w-3 h-3 mr-1" />
            {task.logs?.length || 0}
          </div>
        </div>
      </div>
      
      {task.matter && (
        <div className="mt-2 text-[9px] text-amber-500/70 font-medium uppercase tracking-wider">
          Matter: {task.matter.title}
        </div>
      )}
    </div>
  );
}
