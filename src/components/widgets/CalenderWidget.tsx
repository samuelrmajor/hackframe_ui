import { useState, useEffect } from "react";
// import type { SupabaseClient } from "@supabase/supabase-js";

import Card from "./Card";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface CalendarEvent {
  name: string;
  month: number; // 0-11 (JavaScript month format)
  day: number;   // 1-31
  type?: 'birthday' | 'holiday' | 'other';
}

interface CalendarWidgetProps {
  events?: CalendarEvent[];
  timezone?: string; // e.g., "America/New_York"
}

const getEventIcon = (event: CalendarEvent) => {
  if (event.type === 'birthday') return '🎂';
  if (event.type === 'holiday') {
    const name = event.name.toLowerCase();
    if (name.includes('christmas')) return '🎄';
    if (name.includes('thanksgiving') || name.includes('turkey')) return '🦃';
    if (name.includes('new year')) return '🎆';
    if (name.includes('halloween')) return '🎃';
    if (name.includes('easter')) return '🐰';
    if (name.includes('valentine')) return '❤️';
    return '🎉';
  }
  return '📅';
};

export default function CalendarWidget({ events = [], timezone }: CalendarWidgetProps) {
  const [now, setNow] = useState<Date>(new Date());
  const [currentDate, setCurrentDate] = useState(now);
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());

  // Get current time in specified timezone on mount
  useEffect(() => {
    const getCurrentTimeInTimezone = () => {
      const now = new Date();
      const tzTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
      setNow(tzTime);
      setCurrentDate(tzTime);
      setSelectedDay(tzTime.getDate());
    };
    
    getCurrentTimeInTimezone();
  }, [timezone]);
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = now.getDate();
  const isCurrentMonth = now.getMonth() === month && now.getFullYear() === year;
  
  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  // Build calendar grid
  const calendarDays = [];
  
  // Previous month's trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      isPrev: true
    });
  }
  
  // Find events for current month
  const eventsThisMonth = events.filter(e => e.month === month);
  const getEventsForDay = (day: number) => 
    eventsThisMonth.filter(e => e.day === day);
  
  // Get events for selected day (or today if current month and no selection)
  const selectedDayEvents = selectedDay 
    ? getEventsForDay(selectedDay) 
    : isCurrentMonth 
    ? getEventsForDay(today)
    : [];
  
  // Current month's days
  for (let i = 1; i <= daysInMonth; i++) {
    const dayEvents = getEventsForDay(i);
    calendarDays.push({
      day: i,
      isCurrentMonth: true,
      isToday: isCurrentMonth && i === today,
      events: dayEvents
    });
  }
  
  // Next month's leading days
  const remainingSlots = 42 - calendarDays.length; // 6 rows × 7 days
  for (let i = 1; i <= remainingSlots; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: false,
      isNext: true
    });
  }

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const goToToday = () => {
    const todayInTz = new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
    setNow(todayInTz);
    setCurrentDate(todayInTz);
    setSelectedDay(todayInTz.getDate());
  };
  
  const handleDayClick = (day: number, isCurrentMonthDay: boolean) => {
    if (isCurrentMonthDay) {
      setSelectedDay(day);
    }
  };

  return (
    <Card centered={false}>
      <div className="space-y-2 h-full flex flex-col">
        {/* Header with month/year and navigation */}
        <div className="flex items-center justify-between flex-shrink-0 mb-1">
          <h3 className="text-base font-semibold text-white">
            {MONTHS[month]} {year}
          </h3>
          <div className="flex gap-1">
            <button
              onClick={goToPrevMonth}
              className="px-1.5 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-gray-300 transition-colors text-sm"
              aria-label="Previous month"
            >
              ‹
            </button>
            <button
              onClick={goToToday}
              className="px-1.5 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-gray-300 text-xs transition-colors"
            >
              Today
            </button>
            <button
              onClick={goToNextMonth}
              className="px-1.5 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-gray-300 transition-colors text-sm"
              aria-label="Next month"
            >
              ›
            </button>
          </div>
        </div>

        {/* Event display for selected day */}
        {selectedDayEvents.length > 0 && (
          <div className="bg-white/10 border border-white/20 rounded px-2 py-1.5 flex-shrink-0">
            <div className="text-xs font-semibold text-gray-300 mb-0.5">
              Events:
            </div>
            <div className="text-xs text-white flex flex-col gap-0.5">
              {selectedDayEvents.map((e, i) => (
                 <div key={i}>
                    {getEventIcon(e)} {e.name}
                 </div>
              ))}
            </div>
          </div>
        )}

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-0.5 text-center text-xs font-medium text-gray-400 flex-shrink-0">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="py-0.5">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5 text-center text-xs flex-1">
          {calendarDays.map((date, idx) => {
            const hasEvent = date.events && date.events.length > 0;
            const isSelected = date.isCurrentMonth && selectedDay === date.day;
            
            return (
              <div
                key={idx}
                onClick={() => handleDayClick(date.day, date.isCurrentMonth)}
                style={{ backgroundColor: date.isToday ? '#4f46e5' : undefined }}
                className={`
                  flex flex-col items-center justify-center rounded transition-all relative
                  ${date.isToday 
                    ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/50" 
                    : date.isCurrentMonth
                    ? "bg-white/5 text-gray-200 hover:bg-white/10 cursor-pointer"
                    : "bg-transparent text-gray-600"
                  }
                  ${hasEvent && date.isCurrentMonth ? "ring-2 ring-pink-500" : ""}
                  ${isSelected && !date.isToday ? "ring-2 ring-white/40" : ""}
                `}
              >
                <span>{date.day}</span>
                {hasEvent && date.isCurrentMonth && (
                  <span className="text-[10px] leading-none">
                    {getEventIcon(date.events[0])}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
