import { useState, useEffect, useRef, useCallback } from "react";

interface ProjectTimerProps {
  projectId: number;
  projectName: string;
  onSaveTime: (projectId: number, hours: number) => void;
  color?: string;
}

type TimerState = "idle" | "running" | "paused";

export function ProjectTimer({ projectId, projectName, onSaveTime, color = "#00FFB2" }: ProjectTimerProps) {
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [pausedTime, setPausedTime] = useState(0);
  
  const intervalRef = useRef<number | null>(null);

  // Format seconds to HH:MM:SS
  const formatTime = useCallback((totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  // Calculate elapsed time based on state
  const calculateElapsed = useCallback((): number => {
    if (timerState === "running" && sessionStartTime) {
      return pausedTime + Math.floor((Date.now() - sessionStartTime) / 1000);
    }
    return pausedTime;
  }, [timerState, sessionStartTime, pausedTime]);

  // Update elapsed seconds when running
  useEffect(() => {
    if (timerState === "running") {
      intervalRef.current = window.setInterval(() => {
        setElapsedSeconds(calculateElapsed());
      }, 1000);
    } else if (timerState === "paused") {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setElapsedSeconds(pausedTime);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setElapsedSeconds(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState, calculateElapsed, pausedTime]);

  const handleStart = useCallback(() => {
    setTimerState("running");
    setSessionStartTime(Date.now());
  }, []);

  const handlePause = useCallback(() => {
    if (timerState === "running") {
      setTimerState("paused");
      setPausedTime(calculateElapsed());
      setSessionStartTime(null);
    }
  }, [timerState, calculateElapsed]);

  const handleResume = useCallback(() => {
    setTimerState("running");
    setSessionStartTime(Date.now());
  }, []);

  const handleStop = useCallback(() => {
    setTimerState("idle");
    setElapsedSeconds(0);
    setPausedTime(0);
    setSessionStartTime(null);
  }, []);

  const handleSave = useCallback(() => {
    const currentElapsed = calculateElapsed();
    if (currentElapsed > 0) {
      const hours = currentElapsed / 3600;
      onSaveTime(projectId, hours);
    }
    handleStop();
  }, [calculateElapsed, onSaveTime, projectId, handleStop]);

  // Get current display time
  const displayTime = timerState === "running" ? elapsedSeconds : pausedTime;

  return (
    <div
      style={{
        background: "#0d0d1a",
        border: "1px solid #1a1a2e",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#555",
          fontFamily: "monospace",
          textTransform: "uppercase",
          letterSpacing: 1.5,
          marginBottom: 12,
        }}
      >
        ⏱️ Project Timer
      </div>
      
      {/* Project Name */}
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "#ccc", fontWeight: 600 }}>
          {projectName}
        </span>
      </div>

      {/* Timer Display */}
      <div
        style={{
          background: "#050510",
          border: `1px solid ${timerState === "running" ? color + "44" : "#1a1a2e"}`,
          borderRadius: 10,
          padding: "16px 20px",
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 36,
            fontFamily: "monospace",
            fontWeight: 700,
            color: timerState === "running" ? color : timerState === "paused" ? "#FFD700" : "#666",
            letterSpacing: 4,
          }}
        >
          {formatTime(displayTime)}
        </div>
        <div
          style={{
            fontSize: 10,
            color: "#555",
            fontFamily: "monospace",
            marginTop: 6,
            textTransform: "uppercase",
          }}
        >
          {timerState === "idle" && "Ready to start"}
          {timerState === "running" && "● Recording"}
          {timerState === "paused" && "▐▐ Paused"}
        </div>
      </div>

      {/* Control Buttons */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {timerState === "idle" && (
          <button
            onClick={handleStart}
            style={{
              background: color,
              border: "none",
              color: "#000",
              padding: "10px 20px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
              fontFamily: "monospace",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ▶ Start
          </button>
        )}

        {timerState === "running" && (
          <>
            <button
              onClick={handlePause}
              style={{
                background: "#FFD700",
                border: "none",
                color: "#000",
                padding: "10px 20px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 700,
                fontFamily: "monospace",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ⏸ Pause
            </button>
            <button
              onClick={handleStop}
              style={{
                background: "#FF4444",
                border: "none",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 700,
                fontFamily: "monospace",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ⏹ Stop
            </button>
          </>
        )}

        {timerState === "paused" && (
          <>
            <button
              onClick={handleResume}
              style={{
                background: color,
                border: "none",
                color: "#000",
                padding: "10px 20px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 700,
                fontFamily: "monospace",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ▶ Resume
            </button>
            <button
              onClick={handleSave}
              style={{
                background: "#00FFB2",
                border: "none",
                color: "#000",
                padding: "10px 20px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 700,
                fontFamily: "monospace",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              💾 Save
            </button>
            <button
              onClick={handleStop}
              style={{
                background: "#FF4444",
                border: "none",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 700,
                fontFamily: "monospace",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ⏹ Discard
            </button>
          </>
        )}
      </div>

      {/* Quick Info */}
      {displayTime > 0 && (
        <div
          style={{
            marginTop: 12,
            fontSize: 11,
            color: "#666",
            fontFamily: "monospace",
            textAlign: "center",
          }}
        >
          {displayTime >= 60 && (
            <span>
              {(displayTime / 60).toFixed(1)} minutes recorded
            </span>
          )}
          {displayTime >= 3600 && (
            <span style={{ color: color }}>
              {" "}• {(displayTime / 3600).toFixed(2)} hours
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default ProjectTimer;

