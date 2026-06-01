"use client";
import { useState, useEffect, useRef } from "react";
import {
  getAudioState,
  subscribe,
  toggleAudio,
  startAudio,
  nextTrack,
  prevTrack,
  switchTrack,
  getPlaylist,
  getCurrentTrack,
} from "@/lib/audioManager";

export default function MusicPlayer() {
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const playlist = getPlaylist();
  const panelRef = useRef(null);

  useEffect(() => {
    const state = getAudioState();
    setPlaying(state.isPlaying);
    setReady(state.initialized);
    setCurrentTrackIdx(state.currentTrack || 0);

    const unsub = subscribe((newState) => {
      setPlaying(newState.isPlaying);
      setReady(newState.initialized);
      setCurrentTrackIdx(newState.currentTrack || 0);
    });

    const handler = () => {
      if (!getAudioState().initialized) {
        startAudio();
        setReady(true);
        setPlaying(true);
      }
    };
    document.addEventListener("click", handler, { once: true });
    document.addEventListener("touchstart", handler, { once: true });

    return () => {
      unsub();
      document.removeEventListener("click", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  // Close playlist when clicking outside
  useEffect(() => {
    if (!showPlaylist) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowPlaylist(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPlaylist]);

  const currentTrack = playlist[currentTrackIdx] || playlist[0];

  return (
    <div style={{ position: "fixed", bottom: "80px", right: "24px", zIndex: 999 }}>
      {/* === Playlist Panel === */}
      {showPlaylist && (
        <div
          ref={panelRef}
          style={{
            position: "absolute",
            bottom: "54px",
            right: "0",
            width: "220px",
            background: "rgba(26,26,46,.92)",
            backdropFilter: "blur(16px)",
            borderRadius: "16px",
            border: "1px solid rgba(240,194,127,.1)",
            boxShadow: "0 8px 40px rgba(0,0,0,.3)",
            padding: "12px",
            animation: "fadeIn .2s ease",
          }}
        >
          <p style={{ fontSize: ".7rem", color: "rgba(250,246,240,.3)", letterSpacing: "2px", marginBottom: "8px", textAlign: "center" }}>
            治愈播放列表
          </p>
          {playlist.map((track, i) => (
            <button
              key={track.id}
              onClick={() => {
                if (!playing) {
                  startAudio(i);
                  setPlaying(true);
                  setReady(true);
                } else {
                  switchTrack(i);
                }
                setCurrentTrackIdx(i);
                setShowPlaylist(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                padding: "8px 10px",
                borderRadius: "10px",
                border: "none",
                background: i === currentTrackIdx ? "rgba(240,194,127,.12)" : "transparent",
                color: i === currentTrackIdx ? "var(--warm-glow)" : "rgba(250,246,240,.5)",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: ".78rem",
                textAlign: "left",
                transition: "all .2s",
                marginBottom: "2px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = i === currentTrackIdx ? "rgba(240,194,127,.15)" : "rgba(255,255,255,.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = i === currentTrackIdx ? "rgba(240,194,127,.12)" : "transparent";
              }}
            >
              <span style={{ fontSize: "1rem" }}>{track.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: i === currentTrackIdx ? 600 : 400, fontSize: ".8rem" }}>{track.name}</div>
                <div style={{ fontSize: ".6rem", color: "rgba(250,246,240,.25)", marginTop: "1px" }}>{track.description}</div>
              </div>
              {i === currentTrackIdx && playing && (
                <span style={{ fontSize: ".65rem", color: "var(--warm-glow)" }}>♪</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* === Music toggle button === */}
      <button
        onClick={() => {
          if (playing) {
            toggleAudio();
          } else {
            if (ready) {
              toggleAudio();
            } else {
              startAudio();
              setReady(true);
              setPlaying(true);
            }
          }
        }}
        title={playing ? "关闭背景音乐" : "开启背景音乐"}
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          border: playing ? "1px solid rgba(240,194,127,.3)" : "1px solid rgba(255,255,255,.1)",
          background: playing ? "rgba(240,194,127,.15)" : "rgba(26,26,46,.5)",
          backdropFilter: "blur(12px)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.1rem",
          transition: "all .3s ease",
          boxShadow: playing ? "0 0 16px rgba(240,194,127,.15)" : "0 4px 12px rgba(0,0,0,.15)",
          animation: playing ? "floatGlow 4s ease-in-out infinite" : "none",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          if (playing) e.currentTarget.style.boxShadow = "0 0 24px rgba(240,194,127,.25)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "";
          if (playing) e.currentTarget.style.boxShadow = "0 0 16px rgba(240,194,127,.15)";
          else e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.15)";
        }}
      >
        {playing ? currentTrack.emoji : "🔇"}
        {playing && (
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#6ab04c",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
        )}
      </button>

      {/* === Now Playing indicator === */}
      {playing && (
        <div
          onClick={() => setShowPlaylist(!showPlaylist)}
          style={{
            position: "absolute",
            bottom: "50px",
            right: "0",
            fontSize: ".65rem",
            color: "rgba(240,194,127,.4)",
            cursor: "pointer",
            whiteSpace: "nowrap",
            background: "rgba(26,26,46,.4)",
            backdropFilter: "blur(8px)",
            padding: "3px 10px",
            borderRadius: "20px",
            border: "1px solid rgba(240,194,127,.06)",
            transition: "all .2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(240,194,127,.6)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(240,194,127,.4)"; }}
        >
          {currentTrack.emoji} {currentTrack.name}
        </div>
      )}
    </div>
  );
}
