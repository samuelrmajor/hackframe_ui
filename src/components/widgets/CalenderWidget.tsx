import { useState } from "react";
// import type { SupabaseClient } from "@supabase/supabase-js";

import Card from "./Card";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface Birthday {
  name: string;
  month: number; // 0-11 (JavaScript month format)
  day: number;   // 1-31
}

interface CalendarWidgetProps {
  birthdays?: Birthday[];
}

export default function CalendarWidget({ birthdays = [] }: CalendarWidgetProps) {
  const now = new Date();
  const [currentDate, setCurrentDate] = useState(now);
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());
  
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
  
  // Find birthdays for current month
  const birthdaysThisMonth = birthdays.filter(b => b.month === month);
  const getBirthdaysForDay = (day: number) => 
    birthdaysThisMonth.filter(b => b.day === day);
  
  // Get birthdays for selected day (or today if current month and no selection)
  const selectedDayBirthdays = selectedDay 
    ? getBirthdaysForDay(selectedDay) 
    : isCurrentMonth 
    ? getBirthdaysForDay(today)
    : [];
  
  // Current month's days
  for (let i = 1; i <= daysInMonth; i++) {
    const dayBirthdays = getBirthdaysForDay(i);
    calendarDays.push({
      day: i,
      isCurrentMonth: true,
      isToday: isCurrentMonth && i === today,
      birthdays: dayBirthdays
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
    setCurrentDate(new Date());
    setSelectedDay(now.getDate());
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

        {/* Birthday display for selected day */}
        {selectedDayBirthdays.length > 0 && (
          <div className="bg-pink-500/20 border border-pink-500/40 rounded px-2 py-1.5 flex-shrink-0">
            <div className="text-xs font-semibold text-pink-300 mb-0.5">
              🎂 Birthday{selectedDayBirthdays.length > 1 ? 's' : ''}:
            </div>
            <div className="text-xs text-white">
              {selectedDayBirthdays.map(b => b.name).join(", ")}
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
            const hasBirthday = date.birthdays && date.birthdays.length > 0;
            const isSelected = date.isCurrentMonth && selectedDay === date.day;
            
            return (
              <div
                key={idx}
                onClick={() => handleDayClick(date.day, date.isCurrentMonth)}
                className={`
                  flex flex-col items-center justify-center rounded transition-all relative
                  ${date.isToday 
                    ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/50" 
                    : date.isCurrentMonth
                    ? "bg-white/5 text-gray-200 hover:bg-white/10 cursor-pointer"
                    : "bg-transparent text-gray-600"
                  }
                  ${hasBirthday && date.isCurrentMonth ? "ring-2 ring-pink-500" : ""}
                  ${isSelected && !date.isToday ? "ring-2 ring-white/40" : ""}
                `}
              >
                <span>{date.day}</span>
                {hasBirthday && date.isCurrentMonth && (
                  <span className="text-[10px] leading-none">🎂</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
