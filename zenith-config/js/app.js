"use strict";

"use strict";
/* ============ 注入数据（构建期） ============ */

/* ============ 全局 ============ */
let CONFIG = null;
let lastOfflineUsername = "";
const $ = id => document.getElementById(id);
const THEME_KEY = "zc_theme";
const manualFold = new Set();   // 手动折叠的节点路径
let foldAll = false;            // 全局折叠
const parentSwitches = {};      // 节点路径 -> 父开关当前值

function toast(msg, type) {
  const el = $("toast");
  el.textContent = msg;
  el.className = "show " + (type || "ok");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.className = "", 2600);
}
function deepClone(o) { return JSON.parse(JSON.stringify(o)); }
function getPath(obj, path) { return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj); }
function setPath(obj, path, val) {
  const keys = path.split(".");
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (typeof o[keys[i]] !== "object" || o[keys[i]] == null) o[keys[i]] = {};
    o = o[keys[i]];
  }
  o[keys[keys.length - 1]] = val;
}

/* ============ 顶层章节顺序 ============ */
const CHAPTERS = [
  ["authentication", "账号认证"], ["client", "客户端"], ["debug", "调试"], ["server", "服务端"],
  ["plugins", "插件"], ["interactiveTerminal", "交互终端"], ["inGameCommands", "游戏内命令"],
  ["theme", "主题配色"], ["discord", "Discord"], ["database", "数据库"], ["autoUpdater", "自动更新"]
];
const MODULE_NAMES = {
  "authentication": "账号认证", "client": "客户端", "debug": "调试", "server": "服务端",
  "plugins": "插件", "interactiveTerminal": "交互终端", "inGameCommands": "游戏内命令",
  "theme": "主题配色", "discord": "Discord", "database": "数据库", "autoUpdater": "自动更新",
  "client.server": "服务器连接", "client.connectionProxy": "连接Zen", "client.viaversion": "ViaVersion 客户端",
  "client.timeout": "连接超时", "client.ping": "心跳 Ping", "client.chatSigning": "聊天签名",
  "client.extra": "客户端扩展", "client.extra.antiafk": "反AFK", "client.extra.antiafk.actions": "反AFK 动作",
  "client.extra.spook": "惊吓 Spook", "client.extra.utility": "实用工具", "client.extra.utility.actions": "实用动作",
  "client.extra.utility.actions.autoDisconnect": "自动断开", "client.extra.utility.actions.activeHours": "在线时段",
  "client.extra.autoReconnect": "自动重连", "client.extra.autoRespawn": "自动重生",
  "client.extra.spammer": "刷屏 Spammer", "client.extra.autoReply": "自动回复", "client.extra.stalk": "追踪 Stalk",
  "client.extra.autoEat": "自动进食", "client.extra.autoFish": "自动钓鱼", "client.extra.killAura": "战斗辅助 KillAura",
  "client.extra.autoTotem": "自动图腾", "client.extra.antiLeak": "防泄漏", "client.extra.chat": "聊天增强",
  "client.extra.antiKick": "防踢", "client.extra.replayMod": "录像 Replay", "client.extra.coordObfuscation": "坐标混淆",
  "client.extra.actionLimiter": "动作限制", "client.extra.visualRange": "视觉范围", "client.extra.autoArmor": "自动穿甲",
  "client.extra.autoMend": "自动修补", "client.extra.queueWarning": "队列提醒", "client.extra.click": "点击模拟",
  "client.extra.sessionTimeLimit": "会话时限", "client.extra.autoOmen": "自动灾厄", "client.extra.pathfinder": "寻路 Pathfinder",
  "client.extra.spawnPatrol": "生成点巡逻", "client.extra.pearlLoader": "末影珍珠", "client.extra.waypoints": "路点",
  "client.extra.autoDrop": "自动丢弃", "client.extra.tasks": "任务系统",
  "client.inventory": "背包", "client.chatSchemas": "聊天架构", "client.keepAliveHandling": "保活 KeepAlive",
  "debug.packetLog": "抓包日志", "debug.packetLog.clientPacketLog": "客户端通道", "debug.packetLog.serverPacketLog": "服务端通道",
  "debug.server": "服务端缓存", "debug.server.cache": "区块缓存",
  "server.bind": "监听绑定", "server.extra": "服务端扩展", "server.extra.timeout": "超时",
  "server.extra.whitelist": "白名单", "server.extra.chatHistory": "聊天历史", "server.extra.serverSwitcher": "服务器切换",
  "server.ping": "Ping 响应", "server.viaversion": "ViaVersion 服务端", "server.spectator": "观战",
  "server.loginRateLimiter": "登录限流", "server.packetRateLimiter": "数据包限流", "server.chatSigning": "聊天签名",
  "discord.chatRelay": "聊天中继", "database.lock": "Redis 锁"
};
const MODULE_DESC = {
  "authentication": "账号登录与微软认证设置，正版/离线模式切换",
  "client": "Zen客户端侧配置：连接目标服务器、挂机模块、战斗与安全功能（核心）",
  "debug": "调试与排障工具，一般无需改动",
  "server": "Zen对外服务：玩家如何连接Zen、白名单与 Ping 响应",
  "plugins": "插件系统（测试版），仅 java 通道支持",
  "interactiveTerminal": "交互式终端界面设置",
  "inGameCommands": "游戏内命令开关与前缀",
  "theme": "通知与消息的颜色主题",
  "discord": "Discord 机器人：通知、提及与聊天中继",
  "database": "向 api.2b2t.vc 贡献数据（默认关闭，不收集任何数据）",
  "autoUpdater": "自动更新检查",
  "client.server": "Zen要连接的 MC 服务器",
  "client.connectionProxy": "通过 SOCKS5 等Zen连接目标服务器（可挂 Clash 加速）",
  "client.viaversion": "允许不同 MC 版本互相连接",
  "client.timeout": "与目标服务器连接的超时检测",
  "client.ping": "与目标服务器之间的保活心跳",
  "client.chatSigning": "聊天签名（聊天报告系统相关）",
  "client.extra": "客户端扩展功能集合，所有挂机/战斗/安全模块都在这里",
  "client.extra.antiafk": "防止被服务器判定为挂机而踢出",
  "client.extra.antiafk.actions": "反AFK 的具体动作（行走/挥手/旋转等）",
  "client.extra.spook": "吓唬进入视野的玩家（实验性娱乐功能）",
  "client.extra.utility": "实用工具集合",
  "client.extra.utility.actions": "实用动作配置",
  "client.extra.utility.actions.autoDisconnect": "满足条件时自动断开连接（保命用）",
  "client.extra.utility.actions.activeHours": "在设定时段自动登录",
  "client.extra.autoReconnect": "断线后自动重连",
  "client.extra.autoRespawn": "死亡后自动重生",
  "client.extra.spammer": "定时发送刷屏消息",
  "client.extra.autoReply": "收到私聊时自动回复",
  "client.extra.stalk": "追踪特定玩家的动态",
  "client.extra.autoEat": "血量/饥饿度低时自动进食",
  "client.extra.autoFish": "自动钓鱼，也能防挂机踢出",
  "client.extra.killAura": "自动攻击视野内的目标（战斗辅助）",
  "client.extra.autoTotem": "血量低时自动装备不死图腾",
  "client.extra.antiLeak": "拦截聊天中可能泄露坐标的消息",
  "client.extra.chat": "聊天增强：隐藏/前缀/过滤等功能",
  "client.extra.antiKick": "操控者长时间无操作时自动断开本地客户端",
  "client.extra.replayMod": "战斗回放录像（可发到 Discord）",
  "client.extra.coordObfuscation": "向不信任的玩家隐藏真实坐标（防偷家）",
  "client.extra.actionLimiter": "限制玩家可执行的动作与移动范围（防破坏）",
  "client.extra.visualRange": "玩家进入/离开视野时提醒",
  "client.extra.autoArmor": "自动穿上背包中最好的护甲",
  "client.extra.autoMend": "自动用经验修补带经验修补附魔的装备",
  "client.extra.queueWarning": "2b2t 排队位置到达设定值时提醒",
  "client.extra.click": "模拟点击/长按方块或实体",
  "client.extra.sessionTimeLimit": "2b2t 会话时限提醒与处理",
  "client.extra.autoOmen": "自动饮用不祥之兆药水（刷袭击用）",
  "client.extra.pathfinder": "寻路算法参数（供 Baritone 等使用）",
  "client.extra.spawnPatrol": "在出生点自动巡逻并攻击目标",
  "client.extra.pearlLoader": "自动使用末影珍珠传送",
  "client.extra.waypoints": "保存路点，可作寻路目标",
  "client.extra.autoDrop": "自动丢弃背包中的物品",
  "client.extra.tasks": "自动化任务系统（用命令编写）",
  "client.inventory": "背包操作与容器设置",
  "client.chatSchemas": "聊天解析模板（供聊天中继使用）",
  "client.keepAliveHandling": "保活机制（KeepAlive）模式",
  "debug.packetLog": "记录网络数据包（排查连接问题用）",
  "debug.packetLog.clientPacketLog": "Zen与目标服务器之间的数据包",
  "debug.packetLog.serverPacketLog": "Zen与玩家之间的数据包",
  "debug.server": "服务端调试设置",
  "debug.server.cache": "区块亮度与地图缓存",
  "server.bind": "Zen监听的地址与端口",
  "server.extra": "服务端扩展功能",
  "server.extra.timeout": "客户端连接超时检测",
  "server.extra.whitelist": "谁能连接Zen（白名单/黑名单）",
  "server.extra.chatHistory": "新玩家连接时补发最近的聊天记录",
  "server.extra.serverSwitcher": "可切换的服务器列表",
  "server.ping": "服务器列表 Ping 响应显示",
  "server.viaversion": "服务端侧版本兼容",
  "server.spectator": "观战者功能（以实体观战）",
  "server.loginRateLimiter": "限制同一地址的登录频率",
  "server.packetRateLimiter": "限制单个客户端的数据包速率（防崩溃）",
  "server.chatSigning": "服务端聊天签名模式",
  "discord.chatRelay": "把服务器聊天转发到 Discord 频道",
  "database.lock": "Redis 分布式锁（多实例防冲突）"
};
function groupName(path) {
  const segs = path.split(".");
  for (let n = Math.min(5, segs.length); n >= 1; n--) {
    const k = segs.slice(0, n).join(".");
    if (MODULE_NAMES[k]) return k;
  }
  return MODULE_NAMES[segs[0]] || prettyKey(segs[segs.length - 1]);
}
function prettyKey(key) {
  return key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_\-]/g, " ").replace(/^./, c => c.toUpperCase());
}
function nodeId(path) { return "node_" + path.replace(/[^a-zA-Z0-9]/g, "_"); }
function fieldId(path) { return "f_" + path.replace(/[^a-zA-Z0-9]/g, "_"); }
const ACCOUNT_TYPES = [["device_code", "device_code · 微软设备码(推荐)"], ["offline", "offline · 离线登录"], ["MSA", "MSA · 微软账户"], ["PRISM", "PRISM"]];

