import { useEffect, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

import Card from "./Card";

interface StattrakWidgetRow {
    id: number;
    stattrak?: number;
    nametag?: string;
    skinname?: string;
    icon_url?: string;
}

interface StattrakWidgetProps {
    session: Session;
    supabase: SupabaseClient;
    steam_asset_id: string;
    steam_user_id: string;
}

export default function StattrakWidget({ session, supabase, steam_asset_id, steam_user_id }: StattrakWidgetProps) {
    const [stattrakData, setStattrakData] = useState<StattrakWidgetRow | null>(null);

    useEffect(() => {
        let cleanup: (() => void) | undefined;

        const setupRealtime = async () => {
            // Fetch initial row from table `widget_stattrak`
            let initialRow: StattrakWidgetRow | null = null;
            try {
                const { data, error } = await supabase
                    .from("widget_stattrak")
                    .select("id, stattrak, nametag, skinname, icon_url")
                    .eq("steam_asset_id", steam_asset_id)
                    .eq("steam_user_id", steam_user_id)
                    .maybeSingle();

                if (error) {
                    console.error("Failed to fetch widget_stattrak row:", error);
                } else {
                    initialRow = (data as StattrakWidgetRow | null) ?? null;
                    setStattrakData(initialRow);
                }
            } catch (err) {
                console.error("Error fetching widget_stattrak row:", err);
            }

            // then set up realtime (channel key must remain widget_stattrak:widgetID:update)
            try {
                if (!initialRow?.id) return;

                await supabase.realtime.setAuth(session.access_token); // Needed for Realtime Authorization
                const channel = supabase
                    .channel(`widget_stattrak:${initialRow.id}:update`, {
                        config: { private: true },
                    })
                    .on("broadcast", { event: "stattrak_update" }, (payload) => {
                        console.log("Stattrak UPDATE", payload);
                        if (payload.payload?.record) {
                            setStattrakData(payload.payload.record as StattrakWidgetRow);
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
    }, [supabase, session.access_token, steam_asset_id, steam_user_id]);

    const kills = stattrakData?.stattrak ?? 0;
    const nametag = stattrakData?.nametag ?? "UNNAMED";
    const skinName = stattrakData?.skinname ?? "";
    const iconUrl = stattrakData?.icon_url
        ? `https://community.cloudflare.steamstatic.com/economy/image/${stattrakData.icon_url}/330x192`
        : null;

    // Colors per user's request
    const COLOR_INACTIVE = "#2a1a1a"; // Dark reddish/brown background for unlit pixels
    const COLOR_LEADING_ZERO = "#90523B"; // leading zeros
    const COLOR_ACTIVE = "#ff8800"; // Bright orange for active numbers

    return (
        <Card>
            <style>{`
                @keyframes led-pulse {
                    0%, 100% { box-shadow: 0 0 2px ${COLOR_ACTIVE}; filter: brightness(1); }
                    50% { box-shadow: 0 0 3px ${COLOR_ACTIVE}; filter: brightness(1.05); }
                }
                @keyframes nametag-pulse {
                    0%, 100% { text-shadow: 0 0 5px rgba(255,170,0,0.4); opacity: 0.98; }
                    50% { text-shadow: 0 0 8px rgba(255,170,0,0.6); opacity: 1; }
                }
                @keyframes casing-pulse {
                    0%, 100% { box-shadow: 0 0 0 rgba(255, 136, 0, 0), 0 10px 15px -3px rgba(0,0,0,0.5), 0 4px 6px -2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15); border-color: #1a1a1a; }
                    50% { box-shadow: 0 0 15px rgba(255, 136, 0, 0.15), 0 10px 15px -3px rgba(0,0,0,0.5), 0 4px 6px -2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15); border-color: #332200; }
                }
            `}</style>
            <div className="relative flex flex-row items-center justify-between h-full w-full p-3 gap-4 bg-gradient-to-br from-[#1e1e1e] via-[#151515] to-[#0a0a0a] rounded-xl border border-[#333] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] overflow-hidden">
                
                {/* Background decorative elements */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" 
                     style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #333 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
                </div>

                {/* Weapon Info & Nametag */}
                <div className="flex flex-col items-center justify-center flex-1 min-w-0 z-10 relative">
                    {skinName && (
                        <div className="text-[10px] text-gray-400 font-medium text-center truncate w-full px-1 mb-1 tracking-wider uppercase">
                            {skinName.split('|')[1]?.trim() || skinName}
                        </div>
                    )}
                    {iconUrl && (
                        <div className="relative group">
                            <div className="absolute inset-0 bg-orange-500/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <img 
                                src={iconUrl} 
                                alt="Weapon Skin" 
                                className="relative w-auto h-20 object-contain drop-shadow-[0_8px_8px_rgba(0,0,0,0.6)] transform transition-transform duration-500 hover:scale-105 hover:rotate-1"
                            />
                        </div>
                    )}
                    {nametag && nametag !== "UNNAMED" && (
                        <div style={{
                            marginTop: "4px",
                            fontSize: "10px",
                            color: "#ffaa00",
                            fontFamily: "monospace",
                            textAlign: "center",
                            width: "100%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            animation: "nametag-pulse 3s infinite ease-in-out"
                        }}>
                            "{nametag}"
                        </div>
                    )}
                </div>

                {/* Main Casing */}
                <div style={{
                    background: `
                        repeating-linear-gradient(
                            90deg,
                            rgba(255,255,255,0.03) 0px,
                            rgba(255,255,255,0.03) 1px,
                            transparent 1px,
                            transparent 3px
                        ),
                        linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%)
                    `,
                    padding: "4px",
                    borderRadius: "3px",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5), 0 4px 6px -2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                    border: "1px solid #1a1a1a",
                    width: "fit-content",
                    transform: "scale(0.9)",
                    flexShrink: 0,
                    position: "relative",
                    animation: "casing-pulse 4s infinite ease-in-out"
                }}>
                    {/* Screw details */}
                    <div className="absolute top-1 left-1 w-0.5 h-0.5 rounded-full bg-[#111] shadow-[0_0_1px_rgba(255,255,255,0.2)]"></div>
                    <div className="absolute top-1 right-1 w-0.5 h-0.5 rounded-full bg-[#111] shadow-[0_0_1px_rgba(255,255,255,0.2)]"></div>
                    <div className="absolute bottom-1 left-1 w-0.5 h-0.5 rounded-full bg-[#111] shadow-[0_0_1px_rgba(255,255,255,0.2)]"></div>
                    <div className="absolute bottom-1 right-1 w-0.5 h-0.5 rounded-full bg-[#111] shadow-[0_0_1px_rgba(255,255,255,0.2)]"></div>

                    {/* Inner Bezel/Screen Container */}
                    <div style={{
                        background: "#111",
                        padding: "8px 12px",
                        border: "2px solid #2a2a2a",
                        borderBottomColor: "#3a3a3a",
                        borderRightColor: "#3a3a3a",
                        borderTopColor: "#1a1a1a",
                        borderLeftColor: "#1a1a1a",
                        boxShadow: "inset 0 0 15px rgba(0,0,0,0.9)"
                    }}>
                        {/* Matrix LED Display - 6 Digits with 5x7 grid per digit */}
                        <div style={{
                            display: "flex",
                            gap: "4px",
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
                                        gap: "1px",
                                        padding: "1px"
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
                                            
                                            return (
                                                <div
                                                    key={i}
                                                    style={{
                                                        width: "3px",
                                                        height: "3px",
                                                        background: bg,
                                                        borderRadius: "0px", // Square pixels
                                                        boxShadow: isLit ? `0 0 2px ${litColor}` : "none",
                                                        animation: isLit && !isLeadingZero ? "led-pulse 2s infinite ease-in-out" : "none"
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>

                    {/* StatTrak Label Plate */}
                    <div style={{
                        marginTop: "4px",
                        background: `
                            repeating-linear-gradient(
                                45deg,
                                rgba(0,0,0,0.1) 0px,
                                rgba(0,0,0,0.1) 1px,
                                transparent 1px,
                                transparent 2px
                            ),
                            linear-gradient(to bottom, #888 0%, #555 100%)
                        `,
                        padding: "2px 6px",
                        borderRadius: "1px",
                        border: "1px solid #333",
                        width: "fit-content",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.4)"
                    }}>
                        <div style={{
                            fontSize: "9px",
                            color: "#eee",
                            fontWeight: "bold",
                            fontStyle: "italic",
                            fontFamily: "sans-serif",
                            textShadow: "0 1px 1px rgba(0,0,0,0.8)",
                            letterSpacing: "0.5px"
                        }}>
                            StatTrak™
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}

