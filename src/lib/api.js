const BASE = "";

// HTML escape utility
function escapeHtml(str) {
  if (typeof str !== "string") return str || "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function getToken() { if (typeof window === "undefined") return null; return localStorage.getItem("token"); }
async function api(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = "Bearer " + token;
  const res = await fetch(BASE + path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "请求失败°Ü");
  return data;
}
export function getMe() { return api("/api/auth/me"); }
export function register(e, p) { return api("/api/auth/register", { method: "POST", body: JSON.stringify({ email: e, password: p }) }); }
export function login(e, p) { return api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: e, password: p }) }); }
export function getCheckin() { return api("/api/checkin"); }
export function doCheckin(content, mood) { return api("/api/checkin", { method: "POST", body: JSON.stringify({ content, mood }) }); }
export function getPosts() { return api("/api/posts"); }
export function createPost(d) { return api("/api/posts", { method: "POST", body: JSON.stringify(d) }); }
export function getAchievements() { return api("/api/achievements"); }
export function getDailyTopic() { return api("/api/dailytopic"); }
export function getTreeholes() { return api("/api/treehole"); }
export function createTreehole(content, isPublic) { return api("/api/treehole", { method: "POST", body: JSON.stringify({ content, isPublic }) }); }
export function reactPost(postId) { return api("/api/reactions", { method: "POST", body: JSON.stringify({ postId }) }); }
export function getReactions(postId) { return api("/api/reactions?postId=" + postId); }
export function getSkills() { return api("/api/skills"); }
export function createSkill(d) { return api("/api/skills", { method: "POST", body: JSON.stringify(d) }); }
export function updateSkill(skillId, status) { return api("/api/skills", { method: "PUT", body: JSON.stringify({ skillId, status }) }); }
export function getCapsules() { return api("/api/capsule"); }
export function createCapsule(content, sendDate) { return api("/api/capsule", { method: "POST", body: JSON.stringify({ content, sendDate }) }); }
export function getState() { return api("/api/state"); }

export function getEncouragement() { return api("/api/encourage"); }


export function getMessages(withUserId) { return api("/api/messages?with=" + withUserId); }
export function sendMessage(toUserId, content) { return api("/api/messages", { method: "POST", body: JSON.stringify({ toUserId, content }) }); }

export function getNotifications() { return api("/api/notifications"); }
export function markNotifRead(notificationId) { return api("/api/notifications", { method: "POST", body: JSON.stringify({ action: "markRead", notificationId }) }); }

export async function resendVerification(email) {
  const res = await fetch("/api/auth/verify", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}
