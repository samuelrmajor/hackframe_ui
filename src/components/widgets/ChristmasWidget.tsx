import { useEffect, useState } from "react";
import Card from "./Card";

interface ChristmasWidgetProps {
  zipcode?: string;
}

export default function ChristmasWidget({ zipcode = "10001" }: ChristmasWidgetProps) {
  const [daysUntilChristmas, setDaysUntilChristmas] = useState(0);
  const [timezone, setTimezone] = useState<string>("America/New_York");

  // Fetch timezone based on zipcode
  useEffect(() => {
    const fetchTimezone = async () => {
      try {
        // Using Zippopotam.us API to get location info from zipcode
        const response = await fetch(`https://api.zippopotam.us/us/${zipcode}`);
        if (!response.ok) {
          console.warn(`Failed to fetch timezone for zipcode ${zipcode}`);
          return;
        }
        
        const data = await response.json();
        const lat = data.places[0].latitude;
        const lon = data.places[0].longitude;
        
        // Use TimeAPI to get timezone from coordinates
        const tzResponse = await fetch(`https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lon}`);
        if (tzResponse.ok) {
          const tzData = await tzResponse.json();
          setTimezone(tzData.timeZone || "America/New_York");
        }
      } catch (error) {
        console.error("Error fetching timezone:", error);
      }
    };

    if (zipcode) {
      fetchTimezone();
    }
  }, [zipcode]);

  useEffect(() => {
    const calculateDaysUntilChristmas = () => {
      // Get current date in the specified timezone
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
      const now = new Date();
      const nowInTz = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
      
      // Get tomorrow at midnight in the target timezone
      const tomorrow = new Date(nowInTz);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      // Calculate milliseconds until midnight in that timezone
      const msUntilMidnight = tomorrow.getTime() - nowInTz.getTime();
      return msUntilMidnight > 0 ? msUntilMidnight : 1000; // At least 1 second
    };
    
    const scheduleNextUpdate = () => {
      const timeUntilMidnight = calculateTimeUntilMidnight();
      
      return setTimeout(() => {
        calculateDaysUntilChristmas();
        // Schedule the next update
        const interval = scheduleNextUpdate();
        return () => clearTimeout(interval);
      }, timeUntilMidnight);
    };
    
    const timeout = scheduleNextUpdate();

    return () => clearTimeout(timeout);
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

