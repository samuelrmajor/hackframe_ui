import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import Card from "./Card";


export default function SportsWidget() {
  return (
    <Card>
      <div className="text-white text-lg font-semibold mb-2">NBA Scores</div>
      <div className="flex justify-between text-gray-300">
        <div>NYK @ BOS</div>
        <div className="text-white text-xl font-bold">102 - 99</div>
      </div>
    </Card>
  );
}