/* ============ 基础视图（首页）：关键必需字段 ============ */
const BASIC_FIELDS = [
  ["authentication.accountType", "select"],
  ["authentication.email", "text"],
  ["authentication.username", "text"],
  ["authentication.password", "text"],
  ["authentication.openBrowserOnLogin", "bool"],
  ["client.server.address", "text"],
  ["client.server.port", "num"],
  ["client.viaversion.enabled", "bool"],
  ["client.viaversion.protocolVersion", "num"],
  ["client.autoConnect", "bool"],
  ["client.extra.autoReconnect.enabled", "bool"],
  ["client.extra.antiafk.enabled", "bool"],
  ["client.extra.autoRespawn.enabled", "bool"],
  ["client.extra.autoEat.enabled", "bool"],
  ["client.extra.autoTotem.enabled", "bool"],
  ["client.extra.visualRange.enabled", "bool"],
  ["client.extra.sessionTimeLimit.enabled", "bool"],
  ["server.bind.port", "num"],
  ["server.extra.whitelist.enable", "bool"],
  ["server.extra.whitelist.autoAddClient", "bool"],
  ["server.extra.whitelist.whitelist", "arr"],
  ["server.ping.onlinePlayerCount", "bool"],
  ["server.ping.lanBroadcast", "bool"],
  ["server.dynamicQueueEtaEquation", "bool"],
  ["server.queueStatusRefreshWhileNotOn2b2t", "bool"],
  ["server.queueStatusRefreshMinutes", "num"],
  ["server.verifyUsers", "bool"],
  ["client.keepAliveHandling.keepAliveMode", "text"],
  ["client.keepAliveHandling.keepAliveQueueTimeoutMs", "num"],
  ["discord.enable", "bool"]
];
const B2B2T_PATHS = ["server.ping.lanBroadcast", "server.dynamicQueueEtaEquation", "server.queueStatusRefreshWhileNotOn2b2t", "server.queueStatusRefreshMinutes"];
const B2B2T_ON = { "server.ping.lanBroadcast": true, "server.dynamicQueueEtaEquation": true, "server.queueStatusRefreshWhileNotOn2b2t": true, "server.queueStatusRefreshMinutes": 5 };
const B2B2T_OFF = { "server.ping.lanBroadcast": false, "server.dynamicQueueEtaEquation": false, "server.queueStatusRefreshWhileNotOn2b2t": false, "server.queueStatusRefreshMinutes": 2147483647 };
const SCENARIOS = [
  { key: "b2b2t", icon: "🏆", name: "2b2t 正版挂机", desc: "正版账号 + 2b2t.org", accountType: "device_code", address: "2b2t.org", verify: true },
  { key: "offline", icon: "🏰", name: "离线插件服", desc: "离线账号 + AuthMe 密码（3C3U.ORG）", accountType: "offline", address: "3C3U.ORG", verify: false, keepAliveMode: "INDEPENDENT", keepAliveTimeout: 200000 },
  { key: "other", icon: "🌐", name: "其他正版服", desc: "正版账号 + 3C3U.ORG", accountType: "device_code", address: "3C3U.ORG", verify: true }
];
const REQUIRED_GROUPS = [
  ["账号登录", ["authentication.accountType", "authentication.email", "authentication.username", "authentication.password", "authentication.openBrowserOnLogin"]],
  ["服务器", ["client.server.address", "client.server.port", "client.viaversion.enabled", "client.viaversion.protocolVersion", "server.bind.port", "client.autoConnect", "server.extra.whitelist.whitelist"]]
];
const MORE_GROUPS = [
  ["挂机保护", ["client.extra.antiafk.enabled", "client.extra.autoRespawn.enabled", "client.extra.autoEat.enabled", "client.extra.autoTotem.enabled", "client.extra.autoReconnect.enabled"]],
  ["服务端接入", ["server.verifyUsers", "server.extra.whitelist.enable", "server.extra.whitelist.autoAddClient", "server.ping.onlinePlayerCount"]],
  ["连接保活", ["client.keepAliveHandling.keepAliveMode", "client.keepAliveHandling.keepAliveQueueTimeoutMs"]],
  ["提醒与通知", ["client.extra.visualRange.enabled", "client.extra.sessionTimeLimit.enabled", "discord.enable"]]
];
function renderBasic() {
  const root = $("view-basic");
  root.innerHTML = "";

  const layout = document.createElement("div");
  layout.className = "layout";

  // 左侧导航（与高级视图同款式）
  const aside = document.createElement("aside");
  aside.className = "sidenav";
  const ttl = document.createElement("div");
  ttl.className = "nav-title";
  ttl.textContent = "QUICK SETTINGS";
  aside.appendChild(ttl);
  const nav = document.createElement("nav");
  nav.id = "basicNav";
  [["场景模式", "bg-scenario", "1"], ["必填设置", "bg-required", "2"], ["更多设置", "bg-more", "3"]].forEach(([nm, id, no], i) => {
    const nb = document.createElement("button");
    nb.className = "nav-item nav-root" + (i === 0 ? " active" : "");
    nb.dataset.bnav = id;
    nb.innerHTML = '<span class="nav-no">' + no + '</span>' + nm;
    nb.addEventListener("click", () => {
      const t = $(id);
      if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    nav.appendChild(nb);
  });
  aside.appendChild(nav);
  layout.appendChild(aside);

  // 主区
  const main = document.createElement("main");
  main.className = "content";
  const intro = document.createElement("div");
  intro.className = "intro";
  intro.innerHTML = '<div class="it">ZenithProxy · Quick Config</div>' +
    '<p>选一个场景 → 补必填 → 下载。本页面中的项目都可以在这里配置；详细功能请前往 <a href="https://github.com/rfresh2/ZenithProxy" target="_blank" rel="noopener">ZenithProxy 官网</a> 了解。</p>';
  main.appendChild(intro);

  // 1. 场景模式
  const secS = document.createElement("section");
  secS.className = "chapter";
  secS.id = "bg-scenario";
  const headS = document.createElement("div");
  headS.className = "chapter-head";
  headS.innerHTML = '<span class="caret">▾</span><h2>场景模式</h2><span class="sec-count">选一个</span>';
  headS.addEventListener("click", () => secS.classList.toggle("collapsed"));
  secS.appendChild(headS);
  const bodyS = document.createElement("div");
  bodyS.className = "chapter-body";
  const sRow = document.createElement("div");
  sRow.className = "scenario-row";
  SCENARIOS.forEach(sc => {
    const card = document.createElement("div");
    card.className = "scenario-card" + (sc.key === "b2b2t" ? " active" : "");
    card.dataset.scenario = sc.key;
    card.innerHTML = '<div class="sc-icon">' + sc.icon + '</div><div class="sc-name">' + sc.name + '</div><div class="sc-desc">' + sc.desc + '</div>';
    card.addEventListener("click", () => {
      document.querySelectorAll(".scenario-card").forEach(c => c.classList.toggle("active", c === card));
      applyScenario(sc.key);
    });
    sRow.appendChild(card);
  });
  bodyS.appendChild(sRow);
  const sHint = document.createElement("div");
  sHint.className = "sc-hint";
  sHint.textContent = "场景会自动设置登录方式和服务器地址，之后仍可手动修改。";
  bodyS.appendChild(sHint);
  secS.appendChild(bodyS);
  main.appendChild(secS);

  // 2. 必填设置
  const secR = document.createElement("section");
  secR.className = "chapter";
  secR.id = "bg-required";
  const headR = document.createElement("div");
  headR.className = "chapter-head";
  headR.innerHTML = '<span class="caret">▾</span><h2>必填设置</h2><span class="sec-count">账号 + 服务器</span>';
  headR.addEventListener("click", () => secR.classList.toggle("collapsed"));
  secR.appendChild(headR);
  const bodyR = document.createElement("div");
  bodyR.className = "chapter-body";
  const tip = document.createElement("div");
  tip.className = "mode-tip";
  tip.id = "basicModeTip";
  bodyR.appendChild(tip);
  REQUIRED_GROUPS.forEach(g => {
    g[1].forEach(path => bodyR.appendChild(basicFieldRow(path)));
  });
  secR.appendChild(bodyR);
  main.appendChild(secR);

  // 3. 更多设置（默认折叠，展开后直接平铺）
  const secM = document.createElement("section");
  secM.className = "chapter";
  secM.id = "bg-more";
  const headM = document.createElement("div");
  headM.className = "chapter-head";
  headM.innerHTML = '<span class="caret">▾</span><h2>更多设置</h2><span class="sec-count">可选，已按场景配好</span>';
  headM.addEventListener("click", () => secM.classList.toggle("collapsed"));
  secM.appendChild(headM);
  const bodyM = document.createElement("div");
  bodyM.className = "chapter-body";
  MORE_GROUPS.forEach(g => {
    const gt = document.createElement("div");
    gt.className = "more-group-title";
    gt.textContent = g[0];
    bodyM.appendChild(gt);
    g[1].forEach(path => bodyM.appendChild(basicFieldRow(path)));
  });
  const b2Area = document.createElement("div");
  b2Area.className = "b2-area";
  b2Area.id = "b2b2tArea";
  const b2t = document.createElement("div");
  b2t.className = "b2-title";
  b2t.textContent = "2b2t 定制（非 2b2t 服务器时默认关闭）";
  b2Area.appendChild(b2t);
  B2B2T_PATHS.forEach(path => b2Area.appendChild(basicFieldRow(path)));
  bodyM.appendChild(b2Area);
  secM.appendChild(bodyM);
  main.appendChild(secM);

  // 4. 大下载按钮
  const bigBtn = document.createElement("button");
  bigBtn.className = "btn primary btn-download-big";
  bigBtn.id = "btnDownloadBig";
  bigBtn.textContent = "⬇ 生成并下载 config.json";
  bigBtn.addEventListener("click", downloadConfig);
  main.appendChild(bigBtn);
  const dHint = document.createElement("div");
  dHint.className = "download-hint";
  dHint.textContent = "下载后覆盖项目目录 config.json，重启Zen生效";
  main.appendChild(dHint);

  layout.appendChild(main);
  root.appendChild(layout);

  // 登录方式 / 服务器地址联动
  const bSel = $("b_authentication_accountType");
  if (bSel) bSel.addEventListener("change", applyBasicLinks);
  const bAddr = $("b_client_server_address");
  if (bAddr) bAddr.addEventListener("change", applyBasicLinks);
  applyBasicLinks();

  // 基础导航滚动高亮（与高级视图一致）
  const bnavItems = document.querySelectorAll("#basicNav .nav-item");
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const id = en.target.id;
      bnavItems.forEach(b => b.classList.toggle("active", b.dataset.bnav === id));
    });
  }, { rootMargin: "-15% 0px -70% 0px" });
  document.querySelectorAll("#view-basic .chapter").forEach(s => obs.observe(s));
}
function basicFieldRow(path) {
  const val = getPath(CONFIG, path);
  let type;
  if (Array.isArray(val)) type = "arr";
  else if (typeof val === "boolean") type = "bool";
  else if (typeof val === "number") type = "num";
  else type = "txt";
  const def = BASIC_FIELDS.find(f => f[0] === path);
  if (def && def[1] === "select") type = "select";
  return fieldRow({ path: path, value: val }, type, "b_");
}
function applyScenario(key) {
  const sc = SCENARIOS.find(s => s.key === key);
  if (!sc) return;
  // 直接写入 CONFIG，再全量刷新两视图控件，保证两视图一致
  setPath(CONFIG, "authentication.accountType", sc.accountType);
  if (sc.address) setPath(CONFIG, "client.server.address", sc.address);
  // 正版验证 + 保活：离线插件服关闭验证并使用独立保活；正版场景开启验证
  if (sc.verify !== undefined) setPath(CONFIG, "server.verifyUsers", sc.verify);
  if (sc.keepAliveMode) {
    setPath(CONFIG, "client.keepAliveHandling.keepAliveMode", sc.keepAliveMode);
    setPath(CONFIG, "client.keepAliveHandling.keepAliveQueueTimeoutMs", sc.keepAliveTimeout);
  }
  // 2b2t 定制项：2b2t 场景默认打开，其他服务器默认关闭（仍可手动改）
  const vals = key === "b2b2t" ? B2B2T_ON : B2B2T_OFF;
  Object.keys(vals).forEach(p => setPath(CONFIG, p, vals[p]));
  if (sc.accountType === "offline") syncWhitelistFromUsername(lastOfflineUsername);
  fillFields(CONFIG);
  markDirty();
  toast("已应用场景：" + sc.name);
}
function applyBasicLinks() {
  const sel = $("b_authentication_accountType");
  if (!sel) return;
  const online = sel.value !== "offline";
  const show = (p, v) => {
    const el = $("b_" + p.replace(/[^a-zA-Z0-9]/g, "_"));
    if (el && el.closest(".frow")) el.closest(".frow").style.display = v ? "" : "none";
  };
  show("authentication.email", online);
  show("authentication.openBrowserOnLogin", online);
  show("authentication.username", !online);
  show("authentication.password", !online);
  const tip = $("basicModeTip");
  if (tip) tip.textContent = online
    ? "正版登录：可用正版账号加入 2b2t 及所有正版服务器"
    : "离线登录：仅可连接支持离线登录的插件服务器，2b2t 需要正版账号；上方游戏名默认已加入白名单，新增玩家请在白名单中换行填写";
  // 2b2t 定制区始终显示（在更多设置末尾），值由场景切换控制
  const b2 = $("b2b2tArea");
  if (b2) b2.style.display = "";
}
// ===== 白名单格式（ZenithProxy 要求对象数组 {username, uuid, lastRefreshed}，uuid 不能为空） =====
// 离线 UUID：复刻 Java UUID.nameUUIDFromBytes("OfflinePlayer:" + 名字)，与离线客户端自身 uuid 一致
function offlineUUID(name) {
  var hex = md5("OfflinePlayer:" + name);
  return hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-3" + hex.slice(13, 16) + "-" +
    "8" + hex.slice(17, 20) + "-" + hex.slice(20, 32);
}
function whitelistLines(wl) {
  if (!Array.isArray(wl)) return "";
  return wl.map(e => (e && e.username) || "").filter(Boolean).join("\n");
}
function whitelistFromLines(text) {
  const cur = getPath(CONFIG, "server.extra.whitelist.whitelist");
  return String(text || "").split(/\r?\n/).map(s => s.trim()).filter(Boolean).map(n => {
    const exist = Array.isArray(cur) && cur.find(e => e && e.username && e.username.toLowerCase() === n.toLowerCase());
    if (exist) return { username: n, uuid: exist.uuid, lastRefreshed: exist.lastRefreshed };
    return { username: n, uuid: offlineUUID(n), lastRefreshed: Math.floor(Date.now() / 1000) };
  });
}
function normalizePlayerEntries(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(e => {
    if (typeof e === "string") {
      const n = e.trim();
      return n ? { username: n, uuid: offlineUUID(n), lastRefreshed: Math.floor(Date.now() / 1000) } : null;
    }
    if (e && typeof e === "object") {
      const n = (e.username || "").trim();
      if (!n) return null;
      return { username: n, uuid: e.uuid || offlineUUID(n), lastRefreshed: e.lastRefreshed || Math.floor(Date.now() / 1000) };
    }
    return null;
  }).filter(Boolean);
}
function normalizeConfigPlayerLists(cfg) {
  if (!cfg || !cfg.server || !cfg.server.extra || !cfg.server.extra.whitelist) return cfg;
  const w = cfg.server.extra.whitelist;
  if (Array.isArray(w.whitelist)) w.whitelist = normalizePlayerEntries(w.whitelist);
  if (Array.isArray(w.blacklist)) w.blacklist = normalizePlayerEntries(w.blacklist);
  return cfg;
}
function whitelistRefresh() {
  const wl = getPath(CONFIG, "server.extra.whitelist.whitelist");
  document.querySelectorAll('[data-fpath="server.extra.whitelist.whitelist"]').forEach(o => {
    if (o.id.indexOf("b_") === 0) o.value = whitelistLines(wl);
    else if (o.tagName === "TEXTAREA") o.value = JSON.stringify(wl);
  });
}
function syncPasswordFields(pw) {
  pw = pw || "";
  setPath(CONFIG, "authentication.password", pw);
  setPath(CONFIG, "authentication.serverPassword", pw);
  ["authentication.password", "authentication.serverPassword"].forEach(path => {
    document.querySelectorAll('[data-fpath="' + path + '"]').forEach(o => { o.value = pw; });
  });
}
// 离线模式：默认把当前游戏名加入白名单（仅追加不覆盖；修改上方游戏名不会自动新增，需手动改白名单）
function syncWhitelistFromUsername(oldName) {
  const sel = $("b_authentication_accountType");
  const un = getPath(CONFIG, "authentication.username") || "";
  lastOfflineUsername = un;
  if (!sel || sel.value !== "offline") return;
  const wlPath = "server.extra.whitelist.whitelist";
  let wl = getPath(CONFIG, wlPath);
  if (!Array.isArray(wl)) wl = [];
  wl = normalizePlayerEntries(wl).filter(e => !(oldName && e.username && e.username.toLowerCase() === oldName.toLowerCase()));
  if (un) {
    wl.unshift({ username: un, uuid: offlineUUID(un), lastRefreshed: Math.floor(Date.now() / 1000) });
  }
  setPath(CONFIG, wlPath, wl);
  whitelistRefresh();
  if (un && oldName && oldName.toLowerCase() !== un.toLowerCase()) {
    toast("白名单已同步为离线游戏名：" + un);
  } else if (un && !oldName) {
    toast("已把离线游戏名加入白名单：" + un);
  }
}
// 紧凑 MD5（RFC 1321），用于离线 UUID 生成
function md5(string) {
  function RotL(x, n) { return (x << n) | (x >>> (32 - n)); }
  function Add(x, y) {
    const l = (x & 0xffff) + (y & 0xffff), m = (x >>> 16) + (y >>> 16) + (l >>> 16);
    return ((m & 0xffff) << 16) | (l & 0xffff);
  }
  const F = (x, y, z) => (x & y) | (~x & z);
  const G = (x, y, z) => (x & z) | (y & ~z);
  const H = (x, y, z) => x ^ y ^ z;
  const I = (x, y, z) => y ^ (x | ~z);
  const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  const K = [0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391];
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  // UTF-8 编码
  const bytes = [];
  for (let i = 0; i < string.length; i++) {
    let c = string.charCodeAt(i);
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) { bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f)); }
    else { bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f)); }
  }
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 0; i < 8; i++) bytes.push((bitLen >>> (i * 8)) & 0xff);
  for (let off = 0; off < bytes.length; off += 64) {
    const M = [];
    for (let i = 0; i < 16; i++) {
      M[i] = bytes[off + i * 4] | (bytes[off + i * 4 + 1] << 8) | (bytes[off + i * 4 + 2] << 16) | (bytes[off + i * 4 + 3] << 24);
    }
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let f, g;
      if (i < 16) { f = F(B, C, D); g = i; }
      else if (i < 32) { f = G(B, C, D); g = (5 * i + 1) % 16; }
      else if (i < 48) { f = H(B, C, D); g = (3 * i + 5) % 16; }
      else { f = I(B, C, D); g = (7 * i) % 16; }
      const tmp = D;
      D = C; C = B;
      B = Add(B, RotL(Add(A, Add(f, Add(K[i], M[g]))), S[(i >> 4) * 4 + (i % 4)]));
      A = tmp;
    }
    a0 = Add(a0, A); b0 = Add(b0, B); c0 = Add(c0, C); d0 = Add(d0, D);
  }
  function hex(n) {
    const s = (n >>> 0).toString(16);
    return "00000000".slice(s.length) + s;
  }
  return hex(a0) + hex(b0) + hex(c0) + hex(d0);
}
let currentView = null;
function setView(v) {
  currentView = v;
  $("view-basic").style.display = v === "basic" ? "" : "none";
  $("view-advanced").style.display = v === "advanced" ? "" : "none";
  $("viewToggleBasic").classList.toggle("active", v === "basic");
  $("viewToggleAdv").classList.toggle("active", v === "advanced");
  $("btnExpandAll").style.display = v === "advanced" ? "" : "none";
  $("btnCollapseAll").style.display = v === "advanced" ? "" : "none";
  try { localStorage.setItem("zc_view", v); } catch (e) {}
  $("stFields").textContent = v === "basic" ? BASIC_FIELDS.length : (window.__totalAll || 0);
  if (v === "basic") toast("基础视图 · 常用设置"); else toast("高级视图 · 全部字段");
}

