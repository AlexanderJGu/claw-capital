"use client";
import { useState, useEffect } from "react";

export function useLivePrices() {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchPrices() {
      try {
        const res = await fetch("/api/prices");
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setPrices(data);
      } catch {
        // silent — fall back to static prices
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchPrices();
    const interval = setInterval(fetchPrices, 60_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { prices, loading };
}
