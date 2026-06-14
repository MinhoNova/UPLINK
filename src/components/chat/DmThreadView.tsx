"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, Pencil, Trash2, ImagePlus, X, Smile, Check, CheckCheck } from "lucide-react";
import { DM_REACTION_EMOJIS, getDmMsgKey, isMessageReceipted, type DmMessage } from "@/lib/dmHelpers";

type Props = {
  peerUsername: string;
  currentHandle: string;
  messages: DmMessage[];
  chatError: string | null;
  readReceiptsFromPeer?: string[];
  deliveredReceiptsFromPeer?: string[];
  onSend: (text: string, image?: string) => Promise<void>;
  onEdit: (msg: DmMessage, text: string) => Promise<void>;
  onDelete: (msg: DmMessage) => Promise<void>;
  onReact: (msg: DmMessage, emoji: string) => Promise<void>;
  scrollClassName?: string;
};

export default function DmThreadView({
  peerUsername,
  currentHandle,
  messages,
  chatError,
  onSend,
  onEdit,
  onDelete,
  onReact,
  scrollClassName = "max-h-[min(480px,calc(100vh-22rem))]",
  readReceiptsFromPeer = [],
  deliveredReceiptsFromPeer = [],
}: Props) {
  const [msgInput, setMsgInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingMsgKey, setEditingMsgKey] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [deleteConfirmKey, setDeleteConfirmKey] = useState<string | null>(null);
  const [reactionPickerKey, setReactionPickerKey] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const threadMessages = messages.filter(
    (m) =>
      (m.from === currentHandle && m.to === peerUsername) ||
      (m.to === currentHandle && m.from === peerUsername)
  );

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [threadMessages.length, peerUsername]);

  useEffect(() => {
    setEditingMsgKey(null);
    setEditDraft("");
    setDeleteConfirmKey(null);
    setReactionPickerKey(null);
    setImagePreview(null);
    setImageFile(null);
  }, [peerUsername]);

  const uploadChatImage = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("field", "chatImage");
    const res = await fetch("/api/user/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) throw new Error(data.error || "Upload failed");
    return data.url as string;
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file || file.size > 4 * 1024 * 1024) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
        return;
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 4 * 1024 * 1024) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSend = async () => {
    const trimmed = msgInput.trim();
    if (!trimmed && !imageFile && !imagePreview) return;
    setUploading(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = (await uploadChatImage(imageFile)) || undefined;
      }
      await onSend(trimmed, imageUrl);
      setMsgInput("");
      setImagePreview(null);
      setImageFile(null);
      scrollToBottom();
    } finally {
      setUploading(false);
    }
  };

  const handleSaveEdit = async (msg: DmMessage) => {
    if (!editDraft.trim()) return;
    await onEdit(msg, editDraft.trim());
    setEditingMsgKey(null);
    setEditDraft("");
  };

  return (
    <>
      <div
        ref={scrollRef}
        className={`overflow-y-auto space-y-3 pr-1 mb-4 custom-scrollbar ${scrollClassName}`}
      >
        {threadMessages.map((msg, i) => {
          const msgKey = getDmMsgKey(msg);
          const isMine = msg.from === currentHandle;
          const isEditing = editingMsgKey === msgKey;
          const isConfirmingDelete = deleteConfirmKey === msgKey;
          const reactions = msg.reactions || {};

          return (
            <div key={msgKey || i} className={`flex flex-col group ${isMine ? "items-end" : "items-start"}`}>
              {isEditing ? (
                <div className="max-w-[88%] w-full px-3 py-2.5 rounded-2xl bg-black/60 border border-[#00ffff]/30 shadow-lg rounded-tr-sm">
                  <textarea
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSaveEdit(msg); }
                      if (e.key === "Escape") { setEditingMsgKey(null); setEditDraft(""); }
                    }}
                    autoFocus
                    rows={2}
                    className="w-full bg-transparent text-[13px] text-white outline-none resize-none leading-relaxed"
                  />
                  <div className="flex justify-end gap-1.5 mt-2 pt-2 border-t border-white/10">
                    <button type="button" onClick={() => { setEditingMsgKey(null); setEditDraft(""); }} className="text-[9px] px-2.5 py-1 text-gray-400 font-black uppercase">Cancel</button>
                    <button type="button" onClick={() => void handleSaveEdit(msg)} disabled={!editDraft.trim()} className="text-[9px] px-2.5 py-1 text-[#00ffff] font-black uppercase disabled:opacity-30">Save</button>
                  </div>
                </div>
              ) : (
                <div
                  className={`max-w-[88%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-lg ${
                    isMine
                      ? "bg-gradient-to-br from-[#ff007f] to-[#c4006a] text-white rounded-tr-sm"
                      : "bg-white/10 text-gray-200 rounded-tl-sm border border-white/5"
                  }`}
                >
                  {msg.image && (
                    <img src={msg.image} alt="" className="max-w-full max-h-48 rounded-xl mb-2 border border-white/10 object-contain" loading="lazy" />
                  )}
                  {msg.text ? <span className="whitespace-pre-wrap break-words">{msg.text}</span> : null}
                  {msg.edited && <span className="block text-[9px] opacity-50 mt-0.5 font-bold uppercase tracking-wider">edited</span>}
                </div>
              )}

              {!isEditing && isMine && (
                <div className="flex items-center gap-0.5 mt-0.5 mr-1 opacity-60" title={isMessageReceipted(msg.timestamp, readReceiptsFromPeer) ? "Seen" : isMessageReceipted(msg.timestamp, deliveredReceiptsFromPeer) ? "Delivered" : "Sent"}>
                  {isMessageReceipted(msg.timestamp, readReceiptsFromPeer) ? (
                    <CheckCheck className="w-3 h-3 text-[#00ffff]" />
                  ) : isMessageReceipted(msg.timestamp, deliveredReceiptsFromPeer) ? (
                    <CheckCheck className="w-3 h-3 text-gray-400" />
                  ) : (
                    <Check className="w-3 h-3 text-gray-500" />
                  )}
                </div>
              )}

              {!isEditing && Object.keys(reactions).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1 max-w-[88%]">
                  {Object.entries(reactions).map(([handle, emoji]) => (
                    <button
                      key={handle}
                      type="button"
                      onClick={() => void onReact(msg, emoji)}
                      className={`text-[11px] px-1.5 py-0.5 rounded-full border transition ${
                        handle === currentHandle ? "bg-[#00ffff]/15 border-[#00ffff]/30" : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                      title={handle}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {!isEditing && (
                <div className={`flex gap-1 mt-1 transition-opacity ${isConfirmingDelete || reactionPickerKey === msgKey ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                  {reactionPickerKey === msgKey ? (
                    <div className="flex items-center gap-0.5 px-2 py-1 rounded-xl bg-black/60 border border-white/10">
                      {DM_REACTION_EMOJIS.map((emoji) => (
                        <button key={emoji} type="button" onClick={() => { void onReact(msg, emoji); setReactionPickerKey(null); }} className="text-base hover:scale-125 transition-transform px-0.5">
                          {emoji}
                        </button>
                      ))}
                      <button type="button" onClick={() => setReactionPickerKey(null)} className="p-0.5 text-gray-500 hover:text-white ml-1"><X className="w-3 h-3" /></button>
                    </div>
                  ) : isConfirmingDelete ? (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-black/50 border border-red-500/20">
                      <span className="text-[9px] text-gray-400 font-bold">Delete?</span>
                      <button type="button" onClick={() => void onDelete(msg)} className="text-[9px] px-2 py-0.5 bg-red-500/30 text-red-300 rounded-lg font-black uppercase">Yes</button>
                      <button type="button" onClick={() => setDeleteConfirmKey(null)} className="text-[9px] px-2 py-0.5 text-gray-400 font-black uppercase">No</button>
                    </div>
                  ) : (
                    <>
                      <button type="button" onClick={() => setReactionPickerKey(msgKey)} title="React" className="p-1.5 bg-white/5 text-gray-400 hover:text-[#00ffff] rounded-lg transition">
                        <Smile className="w-3 h-3" />
                      </button>
                      {isMine && (
                        <>
                          <button type="button" onClick={() => { setEditingMsgKey(msgKey); setEditDraft(msg.text); setDeleteConfirmKey(null); }} title="Edit" className="p-1.5 bg-[#00ffff]/10 text-[#00ffff] hover:bg-[#00ffff] hover:text-black rounded-lg transition">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button type="button" onClick={() => { setDeleteConfirmKey(msgKey); setEditingMsgKey(null); }} title="Delete" className="p-1.5 bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {threadMessages.length === 0 && (
          <div className="text-center py-10 opacity-20"><p className="text-[9px] font-black uppercase">Start chatting</p></div>
        )}
      </div>

      <div className="pt-4 border-t border-white/5 space-y-2">
        {chatError && <p className="text-[10px] text-red-400 font-bold">{chatError}</p>}
        {imagePreview && (
          <div className="relative inline-block">
            <img src={imagePreview} alt="" className="max-h-24 rounded-xl border border-white/10" />
            <button type="button" onClick={() => { setImagePreview(null); setImageFile(null); }} className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept="image/*,.gif" className="hidden" onChange={handleFileSelect} />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-gray-500 hover:text-[#00ffff] hover:border-[#00ffff]/30 transition" title="Upload image">
            <ImagePlus className="w-4 h-4" />
          </button>
          <input
            value={msgInput}
            onChange={(e) => setMsgInput(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && (msgInput.trim() || imageFile)) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Type a message or paste an image..."
            className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#00ffff]/40 transition-colors text-white/90 placeholder-gray-600"
          />
          <button
            type="button"
            disabled={uploading || (!msgInput.trim() && !imageFile)}
            onClick={() => void handleSend()}
            className="px-4 py-3 bg-[#00ffff]/15 text-[#00ffff] border border-[#00ffff]/30 rounded-2xl hover:bg-[#00ffff] hover:text-black transition disabled:opacity-30"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
