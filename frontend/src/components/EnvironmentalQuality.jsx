import React, { useState } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Label,
} from "recharts";
import {
    Wind,
    CloudRain,
    TrendingUp,
    TrendingDown,
    Minus,
    Leaf,
} from "lucide-react";
import WeatherSticker from "./WeatherSticker";

const ChartTooltip = ({ active: isActive, payload, label, unit }) => {
    if (isActive && payload?.length) {
        return (
            <div
                style={{ background: "#0f172a", border: "1px solid #334155" }}
                className="p-3 rounded-xl shadow-2xl"
            >
                <p className="text-xs font-bold text-slate-400 mb-1">{label}</p>
                <p className="text-lg font-black text-white">
                    {payload[0].value}
                    <span className="text-sm font-normal text-slate-400 ml-1">
                        {unit}
                    </span>
                </p>
            </div>
        );
    }
    return null;
};

const getComparisons = (dataHistory, key) => {
    if (!dataHistory || dataHistory.length < 2)
        return { hourAgo: null, dayAgo: null };
    const current = dataHistory[dataHistory.length - 1]?.[key];
    if (current === undefined) return { hourAgo: null, dayAgo: null };
    const hourIdx = Math.max(0, dataHistory.length - 360);
    const fmt = (curr, prev) => {
        if (prev == null) return null;
        const diff = parseFloat((curr - prev).toFixed(1));
        return {
            diff,
            prev: typeof prev === "number" ? prev.toFixed(1) : prev,
        };
    };
    return {
        hourAgo: fmt(current, dataHistory[hourIdx]?.[key]),
        dayAgo: fmt(current, dataHistory[0]?.[key]),
    };
};

const getAQILevel = (ppm) => {
    if (ppm <= 50)
        return {
            label: "Good",
            color: "#10b981",
            desc: "Air quality is satisfactory",
        };
    if (ppm <= 100)
        return {
            label: "Moderate",
            color: "#84cc16",
            desc: "Acceptable air quality",
        };
    if (ppm <= 150)
        return {
            label: "Unhealthy*",
            color: "#f59e0b",
            desc: "Sensitive groups at risk",
        };
    if (ppm <= 200)
        return {
            label: "Unhealthy",
            color: "#f97316",
            desc: "Everyone may be affected",
        };
    if (ppm <= 300)
        return {
            label: "Very Unhealthy",
            color: "#ef4444",
            desc: "Health alert",
        };
    return {
        label: "Hazardous",
        color: "#7c3aed",
        desc: "Emergency conditions",
    };
};

const aqiLevels = [
    { name: "Good", range: "0–50", color: "#10b981" },
    { name: "Moderate", range: "51–100", color: "#84cc16" },
    { name: "Unhealthy*", range: "101–150", color: "#f59e0b" },
    { name: "Unhealthy", range: "151–200", color: "#f97316" },
    { name: "V.Unhealthy", range: "201–300", color: "#ef4444" },
    { name: "Hazardous", range: "300+", color: "#7c3aed" },
];

