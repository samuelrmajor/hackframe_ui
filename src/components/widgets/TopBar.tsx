import { useEffect, useState } from "react";

import { motion } from "framer-motion";

interface TopBarProps {
    zipcode: string;
}

interface WeatherData {
    temperature: number;
    condition: string;
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

