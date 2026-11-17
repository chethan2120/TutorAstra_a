'use client';

import ChatDesk from '@/components/portal/ChatDesk';

export default function AdminChatPage() {
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-black text-[#310064]">Chat</h1>
        <p className="text-sm text-[#51475B]">Pick a teacher or a class. Older messages stay, with the date on each one.</p>
      </div>
      <ChatDesk />
    </div>
  );
}
