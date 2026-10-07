import React from "react";
import {
    Thermometer,
    Droplets,
    Wind,
    Gauge,
    Mountain,
    CloudRain,
    Activity,
} from "lucide-react";
import WeatherSticker from "./Weathersticker";

// ── Circular gauge — pure SVG, no needle ─────────────────────────────────────
const CircularGauge = ({ value, min, max, unit, color, size = 180 }) => {
    const radius = 70;
    const stroke = 12;
    const cx = size / 2;
    const cy = size / 2;

    const startAngle = 135;
    const endAngle = 405;
    const sweep = endAngle - startAngle;

    const toRad = (deg) => (deg * Math.PI) / 180;
    const polarToXY = (angle, r) => ({
        x: cx + r * Math.cos(toRad(angle)),
        y: cy + r * Math.sin(toRad(angle)),
    });

    const describeArc = (a1, a2) => {
        const s = polarToXY(a1, radius);
        const e = polarToXY(a2, radius);
        const large = a2 - a1 > 180 ? 1 : 0;
        return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
    };

    const pct =
        typeof value === "number"
            ? Math.min(Math.max((value - min) / (max - min), 0), 1)
            : 0;
    const fillAngle = startAngle + pct * sweep;

    const displayValue =
        typeof value === "number"
            ? value % 1 !== 0
                ? value.toFixed(1)
                : value
            : "--";

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="overflow-visible"
        >
            {/* Track */}
            <path
                d={describeArc(startAngle, endAngle - 0.01)}
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                strokeLinecap="round"
                className="text-slate-100 dark:text-slate-800"
            />

            {/* Filled arc */}
            {pct > 0 && (
                <path
                    d={describeArc(
                        startAngle,
                        Math.min(fillAngle, endAngle - 0.01),
                    )}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 8px ${color}90)` }}
                />
            )}

            {/* Dot at tip */}
            {pct > 0 && (
                <circle
                    cx={
                        polarToXY(Math.min(fillAngle, endAngle - 0.5), radius).x
                    }
                    cy={
                        polarToXY(Math.min(fillAngle, endAngle - 0.5), radius).y
                    }
                    r={stroke / 2 + 1}
                    fill={color}
                    style={{ filter: `drop-shadow(0 0 6px ${color})` }}
                />
            )}

            {/* Value */}
            <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="26"
                fontWeight="900"
                fill="currentColor"
                className="dark:fill-white fill-slate-800"
            >
                {displayValue}
            </text>

            {/* Unit */}
            <text
                x={cx}
                y={cy + 26}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill={color}
                opacity={0.9}
            >
                {unit}
            </text>

            {/* Min/Max */}
            <text
                x={polarToXY(startAngle, radius + 18).x}
                y={polarToXY(startAngle, radius + 18).y}
                textAnchor="middle"
                fontSize="9"
                fill="currentColor"
                className="fill-slate-400"
                fontWeight="600"
            >
                {min}
            </text>
            <text
                x={polarToXY(endAngle - 0.01, radius + 18).x}
                y={polarToXY(endAngle - 0.01, radius + 18).y}
                textAnchor="middle"
                fontSize="9"
                fill="currentColor"
                className="fill-slate-400"
                fontWeight="600"
            >
                {max}
            </text>
        </svg>
    );
};

// ── Gauge card ────────────────────────────────────────────────────────────────
const GaugeCard = ({
    title,
    value,
    unit,
    icon,
    color,
    subtext,
    dataKey,
    min,
    max,
    dataHistory,
}) => {
    const GaugeIcon = icon;
    const getStats = () => {
        if (!dataHistory || dataHistory.length === 0)
            return { max: "--", min: "--", avg: "--" };
        const values = dataHistory
            .map((d) => d[dataKey])
            .filter((v) => typeof v === "number");
        if (values.length === 0) return { max: "--", min: "--", avg: "--" };
        return {
            max: Math.max(...values),
            min: Math.min(...values),
            avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1),
        };
    };
    const stats = getStats();

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center gap-3 transition-all hover:shadow-2xl hover:-translate-y-1 duration-200">
            {/* Header */}
            <div className="w-full flex items-center gap-2">
                <div
                    className="p-2 rounded-xl"
                    style={{ backgroundColor: `${color}20`, color }}
                >
                    <GaugeIcon size={16} />
                </div>
                <div>
                    <p className="text-xs font-black dark:text-white uppercase tracking-wide leading-none">
                        {title}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                        {subtext}
                    </p>
                </div>
            </div>

            {/* Big gauge */}
            <CircularGauge
                value={value}
                min={min}
                max={max}
                unit={unit}
                color={color}
                size={180}
            />

            {/* Stats */}
            <div className="w-full grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-center">
                    <p className="text-[9px] font-bold text-emerald-500 uppercase mb-0.5">
                        Max
                    </p>
                    <p className="text-xs font-bold dark:text-white">
                        {stats.max}
                        {typeof stats.max === "number" ? unit : ""}
                    </p>
                </div>
                <div className="text-center border-x border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] font-bold text-orange-500 uppercase mb-0.5">
                        Min
                    </p>
                    <p className="text-xs font-bold dark:text-white">
                        {stats.min}
                        {typeof stats.min === "number" ? unit : ""}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-[9px] font-bold text-sky-500 uppercase mb-0.5">
                        Avg
                    </p>
                    <p className="text-xs font-bold dark:text-white">
                        {stats.avg}
                        {typeof stats.avg === "number" ? unit : ""}
                    </p>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
const LiveSummary = ({
    currentReading,
    activeStation,
    dataHistory,
    isDark,
}) => {
    if (!currentReading) {
        return (
            <div className="flex flex-col justify-center items-center h-96 text-slate-500 font-medium">
                <Activity className="animate-pulse mb-4" size={48} />
                <span>
                    Station {activeStation} is offline or initializing...
                </span>
            </div>
        );
    }

    const gauges = [
        {
            title: "Temperature",
            value: currentReading.temp,
            unit: "°C",
            icon: Thermometer,
            color: "#f97316",
            subtext: "Thermal",
            dataKey: "temp",
            min: 0,
            max: 50,
        },
        {
            title: "Humidity",
            value: currentReading.humidity,
            unit: "%",
            icon: Droplets,
            color: "#0ea5e9",
            subtext: "Atmospheric",
            dataKey: "humidity",
            min: 0,
            max: 100,
        },
        {
            title: "Pressure",
            value: currentReading.pressure,
            unit: "hPa",
            icon: Gauge,
            color: "#8b5cf6",
            subtext: "Barometric",
            dataKey: "pressure",
            min: 900,
            max: 1050,
        },
        {
            title: "Altitude",
            value: currentReading.altitude,
            unit: "m",
            icon: Mountain,
            color: "#ec4899",
            subtext: "Elevation",
            dataKey: "altitude",
            min: 0,
            max: 1000,
        },
        {
            title: "Air Quality",
            value: currentReading.airQuality,
            unit: "PPM",
            icon: Wind,
            color: "#10b981",
            subtext: "Environment",
            dataKey: "airQuality",
            min: 0,
            max: 500,
        },
    ];

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            {/* Header */}
            <header className="mb-8">
                <h1 className="text-4xl font-black dark:text-white tracking-tight">
                    SkyNet Live Summary
                </h1>
                <p className="text-slate-500 font-medium">
                    Instant telemetry · station {activeStation}
                </p>
            </header>

            {/* Weather sticker */}
            <div className="mb-10">
                <WeatherSticker
                    temp={currentReading.temp}
                    rain={currentReading.rain}
                    humidity={currentReading.humidity}
                    isDark={isDark}
                />
            </div>

            {/* Gauge grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {gauges
                    .filter((g) => g.title !== undefined)
                    .map((g) => (
                        <GaugeCard
                            key={g.dataKey}
                            {...g}
                            dataHistory={dataHistory}
                        />
                    ))}

                {/* Rain — digital yes/no card */}
                <div
                    className={`rounded-3xl p-6 border shadow-xl flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
                        currentReading.rain === 1
                            ? "border-blue-400/50 bg-blue-500/5"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    }`}
                >
                    <div className="w-full flex items-center gap-2">
                        <div
                            className="p-2 rounded-xl"
                            style={{
                                backgroundColor:
                                    currentReading.rain === 1
                                        ? "#0ea5e920"
                                        : "#64748b20",
                                color:
                                    currentReading.rain === 1
                                        ? "#0ea5e9"
                                        : "#64748b",
                            }}
                        >
                            <CloudRain size={16} />
                        </div>
                        <div>
                            <p className="text-xs font-black dark:text-white uppercase tracking-wide leading-none">
                                Rain
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                                Precipitation
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-3 py-4">
                        <span className="text-7xl select-none">
                            {currentReading.rain === 1 ? "🌧️" : "☀️"}
                        </span>
                        <div
                            className={`px-5 py-2 rounded-full text-sm font-black uppercase tracking-widest ${
                                currentReading.rain === 1
                                    ? "bg-blue-500/15 text-blue-400 border border-blue-400/30"
                                    : "bg-emerald-500/15 text-emerald-400 border border-emerald-400/30"
                            }`}
                        >
                            {currentReading.rain === 1
                                ? "Rain Detected"
                                : "Dry Conditions"}
                        </div>
                    </div>

                    <div className="w-full pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-[10px] text-slate-400 font-medium">
                            Digital sensor · DO pin
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-16 p-4 rounded-3xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-center">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Last Packet Received: {currentReading.timestamp}
                </p>
            </footer>
        </div>
    );
};

export default LiveSummary;
