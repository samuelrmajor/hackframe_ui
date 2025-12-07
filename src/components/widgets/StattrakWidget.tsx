import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";


import Card from "./Card";

interface StattrakWidgetProps {
    supabase: SupabaseClient;
    widgetId?: number;
}

export default function StattrakWidget({ supabase, widgetId = 1 }: StattrakWidgetProps) {
    const [stattrak_data, setStattrakData] = useState<any | null>(null);

    useEffect(() => {
        let cleanup: (() => void) | undefined;

        const setupRealtime = async () => {
            // Fetch initial row from table `widget_stattrack`
            try {
                const { data, error } = await supabase
                    .from("widget_stattrack")
                    .select("*")
                    .eq("id", widgetId)
                    .maybeSingle();

                if (error) {
                    console.error("Failed to fetch widget_stattrack row:", error);
                } else {
                    setStattrakData(data ?? null);
                }
            } catch (err) {
                console.error("Error fetching widget_stattrack row:", err);
            }

            // then set up realtime
            try {
                await supabase.realtime.setAuth(); // Needed for Realtime Authorization
                const channel = supabase
                    .channel(`id:${widgetId}`, {
                        config: { private: true },
                    })
                    .on("broadcast", { event: "UPDATE" }, (payload) => {
                        console.log("UPDATE", payload);
                        if (payload.payload?.record) {
                            setStattrakData(payload.payload.record);
                        }
                    })
                    .subscribe();

                cleanup = () => {
                    supabase.removeChannel(channel);
                };
            } catch (err) {
                console.error("StattrakWidget realtime setup failed:", err);
            }
        };

        setupRealtime();

        return () => {
            if (cleanup) cleanup();
        };
    }, [supabase, widgetId]);

    const kills = stattrak_data?.stattrak ?? 0;
    const nametag = stattrak_data?.nametag ?? "UNNAMED";

    // Colors per user's request
    const COLOR_INACTIVE = "#4E2F37"; // non-active
    const COLOR_LEADING_ZERO = "#90523B"; // leading zeros
    const COLOR_ACTIVE = "#E7753A"; // active numbers
    return (
        <Card>
            <div style={{
                background: "linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)",
                padding: "20px 70px",
                borderRadius: "8px",
                fontFamily: "'Courier New', monospace",
                boxShadow: "inset 0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(255,140,0,0.3)"
            }}>
                {/* StatTrak Label */}
                <div style={{
                    fontSize: "10px",
                    color: "#ff8c00",
                    fontWeight: "bold",
                    letterSpacing: "2px",
                    textShadow: "0 0 10px rgba(255,140,0,0.8)",
                    marginBottom: "12px"
                }}>
                    ★ STATTRAK™ ★
                </div>

                {/* Nametag Display */}
                <div style={{
                    fontSize: "12px",
                    color: "#ffaa00",
                    marginBottom: "8px",
                    textShadow: "0 0 8px rgba(255,170,0,0.6)",
                    wordBreak: "break-all"
                }}>
                    {nametag}
                </div>

                {/* Matrix LED Display - 6 Digits with 5x7 grid per digit */}
                <div style={{
                    background: "linear-gradient(to bottom, #1a1a1a 0%, #0a0a0a 100%)",
                    border: "3px solid",
                    borderColor: "#666 #222 #222 #666",
                    borderRadius: "2px",
                    padding: "10px 6px",
                    marginBottom: "12px",
                    boxShadow: "inset 0 1px 3px rgba(255,255,255,0.1), inset 0 2px 8px rgba(0,0,0,0.9), 0 0 12px rgba(255,140,0,0.3)"
                }}>
                    <div style={{
                        display: "flex",
                        gap: "6px",
                        justifyContent: "center",
                        alignItems: "center"
                    }}>
                        {(() => {
                            const digits = String(kills).padStart(6, "0").split("");
                            const firstNonZeroIdx = digits.findIndex((d) => d !== "0");
                            return digits.map((digit, digitIdx) => (
                                <div key={digitIdx} style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(5, 1fr)",
                                    gap: "2px"
                                }}>
                                    {Array.from({ length: 35 }).map((_, i) => {
                                        // Simple 7-segment style matrix representation
                                        const digitMap: Record<string, Set<number>> = {
                                            "0": new Set([1, 2, 3, 5, 9, 10, 13, 14, 15, 17, 19, 20, 21, 24, 25, 29, 31, 32, 33]),
                                            "1": new Set([2,6,7,12,17,22,27,31,32,33]),
                                            "2": new Set([1,2,3,5,9,14,18,22,26,30,31,32,33,34]),
                                            "3": new Set([0,1,2,3,9,14,16,17,18,24,29,30,31,32,33]),
                                            "4": new Set([0,4,5,9,10,14,15,16,17,18,19,24,29,34]),
                                            "5": new Set([0,1,2,3,4,5,10,15,16,17,18,24,29,30,31,32,33]),
                                            "6": new Set([1,2,3,5,10,15,16,17,18,20,24,25,29,31,32,33]),
                                            "7": new Set([0,1,2,3,4,9,13,17,21,25,30]),
                                            "8": new Set([1,2,3,5,9,10,14,16,17,18,20,24,25,29,31,32,33]),
                                            "9": new Set([1,2,3,5,9,10,14,16,17,18,19,24,29,31,32,33])
                                        };

                                        const isLit = digitMap[digit]?.has(i) ?? false;

                                        // leading zero logic: digits before the first non-zero are considered leading zeros
                                        const isAllZero = firstNonZeroIdx === -1;
                                        const isLeadingZero = (
                                            (!isAllZero && digitIdx < firstNonZeroIdx && digit === "0") ||
                                            (isAllZero && digitIdx !== digits.length - 1 && digit === "0")
                                        );

                                        const litColor = isLeadingZero ? COLOR_LEADING_ZERO : COLOR_ACTIVE;
                                        const bg = isLit ? litColor : COLOR_INACTIVE;
                                        const boxShadow = isLit ? `0 0 4px ${litColor}, 0 0 8px ${litColor}66` : "none";

                                        return (
                                            <div
                                                key={i}
                                                style={{
                                                    width: "4px",
                                                    height: "4px",
                                                    background: bg,
                                                    borderRadius: "1px",
                                                    boxShadow,
                                                    transition: "all 0.12s ease"
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            ));
                        })()}
                    </div>
                </div>

                {/* Kill Counter Display */}
                
            </div>
        </Card>
    );
}