/* ============ 渲染：递归配置树 ============ */
function countLeaves(obj) {
  let n = 0;
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v !== null && typeof v === "object" && !Array.isArray(v)) n += countLeaves(v);
    else n++;
  }
  return n;
}

function fieldRow(f, type, prefix) {
  const meta = FIELD_META[f.path] || [prettyKey(f.path.split(".").pop()), ""];
  const id = (prefix || "f_") + f.path.replace(/[^a-zA-Z0-9]/g, "_");
  const row = document.createElement("div");
  row.className = "frow";
  const badgeMap = { bool: ["开关", "b-bool"], num: ["数字", "b-num"], txt: ["文本", ""], arr: ["数组", "b-arr"], select: ["选择", ""] };
  const metaEl = document.createElement("div");
  metaEl.className = "fmeta";
  metaEl.innerHTML = '<div class="fname">' + meta[0] +
    ' <span class="badge ' + (badgeMap[type] ? badgeMap[type][1] : "") + '">' + (badgeMap[type] ? badgeMap[type][0] : "") + '</span>' +
    ' <span class="fkey" title="' + f.path + '">' + f.path + '</span></div>' +
    (meta[1] ? '<div class="fdesc">' + meta[1] + '</div>' : "");
  row.appendChild(metaEl);
  const ctrl = document.createElement("div");
  ctrl.className = "fctrl";
  if (type === "bool") {
    const lab = document.createElement("label");
    lab.className = "switch";
    const inp = document.createElement("input");
    inp.type = "checkbox"; inp.id = id; inp.dataset.fpath = f.path;
    const track = document.createElement("span"); track.className = "track";
    lab.appendChild(inp); lab.appendChild(track);
    ctrl.appendChild(lab);
  } else if (type === "num") {
    const inp = document.createElement("input");
    inp.type = "number"; inp.id = id; inp.step = "any"; inp.dataset.fpath = f.path;
    ctrl.appendChild(inp);
  } else if (type === "arr") {
    const ta = document.createElement("textarea");
    ta.id = id; ta.spellcheck = false; ta.dataset.fpath = f.path;
    if (f.path === "server.extra.whitelist.whitelist" && (prefix || "f_") === "b_") {
      ta.rows = 5;
      ta.placeholder = "每行一个游戏名，例如：\nSteve\nAlex";
    }
    ctrl.appendChild(ta);
  } else if (type === "select" || f.path === "authentication.accountType") {
    const sel = document.createElement("select");
    sel.id = id; sel.dataset.fpath = f.path;
    ACCOUNT_TYPES.forEach(([v, l]) => {
      const o = document.createElement("option");
      o.value = v; o.textContent = l;
      sel.appendChild(o);
    });
    ctrl.appendChild(sel);
  } else {
    const inp = document.createElement("input");
    inp.type = "text"; inp.id = id; inp.dataset.fpath = f.path;
    ctrl.appendChild(inp);
  }
  row.appendChild(ctrl);
  return row;
}

