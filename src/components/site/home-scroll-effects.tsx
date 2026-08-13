"use client";

import { useEffect } from "react";

function formatKoreanTime(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Seoul",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}.${values.month}.${values.day} / ${values.hour}:${values.minute} KST`;
}

export function HomeScrollEffects() {
  useEffect(() => {
    const background = document.getElementById("qt-hero-bg-wrap");
    const time = document.getElementById("qt-syslog-time");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;

    const updateClock = () => {
      if (time) {
        time.textContent = formatKoreanTime(new Date());
      }
    };
    const updateBackground = () => {
      if (background && !motionQuery.matches) {
        background.style.transform = `translateY(${window.scrollY * 0.4}px)`;
      }
      frameId = 0;
    };
    const handleScroll = () => {
      if (frameId === 0 && !motionQuery.matches) {
        frameId = window.requestAnimationFrame(updateBackground);
      }
    };
    const handleMotionChange = () => {
      if (motionQuery.matches && background) {
        background.style.removeProperty("transform");
      }
    };

    updateClock();
    updateBackground();
    const clockId = window.setInterval(updateClock, 30_000);
    window.addEventListener("scroll", handleScroll, { passive: true });
    motionQuery.addEventListener("change", handleMotionChange);

    return () => {
      window.clearInterval(clockId);
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", handleScroll);
      motionQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  return null;
}
