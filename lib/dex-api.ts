"use client";

import type { Side, OrderType } from "@/lib/matcher";

async function jsonOrThrow(r: Response) {
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error || `request failed (${r.status})`);
  return data;
}

export async function submitOrder(o: {
  pair: string;
  side: Side;
  type: OrderType;
  price: number;
  size: number;
  trader: string;
}) {
  return jsonOrThrow(
    await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(o),
    }),
  );
}

export async function getBook(pair: string) {
  return jsonOrThrow(await fetch(`/api/orders?pair=${encodeURIComponent(pair)}`));
}

export async function getFills(pair: string) {
  return jsonOrThrow(await fetch(`/api/orders?view=fills&pair=${encodeURIComponent(pair)}`));
}

export async function getMyOrders(trader: string, pair: string) {
  return jsonOrThrow(await fetch(`/api/orders?trader=${trader}&pair=${encodeURIComponent(pair)}`));
}

export async function cancelOrder(id: string, trader: string) {
  return jsonOrThrow(await fetch(`/api/orders/${id}?trader=${trader}`, { method: "DELETE" }));
}

/** All of a trader's orders across every market. */
export async function getMyOrdersAll(trader: string) {
  return jsonOrThrow(await fetch(`/api/orders?trader=${trader}`));
}

/** All fills involving a trader across every market. */
export async function getMyFills(trader: string) {
  return jsonOrThrow(await fetch(`/api/orders?trader=${trader}&view=fills`));
}

export async function getLeaderboard() {
  return jsonOrThrow(await fetch(`/api/leaderboard`));
}