function renderObject(container, obj, path) {
  const keys = Object.keys(obj);
  if (keys.length === 0) return;                 // 空对象跳过
  // 判断父开关：直接子字段中 key 为 enabled/enable 的布尔
  const swKey = keys.find(k => (k === "enabled" || k === "enable") && typeof obj[k] === "boolean");
  const swPath = swKey ? path + "." + swKey : null;

  // 子项：叶子字段（不含父开关）+ 子对象（保持 config 顺序）
  let total = 0;
  keys.forEach(k => {
    const v = obj[k];
    if (v !== null && typeof v === "object" && !Array.isArray(v)) total += countLeaves(v);
    else total++;
  });

  const node = document.createElement("div");
  node.className = "node";
  node.id = nodeId(path);
  node.dataset.node = path;

  // 节点头
  const head = document.createElement("div");
  head.className = "node-head";
  head.tabIndex = 0;
  const caret = document.createElement("span");
  caret.className = "caret"; caret.textContent = "▾";
  head.appendChild(caret);
  const nm = document.createElement("span");
  nm.className = "node-name"; nm.textContent = groupName(path);
  head.appendChild(nm);
  const dsc = MODULE_DESC[path];
  if (dsc) {
    const dd = document.createElement("span");
    dd.className = "node-desc"; dd.textContent = dsc; dd.title = dsc;
    head.appendChild(dd);
  }
  const pth = document.createElement("span");
  pth.className = "node-path"; pth.textContent = path;
  head.appendChild(pth);
  const cnt = document.createElement("span");
  cnt.className = "node-count"; cnt.textContent = total + " 项";
  head.appendChild(cnt);
  if (swPath) {
    const offTag = document.createElement("span");
    offTag.className = "node-off-tag"; offTag.textContent = "已停用";
    offTag.style.display = "none";
    head.appendChild(offTag);
    const lab = document.createElement("label");
    lab.className = "switch";
    lab.style.marginLeft = "auto";
    const inp = document.createElement("input");
    inp.type = "checkbox"; inp.id = fieldId(swPath); inp.dataset.fpath = swPath;
    const track = document.createElement("span"); track.className = "track";
    lab.appendChild(inp); lab.appendChild(track);
    head.appendChild(lab);
  }
  head.addEventListener("click", e => {
    if (e.target.closest(".switch")) return;    // 点开关不折叠
    toggleFold(path);
  });
  head.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleFold(path); }
  });
  node.appendChild(head);

  // 节点体
  const body = document.createElement("div");
  body.className = "node-body";
  keys.forEach(k => {
    const v = obj[k];
    if (swPath && k === swKey) return;          // 父开关已在头，不重复
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      renderObject(body, v, path + "." + k);
    } else {
      let type;
      if (Array.isArray(v)) type = "arr";
      else if (typeof v === "boolean") type = "bool";
      else if (typeof v === "number") type = "num";
      else type = "txt";
      body.appendChild(fieldRow({ path: path + "." + k, value: v }, type));
    }
  });
  node.appendChild(body);
  container.appendChild(node);

  // 记录父开关并初始化折叠状态
  if (swPath) {
    parentSwitches[path] = !!obj[swKey];
    const inp = node.querySelector('input[data-fpath="' + swPath + '"]');
    inp.checked = !!obj[swKey];
    inp.addEventListener("change", () => {
      parentSwitches[path] = inp.checked;
      node.classList.toggle("node-off", !inp.checked);
      node.querySelector(".node-off-tag").style.display = inp.checked ? "none" : "";
      if (!inp.checked) { manualFold.add(path); node.classList.add("collapsed"); }
      else { manualFold.delete(path); if (!foldAll) node.classList.remove("collapsed"); }
    });
  }
  applyNodeFold(node, path);
}

