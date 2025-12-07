import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import Card from "./Card";


export default function MiscWidget() {
  return (
    <Card>
      <div className="text-gray-300 text-sm mb-1">Daily Quote</div>
      <div className="text-white text-lg">“Stay hard.”</div>
      <div className="text-gray-400 text-xs mt-1">— Goggins</div>
    </Card>
  );
}

