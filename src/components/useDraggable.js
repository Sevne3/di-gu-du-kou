"use client";
import { useRef, useCallback, useEffect, useState } from "react";

export default function useDraggable(opts) {
  var optsRef = useRef(opts || {});
  optsRef.current = opts || {};
  var posRef = useRef({ x: 0, y: 0 });
  var dragRef = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 });
  var elRef = useRef(null);
  var [pos, setPos] = useState({ x: 0, y: 0 });

  var handleMouseDown = useCallback(function(e) {
    if (e.button !== 0) return;
    var o = optsRef.current;
    if (o.onDragStart) o.onDragStart();
    dragRef.current.dragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.origX = posRef.current.x;
    dragRef.current.origY = posRef.current.y;
  }, []);

  useEffect(function() {
    function onMove(e) {
      if (!dragRef.current.dragging) return;
      var dx = e.clientX - dragRef.current.startX;
      var dy = e.clientY - dragRef.current.startY;
      var nx = dragRef.current.origX + dx;
      var ny = dragRef.current.origY + dy;
      // Boundary constraint (16px margin)
      var mw = optsRef.current.minWidth || 320;
      var mh = optsRef.current.minHeight || 400;
      nx = Math.max(16 - mw + 380, Math.min(window.innerWidth - 16 - 380, nx));
      ny = Math.max(16, Math.min(window.innerHeight - 16 - 48, ny));
      posRef.current = { x: nx, y: ny };
      if (elRef.current) {
        elRef.current.style.transform = "translate(" + nx + "px," + ny + "px)";
      }
    }
    function onUp() {
      if (!dragRef.current.dragging) return;
      dragRef.current.dragging = false;
      setPos({ x: posRef.current.x, y: posRef.current.y });
      var o = optsRef.current;
      if (o.onDragEnd) o.onDragEnd(posRef.current.x, posRef.current.y);
    }
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseup", onUp, { passive: true });
    return function() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  var setEl = useCallback(function(el) {
    elRef.current = el;
    if (el && el.parentNode) {
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var ix = optsRef.current.initialX !== undefined ? optsRef.current.initialX : vw - 380 - 24;
      var iy = optsRef.current.initialY !== undefined ? optsRef.current.initialY : vh - 520 - 24;
      posRef.current = { x: ix, y: iy };
      el.style.transform = "translate(" + ix + "px," + iy + "px)";
    }
  }, []);

  return { handleMouseDown: handleMouseDown, setEl: setEl, dragRef: dragRef };
}