function applyNodeFold(node, path) {
  const sw = parentSwitches[path];
  const off = (sw === false);
  node.classList.toggle("node-off", off);
  const tag = node.querySelector(".node-off-tag");
  if (tag) tag.style.display = off ? "" : "none";
  node.classList.toggle("collapsed", foldAll || off || manualFold.has(path));
}

function toggleFold(path) {
  if (manualFold.has(path)) manualFold.delete(path);
  else manualFold.add(path);
  const node = $(nodeId(path));
  if (node) applyNodeFold(node, path);
}

/* ============ 导航滚动联动（浏览到哪、展开哪） ============ */
function navSetActive(rootEl, childEl) {
  document.querySelectorAll(".nav-wrap").forEach(w => w.classList.remove("open"));
  document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
  if (rootEl) { rootEl.classList.add("open"); rootEl.querySelector(".nav-root").classList.add("active"); }
  if (childEl) { childEl.classList.add("active"); }
}
let navObserver = null;
function initNavSync() {
  if (navObserver) navObserver.disconnect();
  const rootEls = {};
  document.querySelectorAll(".nav-wrap").forEach(w => { rootEls[w.dataset.mod] = w; });
  const childEls = {};
  document.querySelectorAll(".nav-child").forEach(c => { childEls[c.dataset.target] = c; });
  navObserver = new IntersectionObserver(entries => {
    let nodeHit = null, chHit = null;
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      if (en.target.classList.contains("node")) nodeHit = en.target;
      else if (en.target.classList.contains("chapter")) chHit = en.target;
    });
    if (nodeHit) {
      const path = nodeHit.dataset.node;
      const modKey = path.split(".")[0];
      navSetActive(rootEls[modKey] || null, childEls[nodeId(path)] || null);
    } else if (chHit) {
      const id = chHit.id.replace("chapter-", "");
      if (id === "json") { navSetActive(null, $("navJson")); return; }
      navSetActive(rootEls[id] || null, null);
    }
  }, { rootMargin: "-12% 0px -70% 0px" });
  document.querySelectorAll(".chapter").forEach(s => navObserver.observe(s));
  document.querySelectorAll(".node").forEach(n => navObserver.observe(n));
}

