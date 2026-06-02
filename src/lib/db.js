const https = require("https");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://obzebmboykfsodovrrnw.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iemVibWJveWtmc29kb3Zycm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDEwODEsImV4cCI6MjA5NTkxNzA4MX0.FUGgcK4iZc7lm7I9oSVMcDcxMX0MTimUFFG4iSLMEuo";

const TABLE_MAP = {
  users: "users", checkIns: "checkins", posts: "posts", comments: "comments",
  treeholes: "treeholes", reactions: "reactions", skills: "skills",
  timeCapsules: "time_capsules", messages: "messages",
  shownEncouragements: "encouragements", pairs: "pairs",
  userLocations: "user_locations", notifications: "notifications",
};

var cache = null;
var loading = false;
var loadQueue = [];

function supabaseApi(method, table, body, params) {
  return new Promise(function (resolve, reject) {
    var path = "/rest/v1/" + table;
    if (params) path += "?" + params;
    var req = https.request({
      hostname: SUPABASE_URL.replace("https://", ""),
      path: path, method: method,
      headers: {
        "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json", "Prefer": "return=representation"
      }
    }, function (r) {
      var d = "";
      r.on("data", function (c) { d += c; });
      r.on("end", function () {
        try { resolve(JSON.parse(d)); } catch (e) { resolve(d ? [d] : []); }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function initCache() {
  cache = {
    users: [], checkIns: [], posts: [], comments: [], treeholes: [],
    reactions: [], skills: [], timeCapsules: [], messages: [],
    shownEncouragements: [], pairs: [], userLocations: [], notifications: []
  };
}

function getDb() {
  if (cache) return cache;
  initCache();
  if (!loading) {
    loading = true;
    supabaseApi("GET", "users", null, "select=*").then(function (d) {
      if (Array.isArray(d)) cache.users = d;
      return supabaseApi("GET", "checkins", null, "select=*");
    }).then(function (d) {
      if (Array.isArray(d)) cache.checkIns = d;
      return supabaseApi("GET", "posts", null, "select=*");
    }).then(function (d) {
      if (Array.isArray(d)) cache.posts = d;
      return supabaseApi("GET", "comments", null, "select=*");
    }).then(function (d) {
      if (Array.isArray(d)) cache.comments = d;
      return supabaseApi("GET", "treeholes", null, "select=*");
    }).then(function (d) {
      if (Array.isArray(d)) cache.treeholes = d;
      return supabaseApi("GET", "reactions", null, "select=*");
    }).then(function (d) {
      if (Array.isArray(d)) cache.reactions = d;
      return supabaseApi("GET", "skills", null, "select=*");
    }).then(function (d) {
      if (Array.isArray(d)) cache.skills = d;
      return supabaseApi("GET", "time_capsules", null, "select=*");
    }).then(function (d) {
      if (Array.isArray(d)) cache.timeCapsules = d;
      return supabaseApi("GET", "messages", null, "select=*");
    }).then(function (d) {
      if (Array.isArray(d)) cache.messages = d;
      return supabaseApi("GET", "encouragements", null, "select=*");
    }).then(function (d) {
      if (Array.isArray(d)) cache.shownEncouragements = d;
      return supabaseApi("GET", "pairs", null, "select=*");
    }).then(function (d) {
      if (Array.isArray(d)) cache.pairs = d;
      return supabaseApi("GET", "user_locations", null, "select=*");
    }).then(function (d) {
      if (Array.isArray(d)) cache.userLocations = d;
      return supabaseApi("GET", "notifications", null, "select=*");
    }).then(function (d) {
      if (Array.isArray(d)) cache.notifications = d;
      loading = false;
    });
  }
  return cache;
}

function saveDb(data) {
  cache = data;
  var tables = Object.keys(TABLE_MAP);
  tables.forEach(function (prop) {
    var table = TABLE_MAP[prop];
    var rows = data[prop] || [];
    supabaseApi("DELETE", table, null, "limit=100000").then(function () {
      if (rows.length > 0) {
        for (var i = 0; i < rows.length; i += 50) {
          supabaseApi("POST", table, rows.slice(i, i + 50));
        }
      }
    });
  });
}

function makeId(prefix) {
  return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

module.exports = { getDb, saveDb, makeId };