import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { io } from "socket.io-client";
import Topbar from "./components/Topbar";
import LiveSummary from "./components/LiveSummary";
import History24h from "./components/History24h";
import AtmosphericDynamics from "./components/AtmosphericDynamics";
import ThermalComfort from "./components/ThermalComfort";
import EnvironmentalQuality from "./components/EnvironmentalQuality";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

// Create the socket connection once, outside the component
const socket = io(backendUrl);

const ACTIVE_STATION = "STN-INDORE-04";

function App() {
    const [dataHistory, setDataHistory] = useState([]);
    const [currentReading, setCurrentReading] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isDark, setIsDark] = useState(true);

    // ─── Fetch historical data on mount ─────────────────────────────────────
    useEffect(() => {
        const fetchHistory = async (hours = 24) => {
            setCurrentReading(null);
            setDataHistory([]);

            try {
                const response = await fetch(
                    `${backendUrl}/api/history?stationId=${ACTIVE_STATION}&hours=${hours}`,
                );

                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}`);
                }

                const json = await response.json();

                // BUG FIX: /api/history returns a plain array directly.
                // If it ever gets wrapped in ApiResponse ({ data: [...] }), unwrap it.
                const history = Array.isArray(json) ? json : (json.data ?? []);

                if (!Array.isArray(history)) {
                    throw new Error("Expected an array from /api/history");
                }

                console.log(
                    `📊 Loaded ${history.length} history points for ${ACTIVE_STATION}`,
                );
                setDataHistory(history);

                // Show the most recent reading immediately on load
                if (history.length > 0) {
                    setCurrentReading(history[history.length - 1]);
                } else if (hours === 24) {
                    await fetchHistory(0);
                }
            } catch (error) {
                console.error("❌ Failed to fetch history:", error.message);
            }
        };

        fetchHistory();
    }, []); // runs once on mount

    // ─── Socket.io live updates ──────────────────────────────────────────────
    useEffect(() => {
        const handleConnect = () => {
            console.log("🟢 Socket connected");
            setIsConnected(true);
        };

        const handleDisconnect = (reason) => {
            console.log("🔴 Socket disconnected");
            setIsConnected(false);
            console.warn(`Socket disconnect reason: ${reason}`);
        };

        const handleConnectError = (error) => {
            console.error("❌ Socket connection failed:", error.message);
            setIsConnected(false);
        };

        const handleUpdateDashboard = (data) => {
            if (!data || !data.payload) {
                console.warn("⚠️  Received malformed updateDashboard event");
                return;
            }

            const { stationId, payload } = data;

            // Ignore updates for other stations
            if (stationId !== ACTIVE_STATION) return;

            const timestamp = new Date().toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            });

            const flatReading = {
                stationId,
                timestamp,
                temp: payload.temp,
                humidity: payload.humidity,
                pressure: payload.pressure,
                altitude: payload.altitude,
                airQuality: payload.airQuality,
                rain: payload.rain,
            };

            setCurrentReading(flatReading);

            setDataHistory((prev) => {
                const updated = [...prev, flatReading];
                return updated.slice(-200);
            });
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("connect_error", handleConnectError);
        socket.on("updateDashboard", handleUpdateDashboard);

        if (socket.connected) {
            handleConnect();
        }

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("connect_error", handleConnectError);
            socket.off("updateDashboard", handleUpdateDashboard);
        };
    }, []);

    return (
        <Router>
            <div className={isDark ? "dark" : ""}>
                <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
                    <Topbar
                        isConnected={isConnected}
                        isDark={isDark}
                        setIsDark={setIsDark}
                    />
                    <main className="pt-6">
                        <Routes>
                            <Route
                                path="/"
                                element={
                                    <LiveSummary
                                        currentReading={currentReading}
                                        activeStation={ACTIVE_STATION}
                                        dataHistory={dataHistory}
                                    />
                                }
                            />
                            <Route
                                path="/history"
                                element={
                                    <History24h
                                        dataHistory={dataHistory}
                                        activeStation={ACTIVE_STATION}
                                        isDark={isDark}
                                    />
                                }
                            />
                            <Route
                                path="/analytics/atmospheric"
                                element={
                                    <AtmosphericDynamics
                                        dataHistory={dataHistory}
                                        currentReading={currentReading}
                                        isDark={isDark}
                                    />
                                }
                            />
                            <Route
                                path="/analytics/thermal"
                                element={
                                    <ThermalComfort
                                        dataHistory={dataHistory}
                                        currentReading={currentReading}
                                        isDark={isDark}
                                    />
                                }
                            />
                            <Route
                                path="/analytics/environmental"
                                element={
                                    <EnvironmentalQuality
                                        dataHistory={dataHistory}
                                        currentReading={currentReading}
                                        isDark={isDark}
                                    />
                                }
                            />
                        </Routes>
                    </main>
                </div>
            </div>
        </Router>
    );
}

export default App;