function renderTree(cfg) {
  const chaptersEl = $("chapters");
  const navEl = $("navList");
  chaptersEl.innerHTML = "";
  navEl.innerHTML = "";
  let totalAll = 0;
  let chCount = 0;

  CHAPTERS.forEach(([modKey, modName], ci) => {
    const obj = cfg[modKey];
    if (!obj || typeof obj !== "object" || Object.keys(obj).length === 0) return;
    const cnt = countLeaves(obj);
    totalAll += cnt; chCount++;
    const no = String(ci + 1).padStart(2, "0");

    // 导航根项（可折叠分支）
    const navWrap = document.createElement("div");
    navWrap.className = "nav-wrap";
    navWrap.dataset.mod = modKey;
    const nav = document.createElement("button");
    nav.className = "nav-item nav-root";
    nav.dataset.nav = "chapter-" + modKey;
    nav.innerHTML = '<span class="nav-caret">▸</span><span class="nav-no">' + no + '</span>' + modName +
      '<span class="nav-count">' + cnt + '</span>';
    nav.addEventListener("click", () => {
      const t = $("chapter-" + modKey);
      if (t) { t.querySelector(".chapter-head").scrollIntoView({ behavior: "smooth", block: "start" }); }
    });
    navWrap.appendChild(nav);
    const navCh = document.createElement("div");
    navCh.className = "nav-children";
    const navInner = document.createElement("div");
    navInner.className = "nav-inner";
    navCh.appendChild(navInner);
    navWrap.appendChild(navCh);
    navEl.appendChild(navWrap);

    // 章节
    const sec = document.createElement("section");
    sec.className = "chapter";
    sec.id = "chapter-" + modKey;
    const head = document.createElement("div");
    head.className = "chapter-head";
    head.dataset.fold = "chapter-" + modKey;
    const chDesc = MODULE_DESC[modKey];
    head.innerHTML = '<span class="caret">▾</span><h2>' + modName + '</h2>' +
      (chDesc ? '<span class="chapter-desc" title="' + chDesc + '">' + chDesc + '</span>' : '') +
      '<span class="sec-key">' + modKey + '</span><span class="sec-count">' + cnt + ' 项</span>';
    head.addEventListener("click", () => {
      const ch = head.parentElement;
      ch.classList.toggle("collapsed");
    });
    sec.appendChild(head);
    const body = document.createElement("div");
    body.className = "chapter-body";
    renderObject(body, obj, modKey);
    sec.appendChild(body);
    chaptersEl.appendChild(sec);

    // 导航子项：一级子对象
    Object.keys(obj).forEach(k => {
      const v = obj[k];
      if (v === null || typeof v !== "object" || Array.isArray(v)) return;
      const leafCnt = countLeaves(v);
      const child = document.createElement("button");
      child.className = "nav-item nav-child";
      child.dataset.target = nodeId(modKey + "." + k);
      child.innerHTML = '<span class="nav-no">·</span>' + (MODULE_NAMES[modKey + "." + k] || prettyKey(k)) +
        '<span class="nav-count">' + leafCnt + '</span>';
      child.addEventListener("click", () => {
        navSetActive(navWrap, child);
        const node = $(nodeId(modKey + "." + k));
        if (!node) return;
        // 展开祖先链
        const segs = (modKey + "." + k).split(".");
        for (let i = 1; i <= segs.length; i++) {
          const pp = segs.slice(0, i).join(".");
          if (parentSwitches[pp] === false) { manualFold.delete(pp); }
          manualFold.delete(pp);
        }
        applyAllFolds();
        node.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      navInner.appendChild(child);
    });
  });

  $("totalCount").textContent = totalAll;
  $("stFields").textContent = totalAll;
  window.__totalAll = totalAll;
  $("stChapters").textContent = chCount;
  initNavSync();
}

function applyAllFolds() {
  document.querySelectorAll(".node[data-node]").forEach(n => {
    applyNodeFold(n, n.dataset.node);
  });
}

/* ============ 填充 / 收集 ============ */
function fillFields(cfg) {
  document.querySelectorAll("[data-fpath]").forEach(el => {
    const path = el.dataset.fpath;
    const val = getPath(cfg, path);
    // 同步父开关状态（载入本地配置后折叠计算需要最新值）
    const segs = path.split(".");
    const key = segs[segs.length - 1];
    if ((key === "enabled" || key === "enable") && segs.length > 1) {
      const parent = segs.slice(0, -1).join(".");
      if (parent in parentSwitches) parentSwitches[parent] = !!val;
    }
    if (path === "authentication.password" || path === "authentication.serverPassword") {
      let pw = val;
      if (pw === "/login Aa123456") pw = "Aa123456";
      el.value = pw || "";
    } else if (el.type === "checkbox") {
      el.checked = !!val;
    } else if (el.tagName === "TEXTAREA") {
      if (path === "server.extra.whitelist.whitelist" && el.id.indexOf("b_") === 0) {
        el.value = whitelistLines(val);
      } else {
        el.value = JSON.stringify(val);
      }
    } else if (el.tagName === "SELECT") {
      // 兜底：config 里的枚举值不在选项列表时动态补一个，防止导出被改
      if (val != null && !Array.from(el.options).some(o => o.value === String(val))) {
        const o = document.createElement("option");
        o.value = String(val); o.textContent = String(val) + " · 保留原值";
        el.appendChild(o);
      }
      el.value = (val == null ? "" : val);
    } else {
      el.value = (val == null ? "" : val);
    }
  });
  $("jsonEditor").value = JSON.stringify(cfg, null, 2);
  lastOfflineUsername = getPath(cfg, "authentication.username") || "";
  applyAllFolds();
  applyBasicLinks();
}

function writeEl(el) {
  const path = el.dataset.fpath;
  let val;
  if (el.type === "checkbox") val = el.checked;
  else if (el.type === "number") {
    const v = el.value.trim();
    val = v === "" ? 0 : Number(v);
  } else if (el.tagName === "TEXTAREA") {
    if (path === "server.extra.whitelist.whitelist" && el.id.indexOf("b_") === 0) {
      // 基础视图白名单：每行一个名字 → 对象数组（保留已有条目的 UUID）
      val = whitelistFromLines(el.value);
    } else {
      try { val = JSON.parse(el.value || "[]"); }
      catch (e) { toast("数组字段 " + path + " JSON 解析失败，已跳过", "err"); return false; }
      if (path === "server.extra.whitelist.whitelist" || path === "server.extra.whitelist.blacklist") {
        val = normalizePlayerEntries(val);
      }
    }
  } else val = el.value;
  setPath(CONFIG, path, val);
  return true;
}
function collectForm() {
  if (!CONFIG) return;
  // 基础视图优先（两视图共有的字段以基础视图为准）
  const basicPaths = new Set();
  document.querySelectorAll("#view-basic [data-fpath]").forEach(el => {
    basicPaths.add(el.dataset.fpath);
    writeEl(el);
  });
  // 高级视图：跳过基础视图已覆盖的路径
  document.querySelectorAll("#view-advanced [data-fpath]").forEach(el => {
    if (basicPaths.has(el.dataset.fpath)) return;
    writeEl(el);
  });
  const wlPath = "server.extra.whitelist.whitelist";
  const blPath = "server.extra.whitelist.blacklist";
  const wl = getPath(CONFIG, wlPath);
  if (Array.isArray(wl)) setPath(CONFIG, wlPath, normalizePlayerEntries(wl));
  const bl = getPath(CONFIG, blPath);
  if (Array.isArray(bl)) setPath(CONFIG, blPath, normalizePlayerEntries(bl));
  $("jsonEditor").value = JSON.stringify(CONFIG, null, 2);
}

/* ============ 主题 ============ */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  $("stTheme").textContent = theme.toUpperCase();
  $("btnTheme").textContent = theme === "dark" ? "☀" : "◐";
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
}
function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
  if (saved === "light" || saved === "dark") { applyTheme(saved); return; }
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(prefersDark ? "dark" : "light");
}

