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
    Gauge,
    Mountain,
    TrendingUp,
    TrendingDown,
    Minus,
    Wind,
} from "lucide-react";
import WeatherSticker from "./Weathersticker";

const ChartTooltip = ({ active: isActive, payload, label, unit, background, border }) => {
    if (isActive && payload?.length) {
        return (
            <div
                style={{ background, border: `1px solid ${border}` }}
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

const AtmosphericDynamics = ({ dataHistory, currentReading, isDark }) => {
    const [activeTab, setActiveTab] = useState("pressure");

    const axisColor = isDark ? "#475569" : "#94a3b8";
    const gridColor = isDark ? "#0f172a" : "#f1f5f9";
    const tooltipBg = "#0f172a";
    const tooltipBorder = "#334155";

    const getStats = (key) => {
        if (!dataHistory || dataHistory.length === 0)
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
            id: "pressure",
            label: "Pressure",
            icon: Gauge,
            color: "#8b5cf6",
            unit: " hPa",
            dataKey: "pressure",
            rangeMin: 900,
            rangeMax: 1050,
            stats: getStats("pressure"),
            comp: getComparisons(dataHistory, "pressure"),
        },
        {
            id: "altitude",
            label: "Altitude",
            icon: Mountain,
            color: "#ec4899",
            unit: " m",
            dataKey: "altitude",
            rangeMin: 0,
            rangeMax: 1000,
            stats: getStats("altitude"),
            comp: getComparisons(dataHistory, "altitude"),
        },
    ];
    const active = tabs.find((t) => t.id === activeTab);

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
                    <div className="p-2 rounded-xl bg-violet-500/10">
                        <Wind size={28} className="text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black dark:text-white tracking-tight">
                            Atmospheric Dynamics
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Pressure & Altitude analysis
                        </p>
                    </div>
                </div>
            </header>

            <WeatherSticker
                temp={currentReading?.temp}
                rain={currentReading?.rain}
                humidity={currentReading?.humidity}
            />

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
            </div>

            {/* Chart */}
            <div
                className="rounded-3xl p-6 border"
                style={{
                    background: isDark ? "#0f172a" : "#f8fafc",
                    borderColor: isDark ? "#1e293b" : "#e2e8f0",
                }}
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold dark:text-white text-slate-800">
                        {active.label} Trend
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
                                id="atmGrad"
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
                            tickFormatter={(v) => `${v}`}
                            width={50}
                        />
                        <Tooltip
                            content={
                                <ChartTooltip
                                    unit={active.unit}
                                    background={tooltipBg}
                                    border={tooltipBorder}
                                />
                            }
                        />
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
                            fill="url(#atmGrad)"
                            dot={false}
                            activeDot={{ r: 5, fill: active.color }}
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AtmosphericDynamics;
