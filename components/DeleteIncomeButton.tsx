"use client";

import React, { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DeleteIncomeButton({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this income record?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/income/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors ml-2"
      title="Delete Income"
    >
      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  );
}
