const https = require("https");

// Supabase config
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://obzebmboykfsodovrrnw.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iemVibWJveWtmc29kb3Zycm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDEwODEsImV4cCI6MjA5NTkxNzA4MX0.FUGgcK4iZc7lm7I9oSVMcDcxMX0MTimUFFG4iSLMEuo";

// In-memory cache
var cache = null;
var cacheDirty = {};

// Table name mapping (JS property -> Supabase table)
const TABLE_MAP = {
  users: "users",
  checkIns: "checkins",
  posts: "posts",
  comments: "comments",
  treeholes: "treeholes",
  reactions: "reactions",
  skills: "skills",
  timeCapsules: "time_capsules",
  messages: "messages",
  shownEncouragements: "encouragements",
  pairs: "pairs",
  userLocations: "user_locations",
  notifications: "notifications",
  bottles: "treeholes",
  bottleReplies: "bottle_replies",
  bottlePickLogs: "bottle_pick_logs",
};

// Reverse: supabase table -> js property
const TABLE_REVERSE = {};
for (var k in TABLE_MAP) TABLE_REVERSE[TABLE_MAP[k]] = k;

function supabaseApi(method, table, body, params) {
  return new Promise(function(resolve, reject) {
    var path = "/rest/v1/" + table;
    if (params) path += "?" + params;
    
    var opts = {
      hostname: SUPABASE_URL.replace("https://", ""),
      path: path,
      method: method,
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      }
    };
    
    var req = https.request(opts, function(r) {
      var d = "";
      r.on("data", function(c) { d += c; });
      r.on("end", function() {
        try { resolve(JSON.parse(d)); }
        catch(e) { resolve(d ? [d] : []); }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function getDb() {
  // If cache exists and not dirty, return it
  if (cache) return cache;
  
  // Initialize empty db structure
  cache = {
    users: [], checkIns: [], posts: [], comments: [],
    treeholes: [], reactions: [], skills: [], timeCapsules: [],
    messages: [], shownEncouragements: [], pairs: [],
    userLocations: [], notifications: [],
    bottles: [], bottleReplies: [], bottlePickLogs: []
  };
  
  // Schedule async load from Supabase
  loadAllFromSupabase();
  
  return cache;
}

function loadAllFromSupabase() {
  var tables = Object.keys(TABLE_MAP).filter(function(k) { return k === TABLE_REVERSE[TABLE_MAP[k]]; });
  var loaded = 0;
  
  tables.forEach(function(prop) {
    var table = TABLE_MAP[prop];
    supabaseApi("GET", table, null, "select=*").then(function(data) {
      if (Array.isArray(data) && cache) {
        cache[prop] = data;
        // Also handle bottle aliases
        if (prop === "treeholes") {
          cache.bottles = data;
        }
      }
      loaded++;
    }).catch(function(err) {
      loaded++;
    });
  });
}

// Track what needs to be saved
var pendingSave = null;

function scheduleSave() {
  if (pendingSave) return;
  pendingSave = setTimeout(function() {
    pendingSave = null;
    flushToSupabase();
  }, 100);
}

function flushToSupabase() {
  if (!cache) return;
  
  var tables = Object.keys(TABLE_MAP).filter(function(k) { return k === TABLE_REVERSE[TABLE_MAP[k]]; });
  
  tables.forEach(function(prop) {
    var table = TABLE_MAP[prop];
    var data = cache[prop];
    
    // Delete all and re-insert
    supabaseApi("DELETE", table, null, "limit=100000").then(function() {
      if (data && data.length > 0) {
        // Insert in batches of 50
        var batchSize = 50;
        for (var i = 0; i < data.length; i += batchSize) {
          var batch = data.slice(i, i + batchSize);
          supabaseApi("POST", table, batch);
        }
      }
    });
  });
}

function saveDb(data) {
  cache = data;
  scheduleSave();
}

function makeId(prefix) {
  return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

module.exports = { getDb, saveDb, makeId };
