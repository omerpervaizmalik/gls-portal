"use client";

import React from 'react';
import TaskCard from './TaskCard';

const COLUMNS = [
  { id: 'PENDING', title: 'Pending' },
  { id: 'ACCEPTED', title: 'Accepted' },
  { id: 'WORKING', title: 'Working' },
  { id: 'COMPLETED', title: 'Completed' },
];

interface KanbanBoardProps {
  tasks: any[];
  onTaskClick: (task: any) => void;
}

export default function KanbanBoard({ tasks, onTaskClick }: KanbanBoardProps) {
  return (
    <div className="flex space-x-6 overflow-x-auto pb-6 scrollbar-hide">
      {COLUMNS.map((column) => {
        const columnTasks = tasks.filter(t => t.status === column.id);
        
        return (
          <div key={column.id} className="flex-shrink-0 w-80">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center">
                <span className="w-2 h-2 rounded-full bg-amber-500 mr-2 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                {column.title}
              </h3>
              <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {columnTasks.length}
              </span>
            </div>
            
            <div className="space-y-4 min-h-[500px] bg-slate-900/20 rounded-2xl p-2 border border-dashed border-slate-800/50">
              {columnTasks.map((task) => (
                <TaskCard key={task.id} task={task} onClick={onTaskClick} />
              ))}
              
              {columnTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-slate-600">
                  <p className="text-[10px] font-medium italic">Empty</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
