import { useEffect, useState } from "react";

import { motion } from "framer-motion";

interface TopBarProps {
    zipcode: string;
}

interface WeatherData {
    temperature: number;
    condition: string;
}

interface LocationData {
    timezone: string;
    city: string;
    state: string;
}

const getWeatherEmoji = (condition: string): string => {
    const cond = condition.toLowerCase();
    if (cond.includes("clear") || cond.includes("sunny")) return "☀️";
    if (cond.includes("cloud")) return "☁️";
    if (cond.includes("rain") || cond.includes("drizzle")) return "🌧️";
    if (cond.includes("thunder") || cond.includes("storm")) return "⛈️";
    if (cond.includes("snow")) return "❄️";
    if (cond.includes("fog") || cond.includes("mist")) return "🌫️";
    if (cond.includes("wind")) return "💨";
    if (cond.includes("partly")) return "⛅";
    return "🌤️";
};

export default function TopBar({ zipcode }: TopBarProps) {
    const [now, setNow] = useState(new Date());
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [location, setLocation] = useState<LocationData | null>(null);

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                // Use a free geocoding service to convert zip to lat/lon
                const zipResponse = await fetch(
                    `https://api.zippopotam.us/us/${zipcode}`
                );
                
                if (!zipResponse.ok) {
                    console.error("Invalid zipcode");
                    return;
                }
                
                const zipData = await zipResponse.json();
                const lat = zipData.places[0].latitude;
                const lon = zipData.places[0].longitude;
                
                // Store location data including timezone
                setLocation({
                    timezone: zipData.places[0]['timezone'] || 'America/New_York',
                    city: zipData.places[0]['place name'],
                    state: zipData.places[0]['state abbreviation']
                });
                
                // Get weather station points from weather.gov
                const pointsResponse = await fetch(
                    `https://api.weather.gov/points/${lat},${lon}`
                );
                
                if (!pointsResponse.ok) {
                    console.error("Could not get weather station");
                    return;
                }
                
                const pointsData = await pointsResponse.json();
                const forecastUrl = pointsData.properties.forecastHourly;
                
                // Get current weather from forecast
                const weatherResponse = await fetch(forecastUrl);
                
                if (weatherResponse.ok) {
                    const weatherData = await weatherResponse.json();
                    const current = weatherData.properties.periods[0];
                    
                    setWeather({
                        temperature: current.temperature,
                        condition: current.shortForecast,
                    });
                }
            } catch (error) {
                console.error("Error fetching weather:", error);
            }
        };

        if (zipcode) {
            fetchWeather();
            // Refresh weather every 10 minutes
            const interval = setInterval(fetchWeather, 600000);
            return () => clearInterval(interval);
        }
    }, [zipcode]);

    const timeZone = location?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const getDaysUntilChristmas = () => {
        const nowInTz = new Date(now.toLocaleString("en-US", { timeZone }));
        const month = nowInTz.getMonth();
        
        // Show only in Nov (10), Dec (11), or Jan (0)
        if (month === 10 || month === 11 || month === 0) {
             const currentYear = nowInTz.getFullYear();
             // Create Christmas date object (using local time construction to match nowInTz which is "shifted" to local)
             let christmas = new Date(currentYear, 11, 25);
             
             if (nowInTz > christmas) {
                 christmas = new Date(currentYear + 1, 11, 25);
             }
             
             const timeDiff = christmas.getTime() - nowInTz.getTime();
             return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        }
        return null;
    };

    const daysUntilChristmas = getDaysUntilChristmas();

    const dateStr = now.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: timeZone,
    });
    const timeStr = now.toLocaleTimeString([], { 
        hour: "numeric", 
        minute: "2-digit",
        timeZone: timeZone,
    });

    return (
        <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-4 p-4 rounded-2xl bg-white/10 backdrop-blur-lg flex justify-between items-center shadow-lg border border-white/20"
        >
            <div className="flex items-center gap-4">
                <div className="text-gray-200 text-lg">{dateStr}</div>
                {daysUntilChristmas !== null && (
                    <div 
                        className="flex items-center gap-2 font-bold border-l border-white/20 pl-4"
                        style={{ color: '#4ade80' }}
                    >
                        <span>🎄</span>
                        <span>{daysUntilChristmas === 0 ? "Merry Christmas!" : `${daysUntilChristmas} days`}</span>
                    </div>
                )}
            </div>
            <div className="text-3xl font-bold text-white tracking-tight">{timeStr}</div>
            <div className="flex items-center gap-2 text-gray-200">
                {weather ? (
                    <>
                        {getWeatherEmoji(weather.condition)} <span>{weather.temperature}°F</span>
                    </>
                ) : (
                    <span>Loading...</span>
                )}
            </div>
        </motion.header>
    );
}

