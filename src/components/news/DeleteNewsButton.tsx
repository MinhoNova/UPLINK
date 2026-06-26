"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DeleteNewsButton({ newsId, authorId, onDeleted }: { newsId: number; authorId: string; onDeleted?: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this shared news post?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/news?id=${newsId}`, { method: "DELETE" });
      if (!res.ok) {
        const msg = await res.json().then((d) => d.error).catch(() => "Failed to delete");
        alert(msg);
        setDeleting(false);
        return;
      }
      if (onDeleted) onDeleted();
      else router.refresh();
    } catch {
      alert("Failed to delete");
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-lg transition-all shrink-0 flex items-center gap-1"
      title="Delete this shared news post"
    >
      {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
      <span className="hidden sm:inline">Delete</span>
    </button>
  );
}