const EnvironmentalQuality = ({ dataHistory, currentReading, isDark }) => {
    const [activeTab, setActiveTab] = useState("airQuality");
    const axisColor = isDark ? "#475569" : "#94a3b8";
    const gridColor = isDark ? "#0f172a" : "#f1f5f9";

    const getStats = (key) => {
        if (!dataHistory?.length)
            return { max: "--", min: "--", avg: "--", trend: 0 };
        const values = dataHistory
            .map((d) => d[key])
            .filter((v) => typeof v === "number");
        if (!values.length)
            return { max: "--", min: "--", avg: "--", trend: 0 };
        return {
            max: Math.max(...values),
            min: Math.min(...values),
            avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1),
            trend:
                values.length > 1
                    ? values[values.length - 1] - values[values.length - 2]
                    : 0,
        };
    };

    const tabs = [
        {
            id: "airQuality",
            label: "Air Quality",
            icon: Wind,
            color: "#10b981",
            unit: " PPM",
            dataKey: "airQuality",
            rangeMin: 0,
            rangeMax: 500,
            stats: getStats("airQuality"),
            comp: getComparisons(dataHistory, "airQuality"),
        },
    ];
    const active = tabs.find((t) => t.id === activeTab);
    const aqLevel = currentReading
        ? getAQILevel(currentReading.airQuality)
        : { label: "--", color: "#475569", desc: "" };

    const TrendIcon = ({ value }) => {
        if (value > 0)
            return <TrendingUp size={18} className="text-emerald-400" />;
        if (value < 0)
            return <TrendingDown size={18} className="text-red-400" />;
        return <Minus size={18} className="text-slate-600" />;
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-emerald-500/10">
                        <Leaf size={28} className="text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black dark:text-white tracking-tight">
                            Environmental Quality
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Air Quality & Rainfall analysis
                        </p>
                    </div>
                </div>
            </header>

            <WeatherSticker
                temp={currentReading?.temp}
                rain={currentReading?.rain}
                humidity={currentReading?.humidity}
            />

            {/* AQI banner */}
            <div
                className="rounded-3xl p-5 mb-8 border flex items-center justify-between"
                style={{
                    background: `linear-gradient(135deg, ${aqLevel.color}15, ${aqLevel.color}05)`,
                    borderColor: `${aqLevel.color}40`,
                }}
            >
                <div>
                    <p
                        className="text-xs font-black uppercase tracking-widest mb-1"
                        style={{ color: aqLevel.color }}
                    >
                        Air Quality Status
                    </p>
                    <p
                        className="text-3xl font-black text-white"
                        style={{ textShadow: `0 0 20px ${aqLevel.color}60` }}
                    >
                        {aqLevel.label}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                        {aqLevel.desc}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium mb-1">
                        Current AQI
                    </p>
                    <p
                        className="text-4xl font-black"
                        style={{
                            color: aqLevel.color,
                            textShadow: `0 0 20px ${aqLevel.color}60`,
                        }}
                    >
                        {currentReading?.airQuality ?? "--"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        PPM ·{" "}
                        {currentReading?.rain === 1 ? "🌧️ Raining" : "☀️ Dry"}
                    </p>
                </div>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const fillPct = Math.min(
                        Math.max(
                            (((currentReading?.[tab.dataKey] ?? tab.rangeMin) -
                                tab.rangeMin) /
                                (tab.rangeMax - tab.rangeMin)) *
                                100,
                            0,
                        ),
                        100,
                    );
                    const cardBg = isDark
                        ? isActive
                            ? `linear-gradient(135deg, ${tab.color}18, ${tab.color}06)`
                            : "#0f172a"
                        : isActive
                          ? `linear-gradient(135deg, ${tab.color}12, ${tab.color}04)`
                          : "#ffffff";
                    const cardBorder = isDark
                        ? isActive
                            ? `${tab.color}60`
                            : "#1e293b"
                        : isActive
                          ? `${tab.color}50`
                          : "#e2e8f0";
                    const statBg = isDark
                        ? "rgba(30,41,59,0.6)"
                        : "rgba(241,245,249,0.8)";
                    const statBorder = isDark
                        ? "rgba(51,65,85,0.4)"
                        : "rgba(226,232,240,0.8)";
                    const compBg = isDark ? "#080f1a" : "#f8fafc";
                    const compBorder = isDark ? "#1e293b" : "#e2e8f0";
                    const valueColor = isDark ? "white" : "#0f172a";
                    return (
                        <div
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="cursor-pointer rounded-3xl p-6 border transition-all duration-300 relative overflow-hidden group"
                            style={{
                                background: cardBg,
                                borderColor: cardBorder,
                                boxShadow: isActive
                                    ? `0 0 40px ${tab.color}20, inset 0 0 40px ${tab.color}08`
                                    : "none",
                            }}
                        >
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
                                style={{
                                    background: `radial-gradient(circle at 70% 50%, ${tab.color}12, transparent 70%)`,
                                }}
                            />

                            <div className="flex items-start justify-between mb-6 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="p-3 rounded-2xl transition-all duration-300"
                                        style={{
                                            backgroundColor: `${tab.color}25`,
                                            color: tab.color,
                                            boxShadow: isActive
                                                ? `0 0 20px ${tab.color}40`
                                                : "none",
                                        }}
                                    >
                                        <tab.icon size={24} />
                                    </div>
                                    <div>
                                        <p
                                            className="text-xs font-black uppercase tracking-widest"
                                            style={{ color: tab.color }}
                                        >
                                            {tab.label}
                                        </p>
                                        <p
                                            className="text-[10px] font-medium uppercase tracking-wider"
                                            style={{
                                                color: isDark
                                                    ? "#64748b"
                                                    : "#94a3b8",
                                            }}
                                        >
                                            {tab.dataKey}
                                        </p>
                                    </div>
                                </div>
                                <TrendIcon value={tab.stats.trend} />
                            </div>

                            <div className="relative z-10 mb-3 flex items-baseline gap-2">
                                <span
                                    className="font-black tracking-tighter"
                                    style={{
                                        fontSize: "clamp(2.8rem, 5vw, 4.5rem)",
                                        color: valueColor,
                                        textShadow: isActive
                                            ? `0 0 30px ${tab.color}60`
                                            : "none",
                                    }}
                                >
                                    {currentReading?.[tab.dataKey] ?? "--"}
                                </span>
                                <span
                                    className="font-bold text-xl"
                                    style={{ color: tab.color }}
                                >
                                    {tab.unit.trim()}
                                </span>
                            </div>

                            <div
                                className="relative z-10 mb-6 h-1.5 rounded-full overflow-hidden"
                                style={{
                                    backgroundColor: isDark
                                        ? "#1e293b"
                                        : "#e2e8f0",
                                }}
                            >
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${fillPct}%`,
                                        background: `linear-gradient(90deg, ${tab.color}60, ${tab.color})`,
                                        boxShadow: `0 0 10px ${tab.color}`,
                                    }}
                                />
                            </div>

                            <div className="relative z-10 grid grid-cols-3 gap-3 mb-4">
                                {[
                                    {
                                        label: "MAX",
                                        value: tab.stats.max,
                                        color: "#10b981",
                                    },
                                    {
                                        label: "MIN",
                                        value: tab.stats.min,
                                        color: "#f97316",
                                    },
                                    {
                                        label: "AVG",
                                        value: tab.stats.avg,
                                        color: "#38bdf8",
                                    },
                                ].map((s) => (
                                    <div
                                        key={s.label}
                                        className="text-center p-2.5 rounded-2xl border"
                                        style={{
                                            backgroundColor: statBg,
                                            borderColor: statBorder,
                                        }}
                                    >
                                        <p
                                            className="text-[9px] font-black uppercase tracking-widest mb-1.5"
                                            style={{ color: s.color }}
                                        >
                                            {s.label}
                                        </p>
                                        <p
                                            className="text-sm font-black"
                                            style={{ color: valueColor }}
                                        >
                                            {s.value}
                                            {typeof s.value === "number"
                                                ? tab.unit.trim()
                                                : ""}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="relative z-10 grid grid-cols-2 gap-3">
                                {[
                                    {
                                        label: "VS 1 HOUR AGO",
                                        data: tab.comp.hourAgo,
                                    },
                                    {
                                        label: "VS SESSION START",
                                        data: tab.comp.dayAgo,
                                    },
                                ].map((c) => (
                                    <div
                                        key={c.label}
                                        className="p-3 rounded-2xl border text-center"
                                        style={{
                                            backgroundColor: compBg,
                                            borderColor: compBorder,
                                        }}
                                    >
                                        <p
                                            className="text-[9px] font-black uppercase tracking-widest mb-2"
                                            style={{
                                                color: isDark
                                                    ? "#475569"
                                                    : "#94a3b8",
                                            }}
                                        >
                                            {c.label}
                                        </p>
                                        {c.data ? (
                                            <>
                                                <p
                                                    className="text-base font-black"
                                                    style={{
                                                        color:
                                                            c.data.diff > 0
                                                                ? "#10b981"
                                                                : c.data.diff <
                                                                    0
                                                                  ? "#f97316"
                                                                  : "#94a3b8",
                                                    }}
                                                >
                                                    {c.data.diff > 0
                                                        ? "↑"
                                                        : c.data.diff < 0
                                                          ? "↓"
                                                          : "→"}{" "}
                                                    {Math.abs(c.data.diff)}
                                                    {tab.unit.trim()}
                                                </p>
                                                <p
                                                    className="text-[10px] mt-1"
                                                    style={{
                                                        color: isDark
                                                            ? "#475569"
                                                            : "#94a3b8",
                                                    }}
                                                >
                                                    was {c.data.prev}
                                                    {tab.unit.trim()}
                                                </p>
                                            </>
                                        ) : (
                                            <p
                                                className="text-xs"
                                                style={{
                                                    color: isDark
                                                        ? "#334155"
                                                        : "#cbd5e1",
                                                }}
                                            >
                                                Not enough data
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
                {/* Digital Rain card */}
                <div
                    className={`rounded-3xl p-6 border transition-all duration-300 relative overflow-hidden`}
                    style={{
                        background:
                            currentReading?.rain === 1
                                ? isDark
                                    ? "linear-gradient(135deg, #0ea5e918, #0ea5e906)"
                                    : "linear-gradient(135deg, #0ea5e912, #0ea5e904)"
                                : isDark
                                  ? "#0f172a"
                                  : "#ffffff",
                        borderColor:
                            currentReading?.rain === 1
                                ? "#0ea5e960"
                                : isDark
                                  ? "#1e293b"
                                  : "#e2e8f0",
                    }}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div
                            className="p-3 rounded-2xl"
                            style={{
                                backgroundColor:
                                    currentReading?.rain === 1
                                        ? "#0ea5e925"
                                        : "#64748b25",
                                color:
                                    currentReading?.rain === 1
                                        ? "#0ea5e9"
                                        : "#64748b",
                            }}
                        >
                            <CloudRain size={24} />
                        </div>
                        <div>
                            <p
                                className="text-xs font-black uppercase tracking-widest"
                                style={{
                                    color:
                                        currentReading?.rain === 1
                                            ? "#0ea5e9"
                                            : "#64748b",
                                }}
                            >
                                Rain
                            </p>
                            <p
                                className="text-[10px] font-medium uppercase tracking-wider"
                                style={{
                                    color: isDark ? "#64748b" : "#94a3b8",
                                }}
                            >
                                Digital sensor · DO pin
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-center py-6 gap-4">
                        <span className="text-7xl select-none">
                            {currentReading?.rain === 1 ? "🌧️" : "☀️"}
                        </span>
                        <div
                            className={`px-6 py-2.5 rounded-full text-sm font-black uppercase tracking-widest border`}
                            style={{
                                backgroundColor:
                                    currentReading?.rain === 1
                                        ? "#0ea5e915"
                                        : "#10b98115",
                                color:
                                    currentReading?.rain === 1
                                        ? "#0ea5e9"
                                        : "#10b981",
                                borderColor:
                                    currentReading?.rain === 1
                                        ? "#0ea5e940"
                                        : "#10b98140",
                            }}
                        >
                            {currentReading?.rain === 1
                                ? "Rain Detected"
                                : "Dry Conditions"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div
                className="rounded-3xl p-6 border mb-6"
                style={{
                    background: isDark ? "#0f172a" : "#f8fafc",
                    borderColor: isDark ? "#1e293b" : "#e2e8f0",
                }}
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold dark:text-white text-slate-800">
                        {active.label} Trend{" "}
                        <span className="ml-2 text-xs font-normal text-slate-500">
                            ({dataHistory?.length ?? 0} readings)
                        </span>
                    </h3>
                    <div className="flex gap-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                                style={
                                    activeTab === tab.id
                                        ? {
                                              backgroundColor: active.color,
                                              color: "white",
                                              boxShadow: `0 0 12px ${active.color}60`,
                                          }
                                        : {
                                              backgroundColor: "#1e293b",
                                              color: "#64748b",
                                          }
                                }
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart
                        data={dataHistory}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient
                                id="envGrad"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor={active.color}
                                    stopOpacity={0.3}
                                />
                                <stop
                                    offset="95%"
                                    stopColor={active.color}
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={gridColor}
                            vertical={false}
                        />
                        <XAxis
                            dataKey="timestamp"
                            stroke={axisColor}
                            fontSize={10}
                            tickLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            stroke={axisColor}
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            domain={["auto", "auto"]}
                            width={45}
                        />
                        <Tooltip content={<ChartTooltip unit={active.unit} />} />
                        {active.stats.avg !== "--" && (
                            <ReferenceLine
                                y={Number(active.stats.avg)}
                                stroke={active.color}
                                strokeDasharray="4 4"
                                strokeOpacity={0.4}
                            >
                                <Label
                                    value="AVG"
                                    position="insideTopRight"
                                    fill={active.color}
                                    fontSize={9}
                                    opacity={0.7}
                                />
                            </ReferenceLine>
                        )}
                        <Area
                            type="monotone"
                            dataKey={active.dataKey}
                            stroke={active.color}
                            strokeWidth={2.5}
                            fill="url(#envGrad)"
                            dot={false}
                            activeDot={{ r: 5, fill: active.color }}
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* AQI scale */}
            {activeTab === "airQuality" && (
                <div
                    className="rounded-3xl p-6 border"
                    style={{
                        background: isDark ? "#0f172a" : "#f8fafc",
                        borderColor: isDark ? "#1e293b" : "#e2e8f0",
                    }}
                >
                    <h3 className="font-bold dark:text-white text-slate-800 mb-4">
                        AQI Scale Reference
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        {aqiLevels.map((level) => (
                            <div
                                key={level.name}
                                className="text-center p-3 rounded-2xl border"
                                style={{
                                    backgroundColor: `${level.color}12`,
                                    borderColor: `${level.color}30`,
                                }}
                            >
                                <div
                                    className="w-3 h-3 rounded-full mx-auto mb-2"
                                    style={{
                                        backgroundColor: level.color,
                                        boxShadow: `0 0 8px ${level.color}`,
                                    }}
                                />
                                <p
                                    className="text-xs font-black"
                                    style={{ color: level.color }}
                                >
                                    {level.name}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-1">
                                    {level.range}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnvironmentalQuality;
