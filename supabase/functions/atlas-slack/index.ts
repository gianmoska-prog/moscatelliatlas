import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.3";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const slackToken = Deno.env.get("SLACK_BOT_TOKEN");
  if (!slackToken) return json({ error: "slack_not_configured" }, 503);

  const authorization = req.headers.get("Authorization") || "";
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
  const admin = createClient(url, serviceKey);
  const { data: auth, error: authError } = await userClient.auth.getUser();
  if (authError || !auth.user) return json({ error: "unauthorized" }, 401);

  const { data: profile } = await userClient.from("profiles").select("id,role,is_active").eq("id", auth.user.id).single();
  if (!profile?.is_active || !["founder", "partner"].includes(profile.role)) return json({ error: "forbidden" }, 403);

  let body: { contentId?: string; kind?: string; test?: boolean } = {};
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const routeKey = body.test ? "testing" : "updates";
  const { data: route } = await admin.from("slack_channel_routes").select("channel_id,channel_name,enabled").eq("route_key", routeKey).single();
  if (!route?.enabled || !route.channel_id) return json({ error: "slack_route_unavailable" }, 503);

  if (body.test) {
    const response = await postSlack(slackToken, route.channel_id, "MOSCATELLI Atlas integration verified.");
    return response.ok ? json({ ok: true, channel: route.channel_name, test: true }) : json({ error: "slack_delivery_failed", code: response.error }, 502);
  }

  if (!body.contentId || !["important", "required"].includes(body.kind || "")) return json({ error: "invalid_notification" }, 400);
  const { data: content, error: contentError } = await userClient.from("atlas_content")
    .select("id,slug,title,summary,content_type,metadata").eq("id", body.contentId).eq("content_type", "update").single();
  if (contentError || !content) return json({ error: "content_not_found" }, 404);
  const expectedKind = content.metadata?.updateType === "required" ? "required" : "important";
  if (body.kind !== expectedKind) return json({ error: "notification_kind_mismatch" }, 400);

  const publicUrl = Deno.env.get("ATLAS_PUBLIC_URL") || "https://gianmoska-prog.github.io/moscatelliatlas";
  const link = publicUrl ? `\n<${publicUrl.replace(/\/$/, "")}/#/updates?focus=${encodeURIComponent(content.slug)}|Open in Atlas>` : "";
  const prefix = body.kind === "required" ? "Required reading" : "Important Atlas update";
  const result = await postSlack(slackToken, route.channel_id, `*${prefix}: ${content.title}*\n${content.summary}${link}`);
  await admin.from("atlas_slack_deliveries").insert({
    requested_by: auth.user.id, content_id: content.id, notification_kind: body.kind,
    channel_route: routeKey, slack_ts: result.ts || null, status: result.ok ? "sent" : "failed",
    error_code: result.ok ? null : result.error,
  });
  return result.ok ? json({ ok: true, channel: route.channel_name }) : json({ error: "slack_delivery_failed", code: result.error }, 502);
});

async function postSlack(token: string, channel: string, text: string) {
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ channel, text, unfurl_links: false }),
  });
  return response.json();
}
