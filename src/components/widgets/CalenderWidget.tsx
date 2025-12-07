import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import Card from "./Card";


export default function CalendarWidget() {
  const today = new Date().getDate();
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <Card>
      <div className="grid grid-cols-7 gap-1 text-center text-gray-200 text-sm">
        {days.map((d) => (
          <div
            key={d}
            className={`p-1 rounded-md ${d === today ? "bg-indigo-600 text-white" : "bg-white/5"}`}
          >
            {d}
          </div>
        ))}
      </div>
    </Card>
  );
}
