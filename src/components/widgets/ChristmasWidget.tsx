import { useEffect, useState } from "react";
import Card from "./Card";

export default function ChristmasWidget() {
  const [daysUntilChristmas, setDaysUntilChristmas] = useState(0);

  useEffect(() => {
    const calculateDaysUntilChristmas = () => {
      const today = new Date();
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
    // Update daily at midnight
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const timeout = setTimeout(() => {
      calculateDaysUntilChristmas();
      const interval = setInterval(calculateDaysUntilChristmas, 24 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }, timeUntilMidnight);

    return () => clearTimeout(timeout);
  }, []);

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

