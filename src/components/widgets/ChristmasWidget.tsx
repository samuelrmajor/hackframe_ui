import { useEffect, useState } from "react";
import Card from "./Card";

interface ChristmasWidgetProps {
  timezone?: string; // e.g., "America/New_York"
}

export default function ChristmasWidget({ timezone = "America/New_York" }: ChristmasWidgetProps) {
  const [daysUntilChristmas, setDaysUntilChristmas] = useState(0);

  useEffect(() => {
    const calculateDaysUntilChristmas = () => {
      // Get current time in specified timezone
      const today = new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
      const currentYear = today.getFullYear();
      let christmas = new Date(currentYear, 11, 25); // December 25th
      
      // If Christmas has passed this year, calculate for next year
      if (today > christmas) {
        christmas = new Date(currentYear + 1, 11, 25);
      }
      
      const timeDiff = christmas.getTime() - today.getTime();
      const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      setDaysUntilChristmas(days);
    };

    calculateDaysUntilChristmas();
    
    // Calculate time until midnight in the specified timezone
    const calculateTimeUntilMidnight = () => {
      const nowInTz = new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
      
      // Get tomorrow at midnight in the target timezone
      const tomorrow = new Date(nowInTz);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      // Calculate milliseconds until midnight in that timezone
      const msUntilMidnight = tomorrow.getTime() - nowInTz.getTime();
      return msUntilMidnight > 0 ? msUntilMidnight : 1000; // At least 1 second
    };
    
    let timeoutId: number | undefined;
    
    const scheduleNextUpdate = () => {
      const timeUntilMidnight = calculateTimeUntilMidnight();
      
      timeoutId = setTimeout(() => {
        calculateDaysUntilChristmas();
        // Schedule the next update
        scheduleNextUpdate();
      }, timeUntilMidnight);
    };
    
    scheduleNextUpdate();

    return () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, [timezone]);

  return (
    <Card>
      <div className="text-red-400 text-sm mb-1 font-semibold">🎄 Days Until Christmas 🎄</div>
      <div className="text-green-400 text-6xl font-bold drop-shadow-lg">{daysUntilChristmas}</div>
      <div className="text-red-300 text-sm mt-2 font-medium">
        {daysUntilChristmas === 0 ? "Merry Christmas! 🎅🎁" : "days to go 🎅"}
      </div>
    </Card>
  );
}

