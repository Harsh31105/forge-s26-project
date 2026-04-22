"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/src/context/AuthContext";

export interface RecentlyViewedCourse {
  id: string;
  code: string;
  name: string;
  rating: number | null;
  viewedAt: string;
}

const MAX_ITEMS = 10;

function timeAgo(isoString: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 3600) {
    const mins = Math.max(1, Math.floor(seconds / 60));
    return `Viewed ${mins} minute${mins !== 1 ? "s" : ""} ago`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `Viewed ${hours} hour${hours !== 1 ? "s" : ""} ago`;
  }
  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400);
    return `Viewed ${days} day${days !== 1 ? "s" : ""} ago`;
  }
  const weeks = Math.floor(seconds / 604800);
  return `Viewed ${weeks} week${weeks !== 1 ? "s" : ""} ago`;
}

export function useRecentlyViewed() {
  const { student } = useAuth();
  const storageKey = student ? `recently_viewed_${student.id}` : null;

  const [courses, setCourses] = useState<RecentlyViewedCourse[]>([]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const stored = localStorage.getItem(storageKey);
      setCourses(stored ? JSON.parse(stored) : []);
    } catch {
      setCourses([]);
    }
  }, [storageKey]);

  const trackView = useCallback(
    (course: Omit<RecentlyViewedCourse, "viewedAt">) => {
      if (!storageKey) return;
      setCourses((prev) => {
        const filtered = prev.filter((c) => c.id !== course.id);
        const updated = [
          { ...course, viewedAt: new Date().toISOString() },
          ...filtered,
        ].slice(0, MAX_ITEMS);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
    },
    [storageKey]
  );

  const recentlyViewed = courses.map((c) => ({
    ...c,
    viewed: timeAgo(c.viewedAt),
  }));

  return { recentlyViewed, trackView };
}
