#!/usr/bin/env node

// Minimal Beacon relay heartbeat daemon.
// Usage:
//   BEACON_RELAY_TOKEN=relay_xxx node relay-heartbeat-daemon.mjs bcn_agent_id

const agentId = process.argv[2];
const token = process.env.BEACON_RELAY_TOKEN;
const relayUrl = process.env.BEACON_RELAY_URL || "https://rustchain.org/beacon/relay/heartbeat";
const intervalMs = Number(process.env.BEACON_HEARTBEAT_INTERVAL_MS || 300000);
const startedAt = Date.now();

if (!agentId || !token) {
  console.error("Usage: BEACON_RELAY_TOKEN=relay_xxx node relay-heartbeat-daemon.mjs bcn_agent_id");
  process.exit(2);
}

async function heartbeat() {
  const payload = {
    agent_id: agentId,
    status: "alive",
    uptime: Math.max(1, Math.floor((Date.now() - startedAt) / 1000)),
    version: "1.0.0",
  };

  const response = await fetch(relayUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(async () => ({ raw: await response.text() }));
  console.log(JSON.stringify({
    sent_at: new Date().toISOString(),
    status: response.status,
    ok: Boolean(body.ok),
    beat_count: body.beat_count ?? null,
    agent_id: agentId,
  }));
}

await heartbeat();
setInterval(() => {
  heartbeat().catch((error) => {
    console.error(JSON.stringify({
      sent_at: new Date().toISOString(),
      ok: false,
      error: error.message,
      agent_id: agentId,
    }));
  });
}, intervalMs);
