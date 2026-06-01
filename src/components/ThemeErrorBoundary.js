"use client";
import React from "react";

export default class ThemeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false }; console.log("ThemeErrorBoundary mounted");
  }
  componentDidCatch(error, info) { console.error("ThemeErrorBoundary caught:", error, info); };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: "12px 20px",
          background: "rgba(240,194,127,.08)",
          border: "1px solid rgba(240,194,127,.12)",
          borderRadius: "12px",
          margin: "8px auto",
          maxWidth: "400px",
          textAlign: "center",
          fontSize: ".82rem",
          color: "var(--text-light)"
        }}>
          🌿 当前主题渲染出现小问题，已切换为日间模式
        </div>
      );
    }
    return this.props.children;
  }
}
