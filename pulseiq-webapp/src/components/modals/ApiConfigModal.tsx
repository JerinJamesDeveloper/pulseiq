import { useState } from "react";
import { inputStyle, labelStyle } from "../../constants";
import { ModalOverlay } from "../common/ModalOverlay";

export function ApiConfigModal({
    onClose,
    onSave,
    currentUrl,
}: {
    onClose: () => void;
    onSave: (url: string) => void;
    currentUrl: string;
}) {
    const [url, setUrl] = useState(currentUrl);
    return (
        <ModalOverlay onClose={onClose}>
            <div
                style={{
                    background: "#0d0d1a",
                    border: "1px solid #1a1a2e",
                    borderRadius: 16,
                    padding: 28,
                    width: 520,
                    maxWidth: "90vw",
                }}
            >
                <h3
                    style={{
                        margin: "0 0 6px",
                        color: "#e0e0e0",
                        fontFamily: "monospace",
                        fontSize: 16,
                    }}
                >
                    ⚙️ API Configuration
                </h3>
                <p
                    style={{
                        margin: "0 0 20px",
                        fontSize: 11,
                        color: "#555",
                        fontFamily: "monospace",
                    }}
                >
                    Set the base URL for your backend API. The app will fall back to local
                    mock data when offline.
                </p>
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>API Base URL</label>
                    <input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="http://localhost:3001/api"
                        style={inputStyle}
                    />
                </div>
                <div
                    style={{
                        background: "#080810",
                        border: "1px solid #111122",
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 20,
                        fontSize: 10,
                        color: "#666",
                        fontFamily: "monospace",
                        lineHeight: 1.8,
                    }}
                >
                    <div style={{ color: "#888", marginBottom: 4 }}>Expected endpoints:</div>
                    <div>GET /api/projects</div>
                    <div>POST /api/projects</div>
                    <div>PUT /api/projects/:id</div>
                    <div>DELETE /api/projects/:id</div>
                    <div>POST /api/projects/:id/learning</div>
                    <div>POST /api/projects/:id/reports</div>
                    <div>POST /api/projects/:id/docs</div>
                    <div>POST /api/projects/:id/goals</div>
                    <div style={{ color: "#444", marginTop: 4 }}>
                        ...and more (see API docs)
                    </div>
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                        onClick={onClose}
                        style={{
                            background: "#111122",
                            border: "1px solid #1a1a2e",
                            color: "#666",
                            padding: "8px 18px",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontFamily: "monospace",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onSave(url);
                            onClose();
                        }}
                        style={{
                            background: "#00FFB2",
                            border: "none",
                            color: "#000",
                            padding: "8px 18px",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontWeight: 700,
                            fontFamily: "monospace",
                        }}
                    >
                        Save & Reconnect
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
}
