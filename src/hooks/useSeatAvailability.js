import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { fetchAvailability } from "../api/bookingApi";
import { SOCKET_URL } from "../config/api";

export default function useSeatAvailability(identity) {
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const requestId = useRef(0);
  const loaded = useRef(false);
  const abortController = useRef(null);
  const identityRef = useRef(identity);
  identityRef.current = identity;
  const identityKey = [
    identity?.movieId,
    identity?.cinema,
    identity?.screen,
    identity?.date,
    identity?.time,
  ]
    .map((value) => String(value || ""))
    .join("|");

  const refetch = useCallback(async () => {
    const currentIdentity = identityRef.current;
    if (!currentIdentity?.movieId || !currentIdentity?.date || !currentIdentity?.time) return;
    abortController.current?.abort();
    const controller = new AbortController();
    abortController.current = controller;
    const id = ++requestId.current;
    setError(null);
    loaded.current ? setRefreshing(true) : setLoading(true);
    try {
      const next = await fetchAvailability(currentIdentity, {
        signal: controller.signal,
      });
      if (id === requestId.current) { setAvailability(next); loaded.current = true; }
      return next;
    } catch (nextError) {
      if (nextError?.name === "AbortError") return undefined;
      if (id === requestId.current) setError(nextError.message || "Unable to load seat availability");
      throw nextError;
    } finally {
      if (id === requestId.current) { setLoading(false); setRefreshing(false); }
    }
  }, [identityKey]);

  useEffect(() => {
    loaded.current = false;
    setAvailability(null);
    refetch().catch(() => {});
    return () => abortController.current?.abort();
  }, [identityKey, refetch]);

  useEffect(() => {
    if (!availability?.show?.showKey) return undefined;
    const socket = io(SOCKET_URL);
    const showKey = availability.show.showKey;
    const onAvailability = (next) => next?.show?.showKey === showKey && setAvailability(next);
    const onRefresh = () => refetch().catch(() => {});
    socket.emit("show:join", showKey);
    socket.on("show:availability", onAvailability);
    socket.io?.on("reconnect", onRefresh);
    window.addEventListener("focus", onRefresh);
    const interval = window.setInterval(() => { if (!socket.connected) onRefresh(); }, 30000);
    return () => {
      socket.emit("show:leave", showKey);
      socket.off("show:availability", onAvailability);
      socket.io?.off("reconnect", onRefresh);
      socket.disconnect();
      window.removeEventListener("focus", onRefresh);
      window.clearInterval(interval);
    };
  }, [availability?.show?.showKey, refetch]);

  return { availability, bookedSeats: availability?.bookedSeats || [], loading, refreshing, error, refetch };
}
