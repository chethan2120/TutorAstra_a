'use client';

import CalendarDesk from '@/components/portal/CalendarDesk';

export default function AdminCalendarPage() {
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-black text-[#310064]">Calendar</h1>
        <p className="text-sm text-[#51475B]">Open a month, pick a person, and see which days they teach or study. Free hours are for the date you select.</p>
      </div>
      <CalendarDesk allowPeople />
    </div>
  );
}
