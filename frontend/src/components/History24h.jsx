import React, { useRef, useState, useEffect } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    Label,
} from "recharts";
import {
    Thermometer,
    Droplets,
    Wind,
    Gauge,
    Mountain,
    ArrowUp,
    ArrowDown,
    Hash,
} from "lucide-react";

const History24h = ({ dataHistory, isDark, activeStation }) => {
    if (!dataHistory || dataHistory.length === 0) {
        return (
            <div className="flex justify-center items-center h-64 text-slate-500 font-medium">
                <span className="animate-pulse">
                    Loading 24h historical trends...
                </span>
            </div>
        );
    }

    // ── Time range display ────────────────────────────────────────────────────
    const getTimeRange = () => {
        if (dataHistory.length < 2)
            return { start: "--:--", end: "--:--", span: "0h 0m" };

        const start = dataHistory[0].timestamp;
        const end = dataHistory[dataHistory.length - 1].timestamp;

        const [h1, m1] = start.split(":").map(Number);
        const [h2, m2] = end.split(":").map(Number);

        let diff = h2 * 60 + m2 - (h1 * 60 + m1);
        if (diff < 0) diff += 1440; // handle midnight wrap

        return {
            start,
            end,
            span: `${Math.floor(diff / 60)}h ${diff % 60}m`,
        };
    };

    const timeInfo = getTimeRange();

    // ── AQI colour helper ─────────────────────────────────────────────────────
    const getAQIColor = (value) => {
        if (value <= 50) return "#00b050";
        if (value <= 100) return "#92d050";
        if (value <= 200) return "#ffff00";
        if (value <= 300) return "#ffc000";
        if (value <= 400) return "#ff0000";
        return "#c00000";
    };

    // ── Stats (max / min / avg) for a given data key ──────────────────────────
    // dataHistory items are already flattened so item[key] works directly
    const calculateStats = (key) => {
        const values = dataHistory
            .map((item) => item[key])
            .filter((v) => typeof v === "number");

        if (values.length === 0) return { max: "--", min: "--", avg: "--" };

        const max = Math.max(...values);
        const min = Math.min(...values);
        const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(
            1,
        );
        return { max, min, avg };
    };

    // ── Shared tooltip ────────────────────────────────────────────────────────
    const CustomTooltip = ({ active, payload, label, unit }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                        Time: {label}
                    </p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-white text-lg font-black">
                            {payload[0].value}
                        </span>
                        <span className="text-slate-400 text-xs font-bold">
                            {unit}
                        </span>
                    </div>
                </div>
            );
        }
        return null;
    };

    // ── Individual metric card with scrollable chart ──────────────────────────
    const MetricCard = ({ title, unit, icon, dataKey, color, isAQI }) => {
        const MetricIcon = icon;
        const scrollRef = useRef(null);
        const containerRef = useRef(null);
        const [isDragging, setIsDragging] = useState(false);
        const [startX, setStartX] = useState(0);
        const [scrollLeftPos, setScrollLeftPos] = useState(0);
        const [containerWidth, setContainerWidth] = useState(800);

        // Measure the card's actual pixel width so the chart can fill it
        useEffect(() => {
            if (!containerRef.current) return;
            const ro = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    setContainerWidth(entry.contentRect.width);
                }
            });
            ro.observe(containerRef.current);
            return () => ro.disconnect();
        }, []);

        const axisColor = isDark ? "#94a3b8" : "#64748b";
        const gridColor = isDark ? "#475569" : "#cbd5e1";
        const aqiLineColor = isDark ? "#f8fafc" : "#0f172a";

        const stats = calculateStats(dataKey);

        // Drag-to-scroll handlers
        const handleMouseDown = (e) => {
            setIsDragging(true);
            if (scrollRef.current) {
                setStartX(e.pageX - scrollRef.current.offsetLeft);
                setScrollLeftPos(scrollRef.current.scrollLeft);
            }
        };
        const handleMouseLeave = () => setIsDragging(false);
        const handleMouseUp = () => setIsDragging(false);
        const handleMouseMove = (e) => {
            if (!isDragging || !scrollRef.current) return;
            e.preventDefault();
            const x = e.pageX - scrollRef.current.offsetLeft;
            const walk = (x - startX) * 1.5;
            scrollRef.current.scrollLeft = scrollLeftPos - walk;
        };

        // Dot renderers
        const standardDot = {
            r: isDark ? 3 : 4,
            fill: isDark ? "#0f172a" : "#ffffff",
            stroke: color,
            strokeWidth: 2,
        };

        const aqiDot = (props) => {
            const { cx, cy, payload } = props;
            const dotColor = getAQIColor(payload[dataKey]);
            return (
                <circle
                    cx={cx}
                    cy={cy}
                    r={isDark ? 3 : 5}
                    fill={dotColor}
                    stroke={isDark ? dotColor : "#000000"}
                    strokeWidth={1.5}
                />
            );
        };

        // Fill the full card width; only grow wider (and scroll) when data overflows
        const chartWidth = Math.max(dataHistory.length * 30, containerWidth);

        return (
            <div
                ref={containerRef}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[520px] w-full transition-colors duration-300"
            >
                <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

                {/* Card header */}
                <div className="flex items-center gap-3 mb-6">
                    <div
                        className="p-2 rounded-lg"
                        style={{
                            backgroundColor:
                                isAQI && !isDark ? "#0f172a20" : `${color}20`,
                            color: isAQI && !isDark ? "#0f172a" : color,
                        }}
                    >
                        <MetricIcon size={24} />
                    </div>
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200">
                        {title}
                    </h3>
                </div>

                {/* Scrollable chart area */}
                <div
                    ref={scrollRef}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    className={`flex-grow w-full overflow-x-auto overflow-y-hidden no-scrollbar mb-4 touch-pan-x select-none ${
                        isDragging ? "cursor-grabbing" : "cursor-grab"
                    }`}
                >
                    {/* Fixed-width inner div — wider than the container to allow scrolling */}
                    <div
                        style={{ width: `${chartWidth}px`, height: "320px" }}
                        className="pointer-events-none"
                    >
                        <LineChart
                            width={chartWidth}
                            height={320}
                            data={dataHistory}
                            margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={gridColor}
                                opacity={0.1}
                                vertical={false}
                            />
                            <XAxis
                                dataKey="timestamp"
                                stroke={axisColor}
                                fontSize={10}
                                tickMargin={35}
                                angle={-90}
                                textAnchor="end"
                                interval={0}
                            />
                            <YAxis
                                domain={["auto", "auto"]}
                                stroke={axisColor}
                                fontSize={10}
                                width={40}
                                tickFormatter={(tick) => `${tick}${unit}`}
                            />
                            <Tooltip
                                content={<CustomTooltip unit={unit} />}
                                cursor={{
                                    stroke: axisColor,
                                    strokeWidth: 1,
                                    strokeDasharray: "4 4",
                                }}
                            />

                            {/* Reference lines for max / avg / min */}
                            {stats.max !== "--" && (
                                <ReferenceLine
                                    y={stats.max}
                                    stroke="#10b981"
                                    strokeDasharray="4 4"
                                    strokeOpacity={0.4}
                                >
                                    <Label
                                        value="MAX"
                                        position="insideTopLeft"
                                        fill="#10b981"
                                        fontSize={8}
                                        opacity={0.6}
                                    />
                                </ReferenceLine>
                            )}
                            {stats.avg !== "--" && (
                                <ReferenceLine
                                    y={Number(stats.avg)}
                                    stroke="#0ea5e9"
                                    strokeDasharray="4 4"
                                    strokeOpacity={0.4}
                                >
                                    <Label
                                        value="AVG"
                                        position="insideTopRight"
                                        fill="#0ea5e9"
                                        fontSize={8}
                                        opacity={0.6}
                                    />
                                </ReferenceLine>
                            )}
                            {stats.min !== "--" && (
                                <ReferenceLine
                                    y={stats.min}
                                    stroke="#f97316"
                                    strokeDasharray="4 4"
                                    strokeOpacity={0.4}
                                >
                                    <Label
                                        value="MIN"
                                        position="insideBottomLeft"
                                        fill="#f97316"
                                        fontSize={8}
                                        opacity={0.6}
                                    />
                                </ReferenceLine>
                            )}

                            <Line
                                type="monotone"
                                dataKey={dataKey}
                                stroke={isAQI ? aqiLineColor : color}
                                strokeWidth={2.5}
                                dot={isAQI ? aqiDot : standardDot}
                                activeDot={{
                                    r: 6,
                                    fill: color,
                                    stroke: isDark ? "#0f172a" : "#ffffff",
                                    strokeWidth: 2,
                                }}
                                isAnimationActive={false}
                            />
                        </LineChart>
                    </div>
                </div>

                {/* Stats footer */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col items-center">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 opacity-80 uppercase tracking-wider">
                            <ArrowUp size={12} /> Max
                        </span>
                        <span className="text-sm font-bold dark:text-slate-200">
                            {stats.max}
                            {stats.max !== "--" ? unit : ""}
                        </span>
                    </div>
                    <div className="flex flex-col items-center border-x border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500 opacity-80 uppercase tracking-wider">
                            <ArrowDown size={12} /> Min
                        </span>
                        <span className="text-sm font-bold dark:text-slate-200">
                            {stats.min}
                            {stats.min !== "--" ? unit : ""}
                        </span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-sky-500 opacity-80 uppercase tracking-wider">
                            <Hash size={12} /> Avg
                        </span>
                        <span className="text-sm font-bold dark:text-slate-200">
                            {stats.avg}
                            {stats.avg !== "--" ? unit : ""}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 md:p-6 w-full max-w-7xl mx-auto">
            {/* Page header */}
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black dark:text-white tracking-tight leading-none mb-2">
                        24-Hour Summary
                    </h1>
                    <p className="text-slate-500 font-medium">
                        24h statistics for station {activeStation}
                    </p>
                </div>

                <div className="flex items-center gap-6 px-6 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            Session Start
                        </span>
                        <span className="text-sm font-black dark:text-white">
                            {timeInfo.start}
                        </span>
                    </div>
                    <div className="h-8 w-px bg-slate-100 dark:bg-slate-800" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            Session End
                        </span>
                        <span className="text-sm font-black dark:text-white">
                            {timeInfo.end}
                        </span>
                    </div>
                    <div className="h-8 w-px bg-slate-100 dark:bg-slate-800" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest mb-1">
                            Total Span
                        </span>
                        <span className="text-sm font-black dark:text-white">
                            {timeInfo.span}
                        </span>
                    </div>
                </div>
            </header>

            {/* Metric cards */}
            <div className="grid grid-cols-1 gap-8">
                <MetricCard
                    title="Temperature Trend"
                    unit="°C"
                    icon={Thermometer}
                    dataKey="temp"
                    color="#f97316"
                />
                <MetricCard
                    title="Humidity Trend"
                    unit="%"
                    icon={Droplets}
                    dataKey="humidity"
                    color="#0ea5e9"
                />
                <MetricCard
                    title="Pressure Trend"
                    unit=" hPa"
                    icon={Gauge}
                    dataKey="pressure"
                    color="#8b5cf6"
                />
                <MetricCard
                    title="Altitude Stability"
                    unit=" m"
                    icon={Mountain}
                    dataKey="altitude"
                    color="#ec4899"
                />
                <MetricCard
                    title="Air Quality Index"
                    unit=" PPM"
                    icon={Wind}
                    dataKey="airQuality"
                    color="#10b981"
                    isAQI={true}
                />
            </div>
        </div>
    );
};

export default History24h;
