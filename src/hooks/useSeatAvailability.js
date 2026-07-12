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

  const refetch = useCallback(async () => {
    if (!identity?.movieId || !identity?.date || !identity?.time) return;
    const id = ++requestId.current;
    setError(null);
    loaded.current ? setRefreshing(true) : setLoading(true);
    try {
      const next = await fetchAvailability(identity);
      if (id === requestId.current) { setAvailability(next); loaded.current = true; }
      return next;
    } catch (nextError) {
      if (id === requestId.current) setError(nextError.message || "Unable to load seat availability");
      throw nextError;
    } finally {
      if (id === requestId.current) { setLoading(false); setRefreshing(false); }
    }
  }, [identity]);

  useEffect(() => { loaded.current = false; refetch().catch(() => {}); }, [identity, refetch]);

  useEffect(() => {
    if (!availability?.show?.showKey) return undefined;
    const socket = io(SOCKET_URL);
    const showKey = availability.show.showKey;
    const onAvailability = (next) => next?.show?.showKey === showKey && setAvailability(next);
    const onFocus = () => refetch().catch(() => {});
    socket.emit("show:join", showKey);
    socket.on("show:availability", onAvailability);
    socket.on("connect", onFocus);
    window.addEventListener("focus", onFocus);
    const interval = window.setInterval(() => { if (!socket.connected) onFocus(); }, 30000);
    return () => {
      socket.emit("show:leave", showKey);
      socket.disconnect();
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, [availability?.show?.showKey, refetch]);

  return { availability, bookedSeats: availability?.bookedSeats || [], loading, refreshing, error, refetch };
}