/* ============ 未保存标记 ============ */
function markDirty() {
  const d = $("dirtyDot");
  if (d) d.style.display = "";
}
function clearDirty() {
  const d = $("dirtyDot");
  if (d) d.style.display = "none";
}

/* ============ 事件 ============ */
function downloadConfig() {
  if (!CONFIG) { toast("配置未就绪", "err"); return; }
  collectForm();
  const blob = new Blob([JSON.stringify(CONFIG, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "config.json";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  clearDirty();
  toast("已下载 config.json // 覆盖项目目录后重启Zen");
}
function loadLocalConfig() { $("fileInput").click(); }
function restoreDefault() {
  if (!confirm("恢复为网页内嵌的默认配置？当前修改将丢失。")) return;
  CONFIG = deepClone(DEFAULT_CONFIG);
  CONFIG.authentication.username = "";
  CONFIG.authentication.password = "";
  CONFIG.authentication.serverPassword = "";
  CONFIG.server.extra.whitelist.whitelist = [];
  CONFIG.server.extra.whitelist.enable = false;
  setPath(CONFIG, "authentication.accountType", "device_code");
  setPath(CONFIG, "client.server.address", "2b2t.org");
  setPath(CONFIG, "server.verifyUsers", true);
  Object.keys(B2B2T_ON).forEach(p => setPath(CONFIG, p, B2B2T_ON[p]));
  fillFields(CONFIG);
  document.querySelectorAll(".scenario-card").forEach(c => c.classList.toggle("active", c.dataset.scenario === "b2b2t"));
  $("stSrc").textContent = "DEFAULT";
  clearDirty();
  toast("已恢复默认配置");
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  // 任意配置控件修改 → 实时同步 CONFIG + 另一视图控件 + 标记未保存
  document.addEventListener("change", e => {
    const t = e.target;
    if (!t || !t.dataset || !t.dataset.fpath) return;
    if (!writeEl(t)) return; // 同步 CONFIG（数组解析失败则不继续）
    const p = t.dataset.fpath;
    // 同步另一视图同路径控件，保证两视图值一致（防止下载时互相覆盖）
    document.querySelectorAll('[data-fpath="' + p + '"]').forEach(o => {
      if (o === t) return;
      if (p === "server.extra.whitelist.whitelist") {
        // 基础视图=每行一个名字，高级视图=JSON 对象数组，互转
        if (o.id.indexOf("b_") === 0) {
          try { o.value = whitelistLines(JSON.parse(t.value || "[]")); } catch (e) { o.value = t.value; }
        } else {
          o.value = JSON.stringify(whitelistFromLines(t.value));
        }
        return;
      }
      if (o.type === "checkbox") o.checked = t.checked;
      else if (o.tagName === "TEXTAREA") o.value = t.value;
      else o.value = t.value;
    });
    markDirty();
    if (p === "authentication.accountType" || p === "client.server.address") applyBasicLinks();
    if (p === "authentication.password" || p === "authentication.serverPassword") syncPasswordFields(t.value);
    if (p === "authentication.username") syncWhitelistFromUsername(lastOfflineUsername);
  }, true);
  $("btnTheme").addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    applyTheme(cur === "dark" ? "light" : "dark");
  });
  $("btnExpandAll").addEventListener("click", () => {
    foldAll = false; manualFold.clear();
    applyAllFolds();
    document.querySelectorAll(".chapter").forEach(c => c.classList.remove("collapsed"));
    toast("已全部展开（父开关关闭的模块除外）");
  });
  $("btnCollapseAll").addEventListener("click", () => {
    foldAll = false; manualFold.clear();
    document.querySelectorAll(".node[data-node]").forEach(n => manualFold.add(n.dataset.node));
    applyAllFolds();
    document.querySelectorAll(".chapter").forEach(c => c.classList.add("collapsed"));
    toast("已全部折叠");
  });
  $("btnDownload").addEventListener("click", downloadConfig);
  $("btnLoadLocal").addEventListener("click", loadLocalConfig);
  $("btnRestore").addEventListener("click", restoreDefault);
  $("btnJsonFromForm").addEventListener("click", () => {
    if (!CONFIG) { toast("请先载入配置", "err"); return; }
    collectForm();
    toast("已从表单生成 JSON");
  });
  $("btnJsonToForm").addEventListener("click", () => {
    try {
      CONFIG = normalizeConfigPlayerLists(JSON.parse($("jsonEditor").value));
      fillFields(CONFIG);
      markDirty();
      toast("JSON 已回填表单");
    } catch (e) { toast("JSON 解析失败: " + e.message, "err"); }
  });
  $("fileInput").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        CONFIG = normalizeConfigPlayerLists(JSON.parse(reader.result));
        fillFields(CONFIG);
        $("stSrc").textContent = "LOCAL: " + file.name;
        clearDirty();
        toast("已载入本地配置");
      } catch (err) { toast("解析失败: " + err.message, "err"); }
    };
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  });
  document.querySelector('[data-nav="json"]').addEventListener("click", () => {
    navSetActive(null, $("navJson"));
    const t = $("chapter-json");
    if (t) t.querySelector(".chapter-head").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // 初始化
  CONFIG = deepClone(DEFAULT_CONFIG);
  CONFIG.authentication.username = "";
  CONFIG.authentication.password = "";
  CONFIG.authentication.serverPassword = "";
  CONFIG.server.extra.whitelist.whitelist = [];
  CONFIG.server.extra.whitelist.enable = false;
  setPath(CONFIG, "authentication.accountType", "device_code");
  setPath(CONFIG, "client.server.address", "2b2t.org");
  setPath(CONFIG, "server.verifyUsers", true);
  Object.keys(B2B2T_ON).forEach(p => setPath(CONFIG, p, B2B2T_ON[p]));
  renderTree(CONFIG);
  renderBasic();
  fillFields(CONFIG);
  // 离线模式：页面加载时用户名默认为空，白名单默认为空
  syncWhitelistFromUsername(lastOfflineUsername);

  // 视图切换（基础=首页默认，高级=全部字段）
  $("viewToggleBasic").addEventListener("click", () => setView("basic"));
  $("viewToggleAdv").addEventListener("click", () => setView("advanced"));
  let savedView = null;
  try { savedView = localStorage.getItem("zc_view"); } catch (e) {}
  setView(savedView === "advanced" ? "advanced" : "basic");
});
