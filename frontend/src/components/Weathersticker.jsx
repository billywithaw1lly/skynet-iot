import React from "react";

const WeatherSticker = ({ temp, rain, humidity }) => {
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour >= 20;

    // rain is now 1 (raining) or 0 (dry)
    let condition = "sunny";
    if (rain === 1) condition = "rainy";
    else if (humidity > 80) condition = "cloudy";
    else if (temp > 38) condition = "heat";
    else if (temp < 15) condition = "cold";
    else if (isNight) condition = "night";

    const stickers = {
        sunny: {
            bg: "from-amber-400 to-orange-500",
            emoji: "☀️",
            label: "Sunny",
            sublabel: "Clear skies",
            glow: "#f97316",
        },
        night: {
            bg: "from-slate-700 to-slate-900",
            emoji: "🌙",
            label: "Night",
            sublabel: "Good evening",
            glow: "#6366f1",
        },
        rainy: {
            bg: "from-blue-500 to-cyan-600",
            emoji: "🌧️",
            label: "Rainy",
            sublabel: "Heavy rainfall",
            glow: "#0ea5e9",
        },
        drizzle: {
            bg: "from-sky-400 to-blue-500",
            emoji: "🌦️",
            label: "Drizzle",
            sublabel: "Light rain",
            glow: "#38bdf8",
        },
        cloudy: {
            bg: "from-slate-400 to-slate-600",
            emoji: "☁️",
            label: "Cloudy",
            sublabel: "High humidity",
            glow: "#94a3b8",
        },
        heat: {
            bg: "from-red-500 to-orange-600",
            emoji: "🔥",
            label: "Heat Alert",
            sublabel: "Extreme heat",
            glow: "#ef4444",
        },
        cold: {
            bg: "from-cyan-400 to-blue-600",
            emoji: "❄️",
            label: "Cold",
            sublabel: "Low temperature",
            glow: "#60a5fa",
        },
    };

    const s = stickers[condition];

    return (
        <div
            className={`relative rounded-3xl bg-gradient-to-br ${s.bg} p-8 flex flex-col justify-between overflow-hidden mb-10`}
            style={{ minHeight: 200, boxShadow: `0 20px 60px ${s.glow}50` }}
        >
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20 blur-2xl bg-white" />
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">
                        STN-INDORE-04
                    </p>
                    <p className="text-white text-lg font-black">
                        {new Date().toLocaleDateString("en-GB", {
                            weekday: "long",
                        })}
                    </p>
                    <p className="text-white/70 text-sm font-medium">
                        {new Date().toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </p>
                </div>
                <span className="text-6xl drop-shadow-lg select-none">
                    {s.emoji}
                </span>
            </div>
            <div className="flex items-end justify-between mt-6">
                <div>
                    <p className="text-white text-6xl font-black tracking-tighter leading-none">
                        {temp ?? "--"}°
                    </p>
                    <p className="text-white/70 text-sm font-bold mt-1 uppercase tracking-widest">
                        {s.sublabel}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-white text-3xl font-black">{s.label}</p>
                    <p className="text-white/60 text-xs font-medium mt-1">
                        {rain === 1 ? "🌧️ Rain Detected" : "☀️ Dry"} · Hum{" "}
                        {humidity ?? "--"}%
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WeatherSticker;
