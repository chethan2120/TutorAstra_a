'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Paperclip, Send } from 'lucide-react';

type Thread = { id: number; title: string; kind: 'class' | 'staff' };
type Note = { id: number; body: string; created_at: string; sender_id: number; sender_name: string; attachments?: { id: number; filename: string }[] };

export default function ChatDesk({ mine }: { mine?: number }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<Thread | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState('');
  const [me, setMe] = useState(mine || 0);
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [fileName, setFileName] = useState('');
  const pane = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    fetch('/api/portal/home').then((response) => response.json()).then(async (body) => {
      setMe(body.me?.id || 0);
      setRole(body.me?.role || '');
      const rows = (body.enrolments || []).map((row: { id: number; student_name?: string; subject_name: string; teacher_name?: string }) => ({
        id: row.id,
        kind: 'class' as const,
        title: `${row.student_name || 'Student'} · ${row.subject_name}`,
      }));
      let next: Thread[] = rows;
      if (body.me?.role === 'admin') {
        const people = await fetch('/api/portal/users').then((response) => response.json());
        const staff = (people.teachers || []).map((teacher: { id: number; name: string }) => ({ id: teacher.id, kind: 'staff' as const, title: teacher.name }));
        next = [...staff, ...rows];
      } else if (body.me?.role === 'teacher') {
        next = [{ id: 0, kind: 'staff', title: 'Admin' }, ...rows];
      }
      setThreads(next);
      setActive(next[0] || null);
    }).catch(() => setError('The conversations could not be loaded.'));
  }, []);

  function threadUrl(thread: Thread) {
    if (thread.kind === 'staff') return `/api/portal/staff-chat${role === 'admin' ? `?teacherId=${thread.id}` : ''}`;
    return `/api/portal/messages?enrolmentId=${thread.id}`;
  }

  useEffect(() => {
    if (!active) return;
    fetch(threadUrl(active)).then((response) => response.json()).then((body) => {
      if (body.error) setError(body.error);
      setNotes(body.messages || []);
    }).catch(() => setError('This conversation could not be opened.'));
  }, [active, role]);

  useEffect(() => {
    if (pane.current) pane.current.scrollTop = pane.current.scrollHeight;
  }, [notes]);

  const grouped = useMemo(() => notes.map((note) => {
    const raw = note.created_at?.includes('T') ? note.created_at : `${String(note.created_at || '').replace(' ', 'T')}Z`;
    const date = new Date(raw);
    const safe = Number.isNaN(date.getTime()) ? new Date() : date;
    return {
      ...note,
      day: safe.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      clock: safe.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    };
  }), [notes]);

  async function deliver(file?: File) {
    if (!active) return;
    setError('');
    setSending(true);
    try {
      let response: Response;
      if (active.kind === 'staff') {
        if (file) {
          setError('A voice note or file is saved on a class conversation.');
          return;
        }
        const payload: { body: string; teacherId?: number } = { body: text };
        if (role === 'admin') payload.teacherId = active.id;
        response = await fetch('/api/portal/staff-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        const payload = new FormData();
        payload.set('enrolmentId', String(active.id));
        payload.set('body', text);
        if (file && file.size) payload.set('file', file);
        response = await fetch('/api/portal/messages', { method: 'POST', body: payload });
      }
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || 'The message was not saved.');
        return;
      }
      setText('');
      setFileName('');
      if (fileRef.current) fileRef.current.value = '';
      const next = await fetch(threadUrl(active)).then((item) => item.json());
      setNotes(next.messages || []);
    } catch {
      setError('The message was not saved.');
    } finally {
      setSending(false);
    }
  }

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active || sending) return;
    const picked = fileRef.current?.files?.[0];
    await deliver(picked && picked.size ? picked : undefined);
  }

  async function toggleMic() {
    if (!active || active.kind === 'staff') {
      setError('A voice note is saved on a class conversation.');
      return;
    }
    if (recording && recorder.current) {
      recorder.current.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream);
      chunks.current = [];
      media.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      media.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks.current, { type: media.mimeType || 'audio/webm' });
        const file = new File([blob], 'voice-note.webm', { type: 'audio/webm' });
        setRecording(false);
        deliver(file);
      };
      recorder.current = media;
      media.start();
      setRecording(true);
    } catch {
      setError('The microphone could not be used.');
    }
  }

  return (
    <div className="grid h-[72vh] overflow-hidden rounded-2xl border border-[#E8E2ED] bg-[#efeae2] md:grid-cols-[280px_1fr]">
      <aside className="overflow-y-auto border-r border-[#E8E2ED] bg-white">
        <p className="border-b px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#51475B]">Conversations</p>
        {threads.map((thread) => (
          <button key={`${thread.kind}-${thread.id}`} type="button" onClick={() => setActive(thread)} className={`block w-full border-b px-4 py-3 text-left ${active?.id === thread.id && active.kind === thread.kind ? 'bg-[#F5F0FA]' : 'hover:bg-[#FAF9FC]'}`}>
            <span className="block text-sm font-bold text-[#21152D]">{thread.title}</span>
          </button>
        ))}
        {threads.length === 0 && <p className="p-4 text-sm text-[#51475B]">No conversation yet.</p>}
      </aside>
      <section className="flex min-h-0 flex-col">
        <div className="bg-[#310064] px-4 py-3 text-sm font-bold text-white">{active ? active.title : 'Select a conversation'}</div>
        <div ref={pane} className="flex-1 space-y-2 overflow-y-auto p-3">
          {grouped.length === 0 && <p className="text-center text-sm text-[#51475B]">No messages yet. What you send stays here.</p>}
          {grouped.map((note, index) => (
            <div key={note.id}>
              {(index === 0 || grouped[index - 1].day !== note.day) && <p className="my-2 text-center text-[11px] text-[#51475B]">{note.day}</p>}
              <div className={`flex ${note.sender_id === me ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm ${note.sender_id === me ? 'bg-[#DCF8C6]' : 'bg-white'}`}>
                  <p className="text-[11px] font-bold text-[#310064]">{note.sender_name}</p>
                  {note.body && <p>{note.body}</p>}
                  {note.attachments?.map((file) => (
                    file.filename.includes('voice')
                      ? <audio key={file.id} controls src={`/api/portal/files/${file.id}`} className="mt-1 h-8 max-w-full" />
                      : <a key={file.id} className="mt-1 block underline" href={`/api/portal/files/${file.id}`}>{file.filename}</a>
                  ))}
                  <p className="text-right text-[10px] text-slate-500">{note.clock}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {error && <p className="bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</p>}
        {fileName && <p className="bg-white px-4 py-1 text-xs text-[#51475B]">Attached: {fileName}</p>}
        <form onSubmit={send} className="flex items-center gap-2 bg-[#111b21] px-3 py-2">
          <button type="button" aria-label="Attach a file" onClick={() => fileRef.current?.click()} className="flex h-10 w-10 items-center justify-center text-[#d1d7db]">
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            ref={fileRef}
            name="file"
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp,audio/webm,audio/mpeg,video/mp4,video/webm"
            className="hidden"
            onChange={(event) => setFileName(event.target.files?.[0]?.name || '')}
          />
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            aria-label="Message"
            placeholder="Type a message"
            className="h-10 flex-1 rounded-full bg-[#2a3942] px-4 text-sm text-white outline-none placeholder:text-[#8696a0]"
          />
          {text.trim() || fileName ? (
            <button type="submit" aria-label="Send" disabled={sending || !active} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#310064] text-white disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" aria-label={recording ? 'Stop voice note' : 'Voice note'} onClick={toggleMic} className={`flex h-10 w-10 items-center justify-center ${recording ? 'text-rose-400' : 'text-[#d1d7db]'}`}>
              <Mic className="h-5 w-5" />
            </button>
          )}
        </form>
      </section>
    </div>
  );
}
