import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import Card from "./Card";


export default function FantasyWidget() {
  return (
    <Card>
      <div className="text-white text-lg font-semibold mb-2">Fantasy Week 12</div>
      <div className="flex justify-between text-gray-300">
        <div>Major FC</div>
        <div className="text-white text-3xl font-bold">98</div>
      </div>
      <div className="flex justify-between text-gray-300 mt-1">
        <div>Opponent</div>
        <div className="text-white text-3xl font-bold">104</div>
      </div>
      <div className="mt-3 w-full h-2 bg-white/20 rounded">
        <div className="h-2 bg-indigo-500 rounded" style={{ width: "44%" }}></div>
      </div>
    </Card>
  );
}

