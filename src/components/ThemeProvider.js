"use client";
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

var THEME_KEY = "dgdk_theme";
var ThemeContext = createContext({ theme: "night", isNight: true, toggle: function() {} });

export function useTheme() {
  return useContext(ThemeContext);
}

function getInitialTheme() {
  try {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved === "day" || saved === "night") return saved;
  } catch(e) {}
  try {
    var mql = window.matchMedia("(prefers-color-scheme: dark)");
    if (mql.matches) return "night";
  } catch(e) {}
  return "night"; // 渡口默认暗色
}

export default function ThemeProvider(props) {
  var [theme, setTheme] = useState("night");
  var [mounted, setMounted] = useState(false);
  var manualRef = useRef(false);
  var isNight = theme === "night";

  var applyTheme = useCallback(function(t) {
    try {
      document.documentElement.setAttribute("data-theme", t);
      localStorage.setItem(THEME_KEY, t);
    } catch(e) {}
  }, []);

  // Initialize theme from localStorage/system preference
  useEffect(function() {
    var initial = getInitialTheme();
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  // Listen for system preference changes
  useEffect(function() {
    var mql = window.matchMedia("(prefers-color-scheme: dark)");
    function handler(e) {
      if (!manualRef.current) {
        var t = e.matches ? "night" : "day";
        setTheme(t);
        applyTheme(t);
      }
    }
    if (mql.addEventListener) mql.addEventListener("change", handler);
    return function() { if (mql.removeEventListener) mql.removeEventListener("change", handler); };
  }, []);

  // Auto time-based switch (20:00-08:00) when no manual override
  useEffect(function() {
    function checkTime() {
      if (manualRef.current) return;
      var h = new Date().getHours();
      var shouldBeDark = h >= 20 || h < 8;
      if (shouldBeDark !== (theme === "night")) {
        var t = shouldBeDark ? "night" : "day";
        setTheme(t);
        applyTheme(t);
      }
    }
    var timer = setInterval(checkTime, 60000);
    return function() { clearInterval(timer); };
  }, [theme]);

  // Keep data-theme in sync
  useEffect(function() {
    if (mounted) applyTheme(theme);
  }, [theme]);

  // Expose toggle globally
  var toggle = useCallback(function() {
    manualRef.current = true;
    setTheme(function(prev) {
      var next = prev === "night" ? "day" : "night";
      applyTheme(next);
      return next;
    });
  }, []);

  useEffect(function() {
    if (typeof window !== "undefined") {
      window.__toggleTheme = toggle;
    }
  }, [toggle]);

  return (
    <ThemeContext.Provider value={{ theme: theme, isNight: isNight, toggle: toggle }}>
      {props.children}
    </ThemeContext.Provider>
  );
}
