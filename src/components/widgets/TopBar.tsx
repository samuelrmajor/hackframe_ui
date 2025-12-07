import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { motion } from "framer-motion";


export default function TopBar() {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const dateStr = now.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
    const timeStr = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    return (
        <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-4 p-4 rounded-2xl bg-white/10 backdrop-blur-lg flex justify-between items-center shadow-lg border border-white/20"
        >
            <div className="text-gray-200 text-lg">{dateStr}</div>
            <div className="text-3xl font-bold text-white tracking-tight">{timeStr}</div>
            <div className="flex items-center gap-2 text-gray-200">☁️ <span>68°F</span></div>
        </motion.header>
    );
}

