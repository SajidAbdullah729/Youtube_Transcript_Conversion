import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

let ytPlayer; // Global YouTube player instance

const Home = () => {
    const [videoId, setVideoId] = useState("");
    const [transcripts, setTranscripts] = useState([]);
    const [currentLine, setCurrentLine] = useState(null);
    const transcriptContainerRef = useRef(null);
    const playerRef = useRef(null);

    // Load the YouTube Iframe API
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        script.onload = () => {
            if (window.YT && videoId) {
                initializePlayer();
            }
        };
        document.body.appendChild(script);

        return () => document.body.removeChild(script);
    }, [videoId]);

    // Initialize YouTube Player
    const initializePlayer = () => {
        ytPlayer = new window.YT.Player(playerRef.current, {
            videoId: videoId,
            events: {
                onReady: handlePlayerReady,
            },
        });
    };

    const handlePlayerReady = () => {
        // Poll video time every 1 second to sync the transcript
        setInterval(() => {
            if (ytPlayer && transcripts.length > 0) {
                syncTranscript();
            }
        }, 1000);
    };

    // Fetch transcripts from the backend
    const fetchTranscript = async () => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/transcripts/${videoId}`);
            setTranscripts(response.data.transcript);
        } catch (error) {
            console.error("Error fetching transcript:", error);
        }
    };

    // Sync scrolling based on video playback time
    const syncTranscript = () => {
        const currentTime = ytPlayer.getCurrentTime();

        const activeLineIndex = transcripts.findIndex(
            (t) => currentTime >= t.start && currentTime <= t.start + t.duration
        );

        if (activeLineIndex !== -1 && activeLineIndex !== currentLine) {
            setCurrentLine(activeLineIndex);
            const transcriptElements = transcriptContainerRef.current.querySelectorAll(".transcript-line");
            const activeElement = transcriptElements[activeLineIndex];
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h1>YouTube Transcript Viewer</h1>

            {/* Input for YouTube Video ID */}
            <div>
                <input
                    type="text"
                    placeholder="Enter YouTube Video ID"
                    value={videoId}
                    onChange={(e) => setVideoId(e.target.value)}
                    style={{ marginRight: "10px", padding: "5px" }}
                />
                <button onClick={fetchTranscript} style={{ padding: "5px 10px" }}>
                    Fetch Transcript
                </button>
            </div>

            {/* YouTube Video Player */}
            {videoId && (
                <div style={{ marginTop: "20px" }}>
                    <div ref={playerRef} id="youtube-player" style={{ width: "560px", height: "315px" }}></div>
                </div>
            )}

            {/* Transcript Section */}
            <div
                ref={transcriptContainerRef}
                style={{
                    marginTop: "20px",
                    maxHeight: "300px",
                    overflowY: "scroll",
                    border: "1px solid #ccc",
                    padding: "10px",
                }}
            >
                {transcripts.map((t, index) => (
                    <p
                        key={index}
                        className="transcript-line"
                        style={{
                            margin: "5px 0",
                            padding: "5px",
                            backgroundColor: currentLine === index ? "rgba(0, 123, 255, 0.2)" : "transparent",
                            transition: "background-color 0.3s ease",
                        }}
                    >
                        <strong>{Math.floor(t.start)}s:</strong> {t.text}
                    </p>
                ))}
            </div>
        </div>
    );
};

export default Home;
