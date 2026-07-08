"use client";
// Credit system client helpers — balance fetch, Razorpay top-up purchase, refresh events.
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api/client";

export interface CreditsInfo {
  balance: number;
  allowance: number;
  plan: string;
  renews_at: string | null;
  costs: Record<string, number>;
  topups: { id: string; price_inr: number; credits: number }[];
}

export const CREDITS_CHANGED_EVENT = "mithra:credits-changed";
export const OUT_OF_CREDITS_EVENT = "mithra:out-of-credits";

export function notifyCreditsChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CREDITS_CHANGED_EVENT));
}

export async function fetchCredits(): Promise<CreditsInfo | null> {
  try {
    const { data } = await api.get("/user/credits");
    return data as CreditsInfo;
  } catch {
    return null;
  }
}

export function useCredits() {
  const [credits, setCredits] = useState<CreditsInfo | null>(null);

  const refresh = useCallback(() => {
    fetchCredits().then((c) => { if (c) setCredits(c); });
  }, []);

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener(CREDITS_CHANGED_EVENT, refresh);
    const interval = setInterval(refresh, 90_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(CREDITS_CHANGED_EVENT, refresh);
      clearInterval(interval);
    };
  }, [refresh]);

  return { credits, refresh };
}

/** Launch Razorpay checkout for a top-up pack. Resolves true on verified payment. */
export async function buyTopup(packId: string): Promise<boolean> {
  try {
    const { data } = await api.post("/payments/create-order", { plan: packId });
    if (!window.Razorpay) {
      await new Promise<void>((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        document.body.appendChild(script);
      });
    }
    return await new Promise<boolean>((resolve) => {
      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "Mithra AI",
        description: "Credit Top-up",
        order_id: data.order_id,
        prefill: { name: data.user_name, email: data.user_email },
        theme: { color: "#0F6E55" },
        modal: { ondismiss: () => resolve(false) },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await api.post("/payments/verify", { ...response, plan: packId });
            notifyCreditsChanged();
            resolve(true);
          } catch {
            resolve(false);
          }
        },
      };
      new window.Razorpay(options).open();
    });
  } catch {
    return false;
  }
}
