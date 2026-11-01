// The tool park's catalog. Adding a tool = one entry here plus its route.
// status: live | beta | soon | owner (visible to the owner account only).
export const APPS = [
  { id: "mandala", path: "/mandala", icon: "▦", status: "live" },
  { id: "galaxy", path: "/studio", icon: "✧", status: "beta" },
  { id: "feed", path: "/feed", icon: "◎", status: "live", signedIn: true },
  { id: "topics", path: "/topics", icon: "◇", status: "live", signedIn: true },
  { id: "mind", path: "/mind", icon: "✺", status: "owner" },
];

/** The entries a visitor may see: owner-only tools stay hidden from everyone else. */
export function visibleApps(session) {
  return APPS.filter((app) => app.status !== "owner" || session?.owner === true);
}
