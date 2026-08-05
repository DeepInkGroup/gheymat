"use client";

import { useCallback, useEffect, useState } from "react";
import type { Alert } from "./usePriceAlerts";

type AlertMap = Record<string, Alert>;

function urlBase64ToApplicationServerKey(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0))) as BufferSource;
}

async function postSubscription(sub: PushSubscription, bigMoveEnabled: boolean, alerts: AlertMap) {
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON(), bigMoveEnabled, alerts }),
  });
}

/**
 * Background push notifications: delivered even when the app/tab is
 * closed, via a service worker "push" event — unlike the existing
 * in-tab Notification API path, which only fires while a poll loop is
 * actively running in an open tab.
 */
export function usePushSubscription() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(
      typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    );
  }, []);

  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!cancelled) setSubscribed(!!sub);
      } catch {
        // ignore — treated as not-subscribed
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supported]);

  /** Re-sends the current subscription's settings (e.g. after alerts change) without re-prompting for permission. */
  const sync = useCallback(
    async (bigMoveEnabled: boolean, alerts: AlertMap) => {
      if (!supported) return;
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) await postSubscription(sub, bigMoveEnabled, alerts);
      } catch {
        // ignore — best-effort sync
      }
    },
    [supported]
  );

  const subscribe = useCallback(
    async (bigMoveEnabled: boolean, alerts: AlertMap): Promise<boolean> => {
      if (!supported) return false;
      if (Notification.permission === "denied") return false;
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return false;
      }

      try {
        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToApplicationServerKey(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
          });
        }
        await postSubscription(sub, bigMoveEnabled, alerts);
        setSubscribed(true);
        return true;
      } catch {
        return false;
      }
    },
    [supported]
  );

  const unsubscribe = useCallback(async () => {
    if (!supported) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
    } catch {
      // ignore
    } finally {
      setSubscribed(false);
    }
  }, [supported]);

  return { supported, subscribed, subscribe, unsubscribe, sync };
}
