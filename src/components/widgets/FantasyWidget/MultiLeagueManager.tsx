// src/MultiLeagueManager.tsx

import { useState, useEffect } from 'react'; // Must import useEffect
import { useLeagueData } from './useLeagueData';
import { CompactLeagueDisplay } from './CompactLeagueDisplay';
import { motion, AnimatePresence } from 'framer-motion';

// --- Main Parent Component ---
interface MultiLeagueManagerProps {
    leagueIds: string[];
    userId?: string; 
    // New optional prop for interval time (defaults to 5000ms)
    cycleInterval?: number;
    disableAnimation?: boolean;
}

export function MultiLeagueManager({ leagueIds, userId, cycleInterval = 30000, disableAnimation = false }: MultiLeagueManagerProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const activeLeagueId = leagueIds[activeIndex];

    const activeLeagueData = useLeagueData(activeLeagueId, userId); 

    // --- Core Logic to Cycle to the Next League ---
    const cycleNext = () => {
        // Uses functional update to ensure we always have the latest state of activeIndex
        setActiveIndex(prevIndex => (prevIndex + 1) % leagueIds.length);
    };

    // --- 1. Automatic Cycle Timer Implementation ---
    useEffect(() => {
        // Only start the timer if there's more than one league to cycle through
        if (leagueIds.length > 1) {
            const timer = setInterval(() => {
                cycleNext();
            }, cycleInterval);

            // Cleanup function: This is critical to prevent memory leaks!
            return () => clearInterval(timer);
        }
    }, [leagueIds.length, cycleInterval]); // Depend on cycleInterval and array length

    // --- 2. Manual Cycle Handler (Click) ---
    const handleClick = () => {
        cycleNext();
    };

    // --- Framer Motion Transition Variants ---
    const variants = {
        enter: { opacity: 0, x: 200, scale: 0.95 },
        center: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: -200, scale: 0.95 },
    };

    return (
        <div className="flex flex-col items-center justify-center">
            
            {/* The single tile container */}
            <div 
                className="w-full max-w-sm h-[350px] cursor-pointer relative" 
                onClick={handleClick}
            >
                {disableAnimation ? (
                    <div className="absolute inset-0">
                        <CompactLeagueDisplay data={activeLeagueData} />
                    </div>
                ) : (
                    <AnimatePresence initial={false} mode="wait">
                        <motion.div
                            key={activeLeagueId}
                            className="absolute inset-0"
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                        >
                            <CompactLeagueDisplay data={activeLeagueData} />
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}