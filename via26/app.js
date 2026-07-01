import {
  bookingReminders,
  defaultBudgets,
  defaultDays,
  defaultExpenses,
  defaultFixedCosts,
  defaultSaves,
  weatherLocations
} from "./data.js";

const STORAGE_KEY = "via26-state-v1";
const STATE_VERSION = 4;
const DEFAULT_TRIP_ID = "trip-dubai-dolomites-venice-2026";
const WEATHER_KEY = "via26-weather-v1";
const THEME_KEY = "via26-theme-v1";
const DEFAULT_DAY_DISPLAY_NAMES = {
  "day-4": "Funes + Alpe di Siusi",
  "day-5": "Seceda + Ortisei"
};
const BUDGET_COLORS = ["#b79557", "#657f76", "#6e8d86", "#677f9e", "#4c7b78", "#a46d7b", "#c86b3c", "#58748f"];
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const icons = {
  map: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15M15 6v15"/></svg>',
  route: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M9 16h3a3 3 0 0 0 3-3V8"/></svg>',
  edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.5-1 10-10a2.12 2.12 0 0 0-3-3l-10 10L4 20Z"/><path d="m14 7 3 3"/></svg>',
  bed: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 19v-8m18 8v-6a2 2 0 0 0-2-2H8a3 3 0 0 0-3 3v5m0-4h16M8 11V8h4a2 2 0 0 1 2 2v1"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17 15 6m0 0H7m8 0v8"/><path d="M4 7v10h10"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v3M17 3v3M4 9h16"/><path d="M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><path d="M8 13h3M8 16h5"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18h10a4 4 0 0 0 .35-7.98A6 6 0 0 0 6 12a3 3 0 0 0 1 6Z"/><path d="M8 6V3M4.5 7.5 2.5 5.5M13 5l1.5-2"/></svg>'
};

const clone = value => JSON.parse(JSON.stringify(value));
const escapeHtml = value =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function migrateExpenses(expenses = []) {
  const currentBudgetIds = new Set(defaultBudgets.map(budget => budget.id));
  return Array.isArray(expenses)
    ? expenses
        .filter(expense => expense.id !== "expense-fixed" && expense.category !== "fixed")
        .map(expense => {
          if (currentBudgetIds.has(expense.category)) return expense;
          if (expense.category === "transport") return { ...expense, category: "parking" };
          if (expense.category === "activity") return { ...expense, category: "gondola" };
          return expense.category ? expense : null;
        })
        .filter(Boolean)
    : [];
}

function splitDestinations(value) {
  return String(value || "")
    .split(/[·,，、/|\n]+/)
    .map(item => item.trim())
    .filter(Boolean);
}

function toDateInputValue(date) {
  const copy = new Date(date);
  const year = copy.getFullYear();
  const month = String(copy.getMonth() + 1).padStart(2, "0");
  const day = String(copy.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateValue, offset) {
  const date = new Date(`${dateValue}T12:00:00`);
  date.setDate(date.getDate() + offset);
  return toDateInputValue(date);
}

function makeWeekdayLabel(dateValue) {
  return new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(new Date(`${dateValue}T12:00:00`));
}

function makeDateRangeLabel(startDate, endDate) {
  if (!startDate) return "DATES TBD";
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate || startDate}T12:00:00`);
  const month = new Intl.DateTimeFormat("en", { month: "short" }).format(start).toUpperCase();
  const startDay = String(start.getDate()).padStart(2, "0");
  const endDay = String(end.getDate()).padStart(2, "0");
  const year = end.getFullYear();
  if (startDate === endDate) return `${startDay} ${month} ${year}`;
  return `${startDay} - ${endDay} ${month} ${year}`;
}

function makeRouteLabels(destinations, days = []) {
  const names = splitDestinations(destinations);
  if (!names.length) {
    names.push(...[...new Set(days.map(day => day.city).filter(Boolean))]);
  }
  if (!names.length) return ["START", "PLAN", "GO"];
  const picks = [names[0], names[Math.floor((names.length - 1) / 2)], names[names.length - 1]];
  return picks.map(label => String(label || "PLAN").toUpperCase().slice(0, 12));
}

function getDayDisplayName(day) {
  return day?.displayName || day?.city || "待安排";
}

function normalizeDay(day) {
  if (!day || typeof day !== "object") return day;
  return {
    ...day,
    displayName: day.displayName || DEFAULT_DAY_DISPLAY_NAMES[day.id] || day.city || "待安排"
  };
}

function parseDayNames(value) {
  return String(value || "")
    .split(/\n+/)
    .map(item => item.trim())
    .filter(Boolean);
}

function applyDayDisplayNames(days, names) {
  if (!names.length) return days;
  return days.map((day, index) => ({
    ...day,
    displayName: names[index] || day.displayName || day.city
  }));
}

function getDefaultCoverImage(destinations = "") {
  const value = String(destinations).toLowerCase();
  if (value.includes("dubai") || value.includes("迪拜")) return "./assets/dubai-city-desert.jpg";
  if (value.includes("venice") || value.includes("venezia") || value.includes("威尼斯")) return "./assets/venice-gondola.jpg";
  return "./assets/dolomites-meadow.jpg";
}

function simpleHash(value) {
  let hash = 0;
  for (const char of String(value)) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0;
  return hash.toString(36);
}

function normalizeChecklistItem(item = {}, index = 0) {
  const source = typeof item === "string" ? { title: item } : item && typeof item === "object" ? item : {};
  const title = String(source.title || source.text || "新的待办事项").trim() || "新的待办事项";
  const detail = String(source.detail || source.note || "").trim();
  const status = String(source.status || "待处理").trim() || "待处理";
  const date = String(source.date || "").trim();
  const done = Boolean(source.done || source.completed || source.checked);
  const fallbackId = `check-${simpleHash(`${title}|${detail}|${status}|${date}|${index}`)}`;

  return {
    id: source.id || fallbackId,
    title,
    detail,
    status,
    date,
    done,
    doneAt: done ? source.doneAt || source.completedAt || new Date().toISOString() : "",
    createdAt: source.createdAt || new Date().toISOString(),
    updatedAt: source.updatedAt || source.createdAt || new Date().toISOString()
  };
}

function normalizeChecklist(items = []) {
  return Array.isArray(items) ? items.map(normalizeChecklistItem) : [];
}

function createChecklistItem() {
  return normalizeChecklistItem({
    id: `check-${crypto.randomUUID()}`,
    title: "新的待办事项",
    detail: "",
    status: "待处理",
    createdAt: new Date().toISOString()
  });
}

function createDefaultTrip(saved = {}) {
  const days = (Array.isArray(saved.days) ? saved.days : clone(defaultDays)).map(normalizeDay);
  return {
    id: saved.id || DEFAULT_TRIP_ID,
    name: saved.name || "Dubai · Dolomites · Venice",
    destinations: saved.destinations || "Dubai · Dolomites · Venice",
    startDate: saved.startDate || "2026-09-21",
    endDate: saved.endDate || "2026-09-28",
    dateLabel: saved.dateLabel || "21 - 28 SEP 2026",
    heroTitle: saved.heroTitle || "从沙漠到山脊，再走进水城。",
    routeLabels: saved.routeLabels || ["DXB", "DOLOMITES", "VCE"],
    coverImage: saved.coverImage || getDefaultCoverImage(saved.destinations || "Dubai · Dolomites · Venice"),
    avatarImage: saved.avatarImage || "",
    days,
    fixedCosts: Array.isArray(saved.fixedCosts) ? saved.fixedCosts : clone(defaultFixedCosts),
    budgets: Array.isArray(saved.budgets) ? saved.budgets : clone(defaultBudgets),
    expenses: migrateExpenses(saved.expenses || defaultExpenses),
    completed: Array.isArray(saved.completed) ? saved.completed : [],
    saves: Array.isArray(saved.saves) ? saved.saves : clone(defaultSaves),
    reminders: normalizeChecklist(Array.isArray(saved.reminders) ? saved.reminders : clone(bookingReminders)),
    createdAt: saved.createdAt || new Date().toISOString()
  };
}

function createTripBudgets(totalBudget) {
  const total = Number(totalBudget || 0);
  const splits = [
    ["food", "食物与咖啡", "食物", 0.36, "#b79557"],
    ["transport", "交通", "交通", 0.18, "#657f76"],
    ["stay", "住宿", "住宿", 0.28, "#6e8d86"],
    ["activity", "体验与门票", "体验", 0.14, "#677f9e"],
    ["other", "其他", "其他", 0.04, "#a46d7b"]
  ];
  return splits.map(([id, name, shortName, ratio, color]) => ({
    id,
    name,
    shortName,
    limit: total ? Math.round(total * ratio * 100) / 100 : 0,
    color
  }));
}

function generateTripDays({ startDate, endDate, destinations }) {
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate || startDate}T12:00:00`);
  const count = Number.isFinite(start.getTime()) && Number.isFinite(end.getTime())
    ? Math.max(1, Math.min(60, Math.floor((end - start) / 86400000) + 1))
    : 1;
  const cities = splitDestinations(destinations);
  const accents = ["#c86b3c", "#7d8d68", "#4c7b78", "#b28a52", "#65788a", "#a75d52", "#58748f", "#8b6a7d"];

  return Array.from({ length: count }, (_, index) => {
    const date = addDays(startDate, index);
    const city = cities[Math.min(index, Math.max(cities.length - 1, 0))] || "待安排";
    return {
      id: `day-${crypto.randomUUID()}`,
      date,
      weekday: makeWeekdayLabel(date),
      city,
      displayName: city,
      country: "",
      stay: "待安排住宿",
      theme: "自由安排",
      accent: accents[index % accents.length],
      weatherKey: "custom",
      items: []
    };
  });
}

function createBlankTrip(formData) {
  const name = String(formData.get("name") || "").trim() || "新的旅程";
  const destinations = String(formData.get("destinations") || "").trim() || "待安排目的地";
  const startDate = String(formData.get("startDate") || getLocalDateValue());
  const endDate = String(formData.get("endDate") || startDate);
  const days = applyDayDisplayNames(
    generateTripDays({ startDate, endDate, destinations }),
    parseDayNames(formData.get("dayNames"))
  );

  return {
    id: `trip-${crypto.randomUUID()}`,
    name,
    destinations,
    startDate,
    endDate,
    dateLabel: makeDateRangeLabel(startDate, endDate),
    heroTitle: String(formData.get("heroTitle") || "").trim() || "新的旅程，从这里开始。",
    routeLabels: makeRouteLabels(destinations, days),
    coverImage: getDefaultCoverImage(destinations),
    avatarImage: "",
    days,
    fixedCosts: [],
    budgets: createTripBudgets(formData.get("budget")),
    expenses: [],
    completed: [],
    saves: [],
    reminders: [],
    createdAt: new Date().toISOString()
  };
}

function normalizeTrip(trip) {
  if (!trip || typeof trip !== "object") return createDefaultTrip();
  const days = Array.isArray(trip.days) ? trip.days.map(normalizeDay) : [];
  const destinations = trip.destinations || [...new Set(days.map(day => day.city).filter(Boolean))].join(" · ") || "待安排目的地";
  const startDate = trip.startDate || days[0]?.date || "";
  const endDate = trip.endDate || days[days.length - 1]?.date || startDate;

  return {
    id: trip.id || `trip-${crypto.randomUUID()}`,
    name: trip.name || destinations || "未命名旅程",
    destinations,
    startDate,
    endDate,
    dateLabel: trip.dateLabel || makeDateRangeLabel(startDate, endDate),
    heroTitle: trip.heroTitle || "新的旅程，从这里开始。",
    routeLabels: Array.isArray(trip.routeLabels) ? trip.routeLabels : makeRouteLabels(destinations, days),
    coverImage: trip.coverImage || getDefaultCoverImage(destinations),
    avatarImage: trip.avatarImage || "",
    days,
    fixedCosts: Array.isArray(trip.fixedCosts) ? trip.fixedCosts : [],
    budgets: Array.isArray(trip.budgets) ? trip.budgets : createTripBudgets(0),
    expenses: migrateExpenses(trip.expenses),
    completed: Array.isArray(trip.completed) ? trip.completed : [],
    saves: Array.isArray(trip.saves) ? trip.saves : [],
    reminders: normalizeChecklist(trip.reminders),
    createdAt: trip.createdAt || new Date().toISOString()
  };
}

function loadRootState() {
  const fallbackTrip = createDefaultTrip();
  const fallback = {
    version: STATE_VERSION,
    activeTripId: fallbackTrip.id,
    trips: [fallbackTrip]
  };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return fallback;

    if (Array.isArray(saved.trips)) {
      const trips = saved.trips.map(normalizeTrip).filter(trip => trip.days);
      if (!trips.length) return fallback;
      const activeTripId = trips.some(trip => trip.id === saved.activeTripId) ? saved.activeTripId : trips[0].id;
      return { version: STATE_VERSION, activeTripId, trips };
    }

    if (Array.isArray(saved.days)) {
      const migratedTrip = createDefaultTrip(saved);
      return { version: STATE_VERSION, activeTripId: migratedTrip.id, trips: [migratedTrip] };
    }

    return fallback;
  } catch {
    return fallback;
  }
}

function loadWeather() {
  try {
    return JSON.parse(localStorage.getItem(WEATHER_KEY)) || { updatedAt: 0, locations: {} };
  } catch {
    return { updatedAt: 0, locations: {} };
  }
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

let rootState = loadRootState();
let state = getActiveTrip();
let weatherState = loadWeather();
let activeTheme = loadTheme();
let activeView = location.hash.replace("#", "") || "home";
let openDays = new Set();
let deferredInstallPrompt = null;
let toastTimer = null;
let dragState = null;
let htmlDragState = null;

const dateFormatter = new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric" });
const fullDateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short"
});

function formatChecklistRecord(value) {
  if (!value) return "未完成";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "已完成";
  return `完成于 ${dateFormatter.format(date)}`;
}

function saveState(message = "已自动保存") {
  rootState.version = STATE_VERSION;
  rootState.activeTripId = state.id;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rootState));
  const syncState = $("#sync-state");
  if (syncState) {
    syncState.innerHTML = `<i></i> ${escapeHtml(message)}`;
  }
}

function getActiveTrip() {
  return rootState.trips.find(trip => trip.id === rootState.activeTripId) || rootState.trips[0];
}

function applyTheme(theme) {
  activeTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = activeTheme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", activeTheme === "dark" ? "#0e1211" : "#f3efe8");
  localStorage.setItem(THEME_KEY, activeTheme);

  const toggle = $("#theme-toggle");
  const label = $("#theme-toggle-label");
  if (toggle) toggle.setAttribute("aria-pressed", String(activeTheme === "dark"));
  if (label) label.textContent = activeTheme === "dark" ? "日间" : "夜间";
}

function toggleTheme() {
  applyTheme(activeTheme === "dark" ? "light" : "dark");
  showToast(activeTheme === "dark" ? "已切换暗黑模式" : "已切换日间模式");
}

function imageToAverageColor(src) {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 24;
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(image, 0, 0, size, size);
        const pixels = context.getImageData(0, 0, size, size).data;
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;

        for (let index = 0; index < pixels.length; index += 16) {
          const alpha = pixels[index + 3];
          if (alpha < 80) continue;
          r += pixels[index];
          g += pixels[index + 1];
          b += pixels[index + 2];
          count += 1;
        }

        if (!count) {
          resolve(null);
          return;
        }

        resolve({
          r: Math.round(r / count),
          g: Math.round(g / count),
          b: Math.round(b / count)
        });
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function applyPhotoColor(color) {
  const fallback = color || { r: 76, g: 112, b: 104 };
  const darken = factor => ({
    r: Math.max(0, Math.round(fallback.r * factor)),
    g: Math.max(0, Math.round(fallback.g * factor)),
    b: Math.max(0, Math.round(fallback.b * factor))
  });
  const soften = {
    r: Math.min(255, Math.round((fallback.r + 244) / 2)),
    g: Math.min(255, Math.round((fallback.g + 240) / 2)),
    b: Math.min(255, Math.round((fallback.b + 231) / 2))
  };
  const deep = darken(0.48);
  document.documentElement.style.setProperty("--photo-rgb", `${fallback.r}, ${fallback.g}, ${fallback.b}`);
  document.documentElement.style.setProperty("--photo-soft-rgb", `${soften.r}, ${soften.g}, ${soften.b}`);
  document.documentElement.style.setProperty("--photo-deep-rgb", `${deep.r}, ${deep.g}, ${deep.b}`);
}

async function applyTripPhotoTheme() {
  const tripId = state.id;
  const color = await imageToAverageColor(state.coverImage || getDefaultCoverImage(state.destinations));
  if (state.id !== tripId) return;
  applyPhotoColor(color);
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: value % 1 ? 2 : 0
  }).format(value);
}

function parseStartMinutes(value) {
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function getScheduledItems() {
  const result = [];

  state.days.forEach(day => {
    let rollover = 0;
    let previousMinutes = -1;

    day.items.forEach((item, index) => {
      let minutes = parseStartMinutes(item.time);
      if (minutes === null) minutes = previousMinutes >= 0 ? previousMinutes + 30 : 23 * 60 + 59;
      if (index > 0 && minutes + rollover * 1440 < previousMinutes - 360) rollover += 1;
      const adjustedMinutes = minutes + rollover * 1440;
      previousMinutes = adjustedMinutes;

      const start = new Date(`${day.date}T00:00:00`);
      start.setMinutes(adjustedMinutes);
      result.push({ day, item, start });
    });
  });

  return result;
}

function getNextPlan() {
  const now = new Date();
  const scheduled = getScheduledItems();
  const upcoming = scheduled.find(entry => entry.start >= now && !state.completed.includes(entry.item.id));
  if (upcoming) return upcoming;

  const unfinished = scheduled.find(entry => !state.completed.includes(entry.item.id));
  return unfinished || null;
}

function getCountdown(target) {
  if (!target) return { value: "完成", label: "旅程已结束" };
  const difference = target.getTime() - Date.now();
  if (difference <= 0) return { value: "现在", label: "准备出发" };

  const minutes = Math.floor(difference / 60000);
  if (minutes < 60) return { value: `${minutes} 分`, label: "距离下一站" };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { value: `${hours} 小时`, label: "距离下一站" };
  const days = Math.ceil(hours / 24);
  return { value: `${days} 天`, label: "距离启程" };
}

function getBudgetStats() {
  const fixedSpent = state.fixedCosts.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const tripBudget = state.budgets.reduce((sum, budget) => sum + Number(budget.limit || 0), 0);
  const tripSpent = state.expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const tripRemaining = tripBudget - tripSpent;
  return {
    fixedSpent,
    tripBudget,
    tripSpent,
    tripRemaining,
    totalPlanned: fixedSpent + tripBudget,
    percent: tripBudget ? (tripSpent / tripBudget) * 100 : 0
  };
}

function getBudgetCategoryStats(budget, excludeExpenseId = "") {
  const spent = state.expenses
    .filter(expense => expense.category === budget.id && expense.id !== excludeExpenseId)
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const remaining = Number(budget.limit || 0) - spent;
  return {
    spent,
    remaining,
    percent: budget.limit ? (spent / budget.limit) * 100 : 0
  };
}

function createBudgetCategory({ name, limit }) {
  const cleanName = String(name || "").trim();
  const amount = Number(limit || 0);
  if (!cleanName || !Number.isFinite(amount) || amount < 0) return null;

  return {
    id: `budget-${crypto.randomUUID()}`,
    name: cleanName,
    shortName: cleanName.length > 12 ? cleanName.slice(0, 12) : cleanName,
    limit: Math.round(amount * 100) / 100,
    color: BUDGET_COLORS[state.budgets.length % BUDGET_COLORS.length]
  };
}

function extractFirstUrl(value) {
  const match = String(value || "").match(/https?:\/\/[^\s"'<>]+/i);
  return match ? match[0].replace(/[),.，。]+$/u, "") : "";
}

function normalizeUrlInput(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(candidate).href;
  } catch {
    return raw;
  }
}

function titleFromUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "旅行灵感";
  }
}

function removeUrlFromText(text, url) {
  return String(text || "").replace(url || extractFirstUrl(text), "").trim();
}

function inferSaveSource(url = "", text = "") {
  const value = `${url} ${text}`.toLowerCase();
  if (value.includes("xiaohongshu") || value.includes("xhslink") || value.includes("xhs.cn")) return "xhs";
  if (value.includes("instagram.com") || value.includes("instagr.am")) return "instagram";
  if (value.includes("http")) return "web";
  return "other";
}

function getSaveSourceLabel(source) {
  const labels = {
    xhs: "XHS",
    instagram: "Instagram",
    web: "Web",
    other: "Other"
  };
  return labels[source] || labels.other;
}

function getSaveDayLabel(dayId) {
  const day = state.days.find(entry => entry.id === dayId);
  if (!day) return "未安排日期";
  return `${dateFormatter.format(new Date(`${day.date}T12:00:00`))} · ${getDayDisplayName(day)}`;
}

function createSaveRecord({ title, url, source, note, dayId }) {
  const normalizedUrl = normalizeUrlInput(url);
  const cleanTitle = String(title || "").trim() || titleFromUrl(normalizedUrl);
  return {
    id: `save-${crypto.randomUUID()}`,
    title: cleanTitle,
    url: normalizedUrl,
    source: source || inferSaveSource(normalizedUrl, note),
    note: String(note || "").trim(),
    dayId: dayId || "",
    createdAt: new Date().toISOString()
  };
}

function appleMapsPlace(query) {
  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
}

function appleMapsDirections(query, type = "car") {
  const mode = type === "walk" ? "w" : ["train", "boat", "cable", "transit"].includes(type) ? "r" : "d";
  return `https://maps.apple.com/?daddr=${encodeURIComponent(query)}&dirflg=${mode}`;
}

function getDayNumber(date) {
  return new Date(`${date}T12:00:00`).getDate();
}

function getDayMonth(date) {
  return new Intl.DateTimeFormat("en", { month: "short" })
    .format(new Date(`${date}T12:00:00`))
    .toUpperCase();
}

function getSceneForDay(day) {
  if (day.weatherKey === "dubai") return {
    name: "Dubai",
    image: "var(--scene-dubai-image)",
    position: "center center"
  };
  if (day.weatherKey === "venice") return {
    name: "Venice",
    image: "var(--scene-venice-image)",
    position: "center center"
  };
  return {
    name: "Dolomites",
    image: "var(--scene-dolomites-image)",
    position: "center center"
  };
}

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTripStartDateValue() {
  if (state.startDate) return state.startDate;
  const dates = state.days.map(day => day.date).filter(Boolean).sort();
  return dates[0] || "";
}

function getTripStartCountdown() {
  const startDateValue = getTripStartDateValue();
  if (!startDateValue) return null;

  const today = new Date(`${getLocalDateValue()}T12:00:00`);
  const start = new Date(`${startDateValue}T12:00:00`);
  const days = Math.ceil((start.getTime() - today.getTime()) / 86400000);
  if (days <= 0) return null;

  return {
    days,
    start,
    dateValue: startDateValue
  };
}

function getTripDestinations() {
  return state.destinations || [...new Set(state.days.map(day => day.city).filter(Boolean))].join(" · ") || "待安排目的地";
}

function getTripDateLabel() {
  return state.dateLabel || makeDateRangeLabel(state.startDate || state.days[0]?.date, state.endDate || state.days[state.days.length - 1]?.date);
}

function renderTripHub() {
  const coverImage = state.coverImage || getDefaultCoverImage(state.destinations);
  const avatarImage = state.avatarImage || "";
  const avatarFallback = $("#trip-avatar-fallback");
  const avatarElement = $("#trip-avatar-image");

  $("#trip-cover-image").src = coverImage;
  avatarElement.src = avatarImage;
  avatarElement.hidden = !avatarImage;
  if (avatarFallback) {
    avatarFallback.textContent = String(state.name || "旅").trim().slice(0, 1).toUpperCase() || "旅";
    avatarFallback.hidden = Boolean(avatarImage);
  }
  $("#active-trip-name").textContent = state.name || "未命名旅程";
  $("#active-trip-meta").textContent = `${getTripDateLabel()} · ${state.days.length} 天 · ${getTripDestinations()}`;
  $("#trip-select").innerHTML = rootState.trips
    .map(trip => `<option value="${trip.id}" ${trip.id === state.id ? "selected" : ""}>${escapeHtml(trip.name || "未命名旅程")}</option>`)
    .join("");
  applyTripPhotoTheme();
}

function switchTrip(tripId) {
  const nextTrip = rootState.trips.find(trip => trip.id === tripId);
  if (!nextTrip || nextTrip.id === state.id) return;
  rootState.activeTripId = nextTrip.id;
  state = nextTrip;
  openDays = new Set();
  saveState("已切换旅程");
  populateFormOptions();
  renderHome();
  renderItinerary();
  renderWallet();
  renderSaves();
  renderWeather();
  switchView("home");
  showToast(`已切换到 ${state.name}`);
}

function switchView(view, updateHash = true) {
  const validView = ["home", "itinerary", "wallet", "saves", "weather"].includes(view) ? view : "home";
  activeView = validView;
  $$(".view").forEach(section => section.classList.toggle("is-active", section.dataset.view === validView));
  $$(".nav-item").forEach(button => button.classList.toggle("is-active", button.dataset.nav === validView));
  if (updateHash) history.replaceState(null, "", `#${validView}`);
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (validView === "itinerary") renderItinerary();
  if (validView === "wallet") renderWallet();
  if (validView === "saves") renderSaves();
  if (validView === "weather") renderWeather();
}

function renderHome() {
  renderTripHub();

  const next = getNextPlan();
  const countdown = getCountdown(next?.start);
  const tripStartCountdown = getTripStartCountdown();
  const nextCard = $("#next-card");
  const hasPlanItems = state.days.some(day => Array.isArray(day.items) && day.items.length);

  if (tripStartCountdown) {
    nextCard.innerHTML = `
      <div class="next-icon">${icons.calendar}</div>
      <div class="next-copy">
        <small>你的旅程即将开始</small>
        <h2>倒数 ${escapeHtml(tripStartCountdown.days)} 天</h2>
        <p>还有 ${escapeHtml(tripStartCountdown.days)} 天出发 · ${escapeHtml(fullDateFormatter.format(tripStartCountdown.start))} · ${escapeHtml(getTripDestinations())}</p>
      </div>
      <div class="next-meta">
        <div class="countdown">
          <strong>${escapeHtml(tripStartCountdown.days)}</strong>
          <span>天后出发</span>
        </div>
        <button class="map-button" data-go="itinerary" type="button">
          ${icons.map} 查看行程
        </button>
      </div>
    `;
  } else if (!next && !hasPlanItems) {
    nextCard.innerHTML = `
      <div class="next-icon">${icons.next}</div>
      <div class="next-copy">
        <small>READY TO PLAN</small>
        <h2>这趟旅程还没有行程</h2>
        <p>先建立每天的日期，再把收藏或地点加入行程。</p>
      </div>
      <div class="next-meta">
        <button class="primary-button" id="empty-add-plan-button" type="button">新增第一站</button>
      </div>
    `;
  } else if (!next) {
    nextCard.innerHTML = `
      <div class="next-icon">${icons.next}</div>
      <div class="next-copy">
        <small>JOURNEY COMPLETE</small>
        <h2>这趟旅程已经圆满完成</h2>
        <p>所有行程都已打勾。</p>
      </div>
    `;
  } else {
    nextCard.innerHTML = `
      <div class="next-icon">${icons.next}</div>
      <div class="next-copy">
        <small>NEXT ON THE JOURNEY · ${escapeHtml(next.day.weekday)} ${escapeHtml(next.item.time)}</small>
        <h2>${escapeHtml(next.item.title)}</h2>
        <p>${escapeHtml(next.item.location)} · ${escapeHtml(getDayDisplayName(next.day))}</p>
      </div>
      <div class="next-meta">
        <div class="countdown">
          <strong>${escapeHtml(countdown.value)}</strong>
          <span>${escapeHtml(countdown.label)}</span>
        </div>
        <a class="map-button" href="${appleMapsDirections(next.item.mapQuery || next.item.location, next.item.type)}" target="_blank" rel="noreferrer">
          ${icons.route} 带我去
        </a>
      </div>
    `;
  }

  $("#journey-heading").textContent = "旅程路线";
  $("#journey-strip").innerHTML = state.days
    .map(
      day => `
        <button class="journey-day" type="button" data-open-day="${day.id}" style="--day-accent:${day.accent}">
          <strong>${getDayNumber(day.date)}</strong>
          <span>${escapeHtml(getDayDisplayName(day))}</span>
          <small>${escapeHtml(day.weekday)}</small>
        </button>
      `
    )
    .join("") || '<div class="empty-state is-compact">这个旅程还没有日期。建立新旅程时选择开始和结束日期即可自动生成每天的空行程。</div>';

  const stats = getBudgetStats();
  const safePercent = Math.min(Math.max(stats.percent, 0), 100);
  $("#budget-glance").innerHTML = `
    <div>
      <div class="budget-top">
        <div>
          <p class="eyebrow">TRIP WALLET</p>
          <h2>预算钱包</h2>
        </div>
        <div class="budget-ring" style="--progress:${safePercent * 3.6}deg">
          <span>${Math.round(stats.percent)}%</span>
        </div>
      </div>
      <div class="budget-number">
        <span>旅途中还可使用</span>
        <strong>${formatMoney(stats.tripRemaining)}</strong>
        <small>旅途预算 ${formatMoney(stats.tripBudget)} · 已花 ${formatMoney(stats.tripSpent)}</small>
      </div>
    </div>
    <button class="primary-button" type="button" data-go="wallet">打开旅行钱包</button>
  `;

  const reminders = normalizeChecklist(state.reminders);
  state.reminders = reminders;
  $("#reminder-list").innerHTML = reminders.length ? reminders
    .map(
      reminder => `
        <article class="reminder checklist-item ${reminder.done ? "is-done" : ""}" data-reminder-id="${escapeHtml(reminder.id)}">
          <label class="checklist-check" aria-label="完成 ${escapeHtml(reminder.title)}">
            <input data-checklist-toggle type="checkbox" ${reminder.done ? "checked" : ""} />
            <span aria-hidden="true">✓</span>
          </label>
          <div class="checklist-body">
            <div class="reminder-top">
              <span class="status" data-status="${escapeHtml(reminder.done ? "已完成" : reminder.status)}">${escapeHtml(reminder.done ? "已完成" : reminder.status)}</span>
              ${reminder.date ? `<span class="reminder-date">${escapeHtml(reminder.date)}</span>` : ""}
            </div>
            <input class="checklist-title" data-checklist-field="title" value="${escapeHtml(reminder.title)}" placeholder="写下待办事项" aria-label="Check List 标题" />
            <textarea class="checklist-detail" data-checklist-field="detail" rows="3" placeholder="备注、链接、预约编号或出发前要确认的事" aria-label="Check List 备注">${escapeHtml(reminder.detail)}</textarea>
            <div class="checklist-record">${escapeHtml(formatChecklistRecord(reminder.doneAt))}</div>
          </div>
        </article>
      `
    )
    .join("") : '<div class="empty-state is-compact">还没有 Check List。点右上角「+ 新增」写下要记住的事。</div>';
}

function getTripForecastForDay(day) {
  const result = weatherState.locations?.[day.weatherKey];
  if (!result?.daily?.time) return null;
  const index = result.daily.time.indexOf(day.date);
  if (index < 0) return null;
  return {
    code: result.daily.weather_code[index],
    max: Math.round(result.daily.temperature_2m_max[index]),
    min: Math.round(result.daily.temperature_2m_min[index]),
    rain: result.daily.precipitation_probability_max[index]
  };
}

function dayWeatherLabel(day) {
  const forecast = getTripForecastForDay(day);
  if (forecast) return `${forecast.min}° / ${forecast.max}°`;
  return weatherLocations[day.weatherKey]?.typical || "待更新";
}

function renderItinerary() {
  if (!state.days.length) {
    $("#day-list").innerHTML = '<div class="empty-state is-compact">这个旅程还没有日期。请先新建一个带日期范围的旅程。</div>';
    return;
  }

  if (!openDays.size) {
    const next = getNextPlan();
    openDays.add(next?.day.id || state.days[0].id);
  }

  $("#day-list").innerHTML = state.days
    .map(day => {
      const isOpen = openDays.has(day.id);
      const scene = getSceneForDay(day);
      return `
        <article class="day-card ${isOpen ? "is-open" : ""}" data-day-id="${day.id}" style="--day-accent:${day.accent}">
          <button class="day-summary has-image" type="button" aria-expanded="${isOpen}" style="--day-image:${scene.image};--day-position:${scene.position}">
            <span class="day-number">
              <span>${getDayNumber(day.date)}</span>
              <small>${getDayMonth(day.date)}</small>
            </span>
            <span class="day-title">
              <strong>${escapeHtml(getDayDisplayName(day))}</strong>
              <span>${escapeHtml(day.weekday)} · ${escapeHtml(day.theme)}</span>
            </span>
            <span class="day-summary-meta">
              <span class="scene-name">${escapeHtml(scene.name)}</span>
              <span class="day-weather">${icons.cloud}${escapeHtml(dayWeatherLabel(day))}</span>
              <span class="chevron" aria-hidden="true"></span>
            </span>
          </button>
          <div class="day-content">
            <div class="day-meta-bar">
              <span>${icons.pin}${fullDateFormatter.format(new Date(`${day.date}T12:00:00`))}</span>
              <span>${icons.bed}${escapeHtml(day.stay)}</span>
            </div>
            <div class="timeline" data-day-id="${day.id}">
              ${day.items.map(item => renderTimelineItem(day, item)).join("")}
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderTimelineItem(day, item) {
  const complete = state.completed.includes(item.id);
  return `
    <div class="timeline-item ${complete ? "is-complete" : ""}" data-item-id="${item.id}">
      <div class="item-time">${escapeHtml(item.time)}</div>
      <button class="item-dot toggle-complete" type="button" title="${complete ? "标记未完成" : "标记完成"}" aria-label="${complete ? "标记未完成" : "标记完成"}"></button>
      <div class="item-copy">
        <div class="item-heading">
          <h3>${escapeHtml(item.title)}</h3>
          <span class="status" data-status="${escapeHtml(item.status)}">${escapeHtml(item.status)}</span>
        </div>
        <a class="item-location" href="${appleMapsPlace(item.mapQuery || item.location)}" target="_blank" rel="noreferrer">${escapeHtml(item.location)}</a>
        <p>${escapeHtml(item.detail)}</p>
      </div>
      <div class="item-actions">
        <a class="mini-button" href="${appleMapsDirections(item.mapQuery || item.location, item.type)}" target="_blank" rel="noreferrer" title="Apple Maps 导航" aria-label="Apple Maps 导航">${icons.route}</a>
        <button class="mini-button edit-plan" type="button" title="编辑行程" aria-label="编辑行程">${icons.edit}</button>
        <button class="drag-handle" type="button" draggable="true" title="按住拖动" aria-label="按住拖动">⠿</button>
      </div>
    </div>
  `;
}

function findItem(itemId) {
  for (const day of state.days) {
    const index = day.items.findIndex(item => item.id === itemId);
    if (index >= 0) return { day, item: day.items[index], index };
  }
  return null;
}

function renderWallet() {
  const stats = getBudgetStats();
  const today = getLocalDateValue();
  const todaySpent = state.expenses
    .filter(expense => expense.date === today)
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const healthLabel = stats.tripSpent === 0
    ? "Ready"
    : stats.percent <= 70
      ? "Good"
      : stats.percent <= 100
        ? "Watch"
        : "Over";
  const healthText = stats.tripSpent === 0
    ? "还未开始花旅途预算"
    : stats.percent <= 70
      ? "预算状态良好"
      : stats.percent <= 100
        ? "接近预算上限"
        : "已经超出预算";
  const budgetRows = state.budgets
    .map(budget => {
      const categoryStats = getBudgetCategoryStats(budget);
      return `
        <div class="budget-category" style="--category-color:${budget.color}">
          <div class="budget-category-header">
            <div class="budget-category-title">
              <span class="budget-category-dot"></span>
              <div>
                <strong>${escapeHtml(budget.name)}</strong>
                <small>${escapeHtml(budget.shortName)}</small>
              </div>
            </div>
            <button class="budget-limit-button edit-budget" type="button" data-budget-id="${budget.id}" title="修改预算">
              预算 ${formatMoney(budget.limit)}
            </button>
          </div>
          <form class="quick-expense-form" data-quick-expense-category="${budget.id}">
            <label class="quick-amount-field">
              <span>RM</span>
              <input
                name="amount"
                inputmode="decimal"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0"
                aria-label="输入${escapeHtml(budget.name)}实际花费金额"
                required
              />
            </label>
            <button class="quick-expense-save" type="submit">加入</button>
          </form>
          <div class="budget-category-numbers">
            <span>已花 <strong>${formatMoney(categoryStats.spent)}</strong></span>
            <span class="${categoryStats.remaining < 0 ? "is-over" : ""}">
              剩余 <strong>${formatMoney(categoryStats.remaining)}</strong>
            </span>
          </div>
          <div class="budget-track">
            <div class="budget-fill" style="width:${Math.min(Math.max(categoryStats.percent, 0), 100)}%;--category-color:${budget.color}"></div>
          </div>
          <div class="budget-category-footer">
            <span>点金额框直接输入，保存后会扣剩余预算</span>
            <button class="category-expense-button" type="button" data-add-expense-category="${budget.id}">
              完整备注
            </button>
          </div>
          ${categoryStats.remaining < 0 ? `<p class="budget-over">已超出 ${formatMoney(Math.abs(categoryStats.remaining))}</p>` : ""}
        </div>
      `;
    })
    .join("");

  const fixedCostRows = state.fixedCosts
    .map(item => `
      <div class="fixed-cost-row">
        <span>${escapeHtml(item.name)}</span>
        <strong>${formatMoney(item.amount)}</strong>
      </div>
    `)
    .join("");

  const expenseRows = [...state.expenses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(expense => {
      const budget = state.budgets.find(entry => entry.id === expense.category) || state.budgets[0];
      return `
        <div class="expense-row">
          <span class="expense-category-dot" style="--category-color:${budget.color}"></span>
          <div class="expense-copy">
            <strong>${escapeHtml(expense.note)}</strong>
            <span>${escapeHtml(budget.shortName)} · ${escapeHtml(expense.date)}</span>
          </div>
          <strong class="expense-amount">${formatMoney(expense.amount)}</strong>
          <button class="edit-expense" type="button" data-expense-id="${expense.id}" aria-label="编辑花费" title="编辑">${icons.edit}</button>
          <button class="delete-expense" type="button" data-expense-id="${expense.id}" aria-label="删除花费" title="删除">×</button>
        </div>
      `;
    })
    .join("");

  $("#wallet-content").innerHTML = `
    <section class="wallet-overview-card panel">
      <div class="wallet-overview-copy">
        <p class="eyebrow">TRIP BUDGET</p>
        <span>Left in this trip budget</span>
        <strong class="${stats.tripRemaining < 0 ? "is-over" : ""}">${formatMoney(stats.tripRemaining)}</strong>
        <small>Out of ${formatMoney(stats.tripBudget)} budgeted · spent ${formatMoney(stats.tripSpent)}</small>
      </div>
      <div class="wallet-overview-metrics">
        <article>
          <span>Today</span>
          <strong>${formatMoney(todaySpent)}</strong>
          <small>今日记录</small>
        </article>
        <article>
          <span>Paid</span>
          <strong>${formatMoney(stats.fixedSpent)}</strong>
          <small>已支付固定费用</small>
        </article>
        <article>
          <span>${healthLabel}</span>
          <strong>${Math.round(stats.percent)}%</strong>
          <small>${healthText}</small>
          <div class="wallet-health-meter">
            <i style="width:${Math.min(Math.max(stats.percent, 0), 100)}%"></i>
          </div>
        </article>
      </div>
    </section>
    <div class="wallet-grid">
      <section class="panel budget-panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">BY CATEGORY</p>
            <h2>预算分配</h2>
          </div>
          <button class="text-button" id="add-budget-category-button" type="button">+ 新增分类</button>
        </div>
        <div class="budget-category-list">${budgetRows}</div>
      </section>
      <section class="panel expense-panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">RECORDS</p>
            <h2>花费记录</h2>
          </div>
        </div>
        <div class="expense-sections">
          <section class="expense-section">
            <div class="expense-list">
              ${expenseRows || '<div class="empty-state is-compact">还没有花费明细；点击预算分类里的 RM 金额框即可直接记录。</div>'}
            </div>
          </section>
          <section class="expense-section fixed-record-section">
            <div class="expense-section-heading">
              <div>
                <span>PAID BEFORE TRIP</span>
                <strong>已支付明细</strong>
              </div>
              <em>${formatMoney(stats.fixedSpent)}</em>
            </div>
            <div class="fixed-cost-list">${fixedCostRows}</div>
            <p class="expense-panel-note">这些是出发前已支付/已确认项目，不会扣减旅途中预算；摄影师 RM8,460 另列，不计入这里。</p>
          </section>
        </div>
      </section>
    </div>
  `;
}

function renderSaves() {
  const dayOptions = state.days
    .map(day => `<option value="${day.id}">${getDayNumber(day.date)}日 · ${escapeHtml(getDayDisplayName(day))}</option>`)
    .join("");
  const saveRows = [...state.saves]
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .map(save => {
      const createdAt = save.createdAt
        ? dateFormatter.format(new Date(save.createdAt))
        : "刚刚";
      const sourceLabel = getSaveSourceLabel(save.source);
      const dayLabel = getSaveDayLabel(save.dayId);
      const urlLabel = save.url ? save.url.replace(/^https?:\/\//, "").replace(/\/$/, "") : "";

      return `
        <article class="save-card" data-save-id="${save.id}">
          <div class="save-card-copy">
            <div class="save-card-meta">
              <span class="save-source" data-source="${escapeHtml(save.source)}">${escapeHtml(sourceLabel)}</span>
              <small>${escapeHtml(dayLabel)} · ${escapeHtml(createdAt)}</small>
            </div>
            <h3>${escapeHtml(save.title)}</h3>
            ${save.note ? `<p>${escapeHtml(save.note)}</p>` : ""}
            ${save.url ? `<a class="save-url" href="${escapeHtml(save.url)}" target="_blank" rel="noreferrer">${escapeHtml(urlLabel)}</a>` : ""}
          </div>
          <div class="save-card-actions">
            ${save.url ? `<a class="mini-action" href="${escapeHtml(save.url)}" target="_blank" rel="noreferrer">打开</a>` : ""}
            <button class="mini-action edit-save" type="button" data-save-id="${save.id}">编辑</button>
            <button class="mini-action add-save-to-plan" type="button" data-save-id="${save.id}">加入行程</button>
          </div>
        </article>
      `;
    })
    .join("");

  $("#saves-content").innerHTML = `
    <section class="save-capture panel">
      <div class="save-capture-copy">
        <p class="eyebrow">SAVE FROM XHS / IG</p>
        <h2>先收起来，之后再决定要不要去。</h2>
        <p>iPhone 最稳做法：XHS / IG 点分享，复制链接，回到这里点“从剪贴板粘贴”。支持 Web Share Target 的浏览器也会自动把分享内容带进来。</p>
      </div>
      <form class="quick-save-form">
        <label>链接
          <input name="url" inputmode="url" placeholder="粘贴 XHS / IG / 网页链接" required />
        </label>
        <label>标题
          <input name="title" placeholder="可留空，自动用网站名称" />
        </label>
        <div class="quick-save-controls">
          <select name="dayId" aria-label="关联日期">
            <option value="">先不安排日期</option>
            ${dayOptions}
          </select>
          <button class="secondary-button" id="paste-save-button" type="button">从剪贴板粘贴</button>
          <button class="primary-button" type="submit">保存</button>
        </div>
      </form>
    </section>
    <section class="panel saves-panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">INBOX</p>
          <h2>已收藏</h2>
        </div>
        <span class="save-count">${state.saves.length} 条</span>
      </div>
      <div class="save-list">
        ${saveRows || '<div class="empty-state is-compact">还没有收藏。先从 XHS / IG 复制一个链接，或点右上角“收藏链接”。</div>'}
      </div>
    </section>
  `;
}

const weatherCodes = {
  0: ["晴朗", "SUN"],
  1: ["大致晴朗", "SUN"],
  2: ["局部多云", "CLD"],
  3: ["阴天", "CLD"],
  45: ["有雾", "FOG"],
  48: ["雾凇", "FOG"],
  51: ["毛毛雨", "RAIN"],
  53: ["毛毛雨", "RAIN"],
  55: ["较强毛毛雨", "RAIN"],
  61: ["小雨", "RAIN"],
  63: ["中雨", "RAIN"],
  65: ["大雨", "RAIN"],
  71: ["小雪", "SNOW"],
  73: ["中雪", "SNOW"],
  75: ["大雪", "SNOW"],
  80: ["阵雨", "RAIN"],
  81: ["阵雨", "RAIN"],
  82: ["强阵雨", "RAIN"],
  95: ["雷雨", "STORM"],
  96: ["雷雨冰雹", "STORM"],
  99: ["强雷雨", "STORM"]
};

function weatherDescription(code) {
  return weatherCodes[code] || ["天气变化", "WX"];
}

function renderWeather() {
  const next = getNextPlan();
  const tripWeatherKeys = [...new Set(state.days.map(day => day.weatherKey).filter(key => weatherLocations[key]))];

  if (!tripWeatherKeys.length) {
    $("#weather-hero").innerHTML = `
      <div class="weather-hero-copy">
        <p class="eyebrow">WEATHER WINDOW</p>
        <h2>这个旅程还没有天气城市</h2>
        <p>新建旅程已经可以规划行程、预算和收藏。天气需要目的地坐标，之后可以为这个旅程加入城市天气资料。</p>
      </div>
      <div class="weather-hero-temp">
        <strong>--°</strong>
        <span>等待城市天气设定</span>
      </div>
    `;
    $("#weather-grid").innerHTML = '<div class="empty-state is-compact">当前旅程使用自定义目的地，暂时不显示实时天气。</div>';
    return;
  }

  const nextKey = weatherLocations[next?.day.weatherKey] ? next.day.weatherKey : tripWeatherKeys[0];
  const nextLocation = weatherLocations[nextKey];
  const nextWeather = weatherState.locations?.[nextKey];
  const [description] = weatherDescription(nextWeather?.current?.weather_code);

  $("#weather-hero").innerHTML = `
    <div class="weather-hero-copy">
      <p class="eyebrow">NEXT DESTINATION · ${escapeHtml(nextLocation.label)}</p>
      <h2>${nextWeather ? escapeHtml(description) : "正在等待最新天气"}</h2>
      <p>${escapeHtml(nextLocation.note)}。旅行日预报会在日期进入 Open-Meteo 的短期预报范围后自动替换九月参考温度。</p>
    </div>
    <div class="weather-hero-temp">
      <strong>${nextWeather ? `${Math.round(nextWeather.current.temperature_2m)}°` : "--°"}</strong>
      <span>${nextWeather ? `体感 ${Math.round(nextWeather.current.apparent_temperature)}° · 风速 ${Math.round(nextWeather.current.wind_speed_10m)} km/h` : "连接天气服务中"}</span>
    </div>
  `;

  $("#weather-grid").innerHTML = Object.entries(weatherLocations)
    .filter(([key]) => tripWeatherKeys.includes(key))
    .map(([key, locationData]) => {
      const result = weatherState.locations?.[key];
      const [currentDescription, symbol] = weatherDescription(result?.current?.weather_code);
      const tripDays = state.days.filter(day => day.weatherKey === key);
      const availableForecasts = tripDays
        .map(day => ({ day, forecast: getTripForecastForDay(day) }))
        .filter(entry => entry.forecast);
      const dates = tripDays.map(day => dateFormatter.format(new Date(`${day.date}T12:00:00`))).join("、");

      let tripContent = `
        <strong>预报尚未开放</strong>
        <p>${dates} · 九月参考 ${escapeHtml(locationData.typical)}<br>${escapeHtml(locationData.note)}</p>
      `;

      if (availableForecasts.length) {
        tripContent = availableForecasts
          .map(({ day, forecast }) => {
            const [forecastDescription] = weatherDescription(forecast.code);
            return `
              <strong>${dateFormatter.format(new Date(`${day.date}T12:00:00`))} · ${escapeHtml(forecastDescription)}</strong>
              <p>${forecast.min}° - ${forecast.max}° · 降雨概率 ${forecast.rain ?? 0}%</p>
            `;
          })
          .join("");
      }

      return `
        <article class="weather-card">
          <div class="weather-card-header">
            <div>
              <h3>${escapeHtml(locationData.label)}</h3>
              <span>${escapeHtml(locationData.name)}</span>
            </div>
            <span class="weather-icon" aria-hidden="true">${symbol}</span>
          </div>
          <div class="weather-current">
            <strong>${result ? `${Math.round(result.current.temperature_2m)}°` : "--°"}</strong>
            <span>${result ? `当地现在 · ${escapeHtml(currentDescription)}` : "等待天气资料"}</span>
          </div>
          <div class="trip-forecast">
            <small>TRIP FORECAST</small>
            ${tripContent}
          </div>
        </article>
      `;
    })
    .join("");
}

async function refreshWeather(force = false) {
  const age = Date.now() - Number(weatherState.updatedAt || 0);
  if (!force && age < 30 * 60 * 1000 && Object.keys(weatherState.locations || {}).length) {
    renderWeather();
    renderItinerary();
    return;
  }

  const button = $("#refresh-weather-button");
  if (button) {
    button.disabled = true;
    button.textContent = "更新中...";
  }

  const results = await Promise.allSettled(
    Object.entries(weatherLocations).map(async ([key, locationData]) => {
      const parameters = new URLSearchParams({
        latitude: String(locationData.latitude),
        longitude: String(locationData.longitude),
        current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
        daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
        timezone: locationData.timezone,
        forecast_days: "16"
      });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${parameters}`);
      if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
      return [key, await response.json()];
    })
  );

  const successful = results
    .filter(result => result.status === "fulfilled")
    .map(result => result.value);

  if (successful.length) {
    weatherState = {
      updatedAt: Date.now(),
      locations: {
        ...weatherState.locations,
        ...Object.fromEntries(successful)
      }
    };
    localStorage.setItem(WEATHER_KEY, JSON.stringify(weatherState));
    if (force) showToast("天气已更新");
  } else if (force) {
    showToast("暂时无法连接天气服务");
  }

  if (button) {
    button.disabled = false;
    button.innerHTML = `${icons.cloud} 刷新天气`;
  }

  renderWeather();
  renderItinerary();
}

function populateFormOptions() {
  const dayOptions = state.days
    .map(day => `<option value="${day.id}">${dateFormatter.format(new Date(`${day.date}T12:00:00`))} · ${escapeHtml(getDayDisplayName(day))}</option>`)
    .join("");
  $("#plan-day-select").innerHTML = dayOptions || '<option value="">请先建立日期</option>';
  $("#expense-category").innerHTML = state.budgets
    .map(budget => `<option value="${budget.id}">${escapeHtml(budget.name)}</option>`)
    .join("");
  $("#save-day-select").innerHTML = [
    '<option value="">先不安排日期</option>',
    ...state.days.map(day => `<option value="${day.id}">${dateFormatter.format(new Date(`${day.date}T12:00:00`))} · ${escapeHtml(getDayDisplayName(day))}</option>`)
  ].join("");
}

function openTripModal(mode = "new") {
  const form = $("#trip-form");
  const today = getLocalDateValue();
  form.reset();
  form.elements.tripId.value = "";
  form.elements.budget.disabled = false;
  $("#trip-budget-label").hidden = false;

  if (mode === "edit") {
    form.elements.tripId.value = state.id;
    form.elements.name.value = state.name || "";
    form.elements.destinations.value = state.destinations || getTripDestinations();
    form.elements.startDate.value = state.startDate || state.days[0]?.date || today;
    form.elements.endDate.value = state.endDate || state.days[state.days.length - 1]?.date || form.elements.startDate.value;
    form.elements.dayNames.value = state.days.map(getDayDisplayName).join("\n");
    form.elements.budget.disabled = true;
    $("#trip-budget-label").hidden = true;
    $("#trip-modal-eyebrow").textContent = "TRIP PROFILE";
    $("#trip-modal-title").textContent = "编辑旅程资料";
    $("#trip-submit-button").textContent = "保存资料";
  } else {
    form.elements.startDate.value = today;
    form.elements.endDate.value = addDays(today, 3);
    form.elements.budget.value = "";
    $("#trip-modal-eyebrow").textContent = "NEW TRIP";
    $("#trip-modal-title").textContent = "建立新的旅程";
    $("#trip-submit-button").textContent = "建立旅程";
  }

  $("#trip-modal").showModal();
  setTimeout(() => form.elements.name.focus(), 50);
}

function syncTripDateRange(trip, startDate, requestedEndDate) {
  const requestedCount = Math.max(
    1,
    Math.floor((new Date(`${requestedEndDate}T12:00:00`) - new Date(`${startDate}T12:00:00`)) / 86400000) + 1
  );
  const cities = splitDestinations(trip.destinations);

  while (trip.days.length < requestedCount) {
    const index = trip.days.length;
    const date = addDays(startDate, index);
    const city = cities[Math.min(index, Math.max(cities.length - 1, 0))] || "待安排";
    trip.days.push({
      id: `day-${crypto.randomUUID()}`,
      date,
      weekday: makeWeekdayLabel(date),
      city,
      displayName: city,
      country: "",
      stay: "待安排住宿",
      theme: "自由安排",
      accent: ["#c86b3c", "#7d8d68", "#4c7b78", "#b28a52", "#65788a", "#a75d52", "#58748f", "#8b6a7d"][index % 8],
      weatherKey: "custom",
      items: []
    });
  }

  trip.days = trip.days.map((day, index) => {
    const date = addDays(startDate, index);
    return {
      ...day,
      date,
      weekday: makeWeekdayLabel(date)
    };
  });
  trip.startDate = startDate;
  trip.endDate = addDays(startDate, trip.days.length - 1);
  trip.dateLabel = makeDateRangeLabel(trip.startDate, trip.endDate);
}

function readImageFile(file, maxSize = 1600) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };
      image.onerror = reject;
      image.src = String(reader.result || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function updateTripImage(kind, file) {
  if (!file) return;
  try {
    const image = await readImageFile(file, kind === "avatar" ? 720 : 1800);
    if (!image) return;
    if (kind === "cover") state.coverImage = image;
    if (kind === "avatar") state.avatarImage = image;
    saveState(kind === "cover" ? "背景已更新" : "头像已更新");
    renderTripHub();
    showToast(kind === "cover" ? "背景照片已更新" : "头像已更新");
  } catch {
    showToast("无法读取这张照片");
  }
}

function saveTripForm() {
  const form = $("#trip-form");
  const data = new FormData(form);
  const tripId = String(data.get("tripId") || "");
  const startDate = String(data.get("startDate"));
  const endDate = String(data.get("endDate"));

  if (new Date(`${endDate}T12:00:00`) < new Date(`${startDate}T12:00:00`)) {
    showToast("结束日期不能早于开始日期");
    return false;
  }

  if (tripId) {
    state.name = String(data.get("name") || "").trim() || state.name || "未命名旅程";
    state.destinations = String(data.get("destinations") || "").trim() || state.destinations || "待安排目的地";
    state.routeLabels = makeRouteLabels(state.destinations, state.days);
    syncTripDateRange(state, startDate, endDate);
    state.days = applyDayDisplayNames(state.days, parseDayNames(data.get("dayNames"))).map(normalizeDay);
    saveState("旅程资料已更新");
    populateFormOptions();
    renderHome();
    renderItinerary();
    renderWallet();
    renderSaves();
    renderWeather();
    showToast("旅程资料已更新");
    return true;
  }

  const trip = createBlankTrip(data);
  rootState.trips.unshift(trip);
  rootState.activeTripId = trip.id;
  state = trip;
  openDays = new Set();
  saveState("新旅程已建立");
  populateFormOptions();
  renderHome();
  renderItinerary();
  renderWallet();
  renderSaves();
  renderWeather();
  switchView("home");
  showToast("新旅程已建立");
  return true;
}

function openPlanModal(itemId = null, preferredDayId = null) {
  if (!state.days.length) {
    showToast("请先建立带日期的旅程");
    return;
  }

  const modal = $("#plan-modal");
  const form = $("#plan-form");
  form.reset();
  form.elements.itemId.value = itemId || "";
  $("#delete-plan-button").hidden = !itemId;
  $("#plan-modal-title").textContent = itemId ? "编辑行程" : "新增行程";

  if (itemId) {
    const found = findItem(itemId);
    if (!found) return;
    form.elements.dayId.value = found.day.id;
    form.elements.time.value = found.item.time;
    form.elements.status.value = found.item.status;
    form.elements.title.value = found.item.title;
    form.elements.location.value = found.item.location;
    form.elements.detail.value = found.item.detail;
  } else {
    const next = getNextPlan();
    form.elements.dayId.value = preferredDayId || next?.day.id || state.days[0].id;
    form.elements.time.value = "09:00";
    form.elements.status.value = "当天确认";
  }

  modal.showModal();
}

function savePlanForm() {
  const form = $("#plan-form");
  const data = new FormData(form);
  const itemId = data.get("itemId");
  const targetDay = state.days.find(day => day.id === data.get("dayId"));
  if (!targetDay) return;

  const itemData = {
    id: itemId || `plan-${crypto.randomUUID()}`,
    time: String(data.get("time")).trim(),
    title: String(data.get("title")).trim(),
    location: String(data.get("location")).trim(),
    detail: String(data.get("detail")).trim(),
    type: "sight",
    mapQuery: String(data.get("location")).trim(),
    status: String(data.get("status"))
  };

  if (itemId) {
    const found = findItem(itemId);
    if (!found) return;
    found.day.items.splice(found.index, 1);
    targetDay.items.push(itemData);
  } else {
    targetDay.items.push(itemData);
  }

  openDays.add(targetDay.id);
  saveState();
  renderHome();
  renderItinerary();
  showToast(itemId ? "行程已更新" : "行程已加入");
}

function deletePlan(itemId) {
  const found = findItem(itemId);
  if (!found) return;
  found.day.items.splice(found.index, 1);
  state.completed = state.completed.filter(id => id !== itemId);
  saveState();
  renderHome();
  renderItinerary();
  $("#plan-modal").close();
  showToast("行程已删除");
}

function updateExpenseBudgetHint() {
  const form = $("#expense-form");
  const budget = state.budgets.find(entry => entry.id === form.elements.category.value);
  const hint = $("#expense-budget-hint");
  if (!budget || !hint) return;

  const categoryStats = getBudgetCategoryStats(budget, form.elements.expenseId.value);
  const enteredAmount = Number(form.elements.amount.value || 0);
  const projectedRemaining = categoryStats.remaining - enteredAmount;
  hint.textContent = `预算 ${formatMoney(budget.limit)} · 已花 ${formatMoney(categoryStats.spent)} · 这笔后剩余 ${formatMoney(projectedRemaining)}`;
  hint.classList.toggle("is-over", projectedRemaining < 0);
}

function openExpenseModal(categoryId = "", expenseId = "") {
  const form = $("#expense-form");
  const expense = expenseId ? state.expenses.find(entry => entry.id === expenseId) : null;
  form.reset();
  form.elements.expenseId.value = expense?.id || "";
  $("#expense-modal-eyebrow").textContent = expense ? "EDIT EXPENSE" : "NEW EXPENSE";
  $("#expense-modal-title").textContent = expense ? "编辑花费" : "记一笔花费";

  if (expense) {
    form.elements.amount.value = expense.amount;
    form.elements.category.value = expense.category;
    form.elements.date.value = expense.date;
    form.elements.note.value = expense.note;
  } else {
    form.elements.date.value = getLocalDateValue();
    if (categoryId && state.budgets.some(budget => budget.id === categoryId)) {
      form.elements.category.value = categoryId;
    }
  }
  updateExpenseBudgetHint();
  $("#expense-modal").showModal();
  setTimeout(() => form.elements.amount.focus(), 50);
}

function addBudgetCategory() {
  const name = window.prompt("新增预算分类名称", "");
  if (name === null) return;
  const cleanName = name.trim();
  if (!cleanName) {
    showToast("请输入分类名称");
    return;
  }

  const limitValue = window.prompt(`「${cleanName}」预算金额（RM）`, "0");
  if (limitValue === null) return;
  const budget = createBudgetCategory({ name: cleanName, limit: limitValue });
  if (!budget) {
    showToast("请输入有效预算金额");
    return;
  }

  state.budgets.push(budget);
  saveState("预算分类已新增");
  populateFormOptions();
  renderHome();
  renderWallet();
  showToast(`已新增 ${budget.name}`);
}

function saveExpenseForm() {
  const data = new FormData($("#expense-form"));
  const expenseId = String(data.get("expenseId") || "");
  const nextExpense = {
    id: expenseId || `expense-${crypto.randomUUID()}`,
    date: String(data.get("date")),
    category: String(data.get("category")),
    amount: Number(data.get("amount")),
    note: String(data.get("note")).trim()
  };
  const existingIndex = state.expenses.findIndex(expense => expense.id === expenseId);
  if (existingIndex >= 0) state.expenses[existingIndex] = nextExpense;
  else state.expenses.push(nextExpense);
  saveState();
  renderHome();
  renderWallet();
  showToast(expenseId ? "花费已更新" : "花费已记录");
}

function saveQuickExpenseForm(form) {
  const categoryId = form.dataset.quickExpenseCategory;
  const budget = state.budgets.find(entry => entry.id === categoryId);
  const amount = Number(form.elements.amount.value);

  if (!budget) {
    showToast("找不到预算分类");
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    showToast("请输入有效金额");
    form.elements.amount.focus();
    return;
  }

  state.expenses.push({
    id: `expense-${crypto.randomUUID()}`,
    date: getLocalDateValue(),
    category: budget.id,
    amount,
    note: `${budget.shortName} 实际花费`
  });
  saveState();
  renderHome();
  renderWallet();
  showToast(`已记入 ${formatMoney(amount)}`);
}

function openSaveModal(saveId = null) {
  const modal = $("#save-modal");
  const form = $("#save-form");
  form.reset();
  form.elements.saveId.value = saveId || "";
  $("#delete-save-button").hidden = !saveId;
  $("#save-modal-title").textContent = saveId ? "编辑收藏" : "收藏灵感";

  if (saveId) {
    const save = state.saves.find(entry => entry.id === saveId);
    if (!save) return;
    form.elements.title.value = save.title;
    form.elements.url.value = save.url || "";
    form.elements.source.value = save.source || "other";
    form.elements.dayId.value = save.dayId || "";
    form.elements.note.value = save.note || "";
  } else {
    const next = getNextPlan();
    form.elements.source.value = "web";
    form.elements.dayId.value = next?.day.id || "";
  }

  modal.showModal();
  setTimeout(() => form.elements.url.focus(), 50);
}

function saveSaveForm() {
  const form = $("#save-form");
  const data = new FormData(form);
  const saveId = String(data.get("saveId") || "");
  const record = {
    title: String(data.get("title")).trim(),
    url: normalizeUrlInput(data.get("url")),
    source: String(data.get("source") || "other"),
    note: String(data.get("note") || "").trim(),
    dayId: String(data.get("dayId") || "")
  };

  if (saveId) {
    const save = state.saves.find(entry => entry.id === saveId);
    if (!save) return;
    Object.assign(save, record, { updatedAt: new Date().toISOString() });
  } else {
    state.saves.unshift(createSaveRecord(record));
  }

  saveState();
  renderSaves();
  showToast(saveId ? "收藏已更新" : "收藏已保存");
}

function saveQuickSaveForm(form) {
  const url = normalizeUrlInput(form.elements.url.value);
  if (!url) {
    showToast("请先粘贴链接");
    form.elements.url.focus();
    return;
  }

  const title = String(form.elements.title.value || "").trim() || titleFromUrl(url);
  state.saves.unshift(createSaveRecord({
    title,
    url,
    source: inferSaveSource(url),
    note: "",
    dayId: String(form.elements.dayId.value || "")
  }));
  form.reset();
  saveState();
  renderSaves();
  showToast("收藏已保存");
}

async function pasteSaveFromClipboard() {
  const form = $(".quick-save-form");
  if (!form) return;

  try {
    const clipboardText = await navigator.clipboard.readText();
    const url = extractFirstUrl(clipboardText) || clipboardText.trim();
    if (!url) {
      showToast("剪贴板里没有链接");
      return;
    }

    const normalizedUrl = normalizeUrlInput(url);
    const title = removeUrlFromText(clipboardText, url);
    form.elements.url.value = normalizedUrl;
    form.elements.title.value = title || titleFromUrl(normalizedUrl);
    showToast("已从剪贴板带入");
  } catch {
    showToast("无法读取剪贴板，请手动粘贴");
  }
}

function deleteSave(saveId) {
  state.saves = state.saves.filter(save => save.id !== saveId);
  saveState();
  renderSaves();
  $("#save-modal").close();
  showToast("收藏已删除");
}

function openPlanFromSave(saveId) {
  const save = state.saves.find(entry => entry.id === saveId);
  if (!save) return;
  openPlanModal(null, save.dayId || null);
  const form = $("#plan-form");
  form.elements.status.value = "可选";
  form.elements.title.value = save.title;
  form.elements.location.value = save.title;
  form.elements.detail.value = [save.note, save.url].filter(Boolean).join("\n");
}

function captureIncomingShare() {
  const params = new URLSearchParams(location.search);
  const rawTitle = params.get("title") || "";
  const rawText = params.get("text") || "";
  const rawUrl = params.get("url") || extractFirstUrl(rawText) || extractFirstUrl(rawTitle);
  const hasSharePayload = rawTitle || rawText || rawUrl;
  if (!hasSharePayload) return false;

  const url = normalizeUrlInput(rawUrl);
  const titleFromText = removeUrlFromText(rawText, rawUrl);
  const title = rawTitle || titleFromText || titleFromUrl(url);
  const note = rawText && rawText !== rawUrl && rawText !== title ? rawText : "";
  const duplicate = url && state.saves.find(save => save.url === url);

  if (!duplicate) {
    state.saves.unshift(createSaveRecord({
      title,
      url,
      source: inferSaveSource(url, rawText),
      note,
      dayId: ""
    }));
    saveState("分享已保存");
  }

  history.replaceState(null, "", `${location.pathname}#saves`);
  activeView = "saves";
  showToast(duplicate ? "这条已经收藏过" : "分享已加入收藏");
  return true;
}

function startDrag(event, handle) {
  if (event.button !== undefined && ![0, 1].includes(event.button)) return;
  const itemElement = handle.closest(".timeline-item");
  const timeline = handle.closest(".timeline");
  if (!itemElement || !timeline) return;

  dragState = {
    pointerId: event.pointerId,
    handle,
    itemElement,
    timeline,
    dayId: timeline.dataset.dayId
  };
  handle.setPointerCapture?.(event.pointerId);
  itemElement.classList.add("is-dragging");
  document.body.style.userSelect = "none";
  event.preventDefault();
}

function moveDrag(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  event.preventDefault();
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".timeline-item");
  if (!target || target === dragState.itemElement || target.parentElement !== dragState.timeline) return;

  const box = target.getBoundingClientRect();
  const before = event.clientY < box.top + box.height / 2;
  dragState.timeline.insertBefore(dragState.itemElement, before ? target : target.nextSibling);
}

function finishDrag(event) {
  if (!dragState || (event.pointerId !== undefined && event.pointerId !== dragState.pointerId)) return;
  const { itemElement, timeline, dayId, handle } = dragState;
  itemElement.classList.remove("is-dragging");
  handle.releasePointerCapture?.(dragState.pointerId);
  document.body.style.userSelect = "";

  persistTimelineOrder(timeline, dayId);

  dragState = null;
}

function persistTimelineOrder(timeline, dayId) {
  const day = state.days.find(entry => entry.id === dayId);
  if (!day) return;
  const order = [...timeline.querySelectorAll(".timeline-item")].map(element => element.dataset.itemId);
  const byId = new Map(day.items.map(item => [item.id, item]));
  day.items = order.map(id => byId.get(id)).filter(Boolean);
  saveState("新顺序已保存");
  renderHome();
  showToast("行程顺序已调整");
}

function findChecklistItem(id) {
  state.reminders = normalizeChecklist(state.reminders);
  return state.reminders.find(item => item.id === id);
}

function addChecklistItem() {
  const item = createChecklistItem();
  state.reminders = [item, ...normalizeChecklist(state.reminders)];
  saveState("Check List 已更新");
  renderHome();
  requestAnimationFrame(() => {
    const title = document.querySelector(`[data-reminder-id="${item.id}"] [data-checklist-field="title"]`);
    title?.focus();
    title?.select();
  });
}

function toggleChecklistItem(id, done) {
  const item = findChecklistItem(id);
  if (!item) return;
  item.done = done;
  item.doneAt = done ? new Date().toISOString() : "";
  item.updatedAt = new Date().toISOString();
  saveState("Check List 已更新");
  renderHome();
}

function updateChecklistField(field) {
  const card = field.closest("[data-reminder-id]");
  const item = findChecklistItem(card?.dataset.reminderId);
  if (!item) return;
  const key = field.dataset.checklistField;
  if (!["title", "detail"].includes(key)) return;
  item[key] = field.value;
  item.updatedAt = new Date().toISOString();
  saveState("Check List 已保存");
}

function startHtmlDrag(event) {
  const handle = event.target.closest(".drag-handle");
  if (!handle) return;
  const itemElement = handle.closest(".timeline-item");
  const timeline = handle.closest(".timeline");
  if (!itemElement || !timeline) return;

  htmlDragState = {
    itemElement,
    timeline,
    dayId: timeline.dataset.dayId
  };
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", itemElement.dataset.itemId);
  requestAnimationFrame(() => itemElement.classList.add("is-dragging"));
}

function moveHtmlDrag(event) {
  if (!htmlDragState) return;
  const target = event.target.closest(".timeline-item");
  if (!target || target === htmlDragState.itemElement || target.parentElement !== htmlDragState.timeline) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  const box = target.getBoundingClientRect();
  const before = event.clientY < box.top + box.height / 2;
  htmlDragState.timeline.insertBefore(htmlDragState.itemElement, before ? target : target.nextSibling);
}

function finishHtmlDrag() {
  if (!htmlDragState) return;
  htmlDragState.itemElement.classList.remove("is-dragging");
  persistTimelineOrder(htmlDragState.timeline, htmlDragState.dayId);
  htmlDragState = null;
}

function handleClick(event) {
  if (event.target.closest("#theme-toggle")) {
    toggleTheme();
    return;
  }

  if (event.target.closest("#change-cover-button")) {
    $("#cover-input").click();
    return;
  }

  if (event.target.closest("#change-avatar-button")) {
    $("#avatar-input").click();
    return;
  }

  if (event.target.closest("#edit-trip-button")) {
    openTripModal("edit");
    return;
  }

  if (event.target.closest("#add-checklist-button")) {
    addChecklistItem();
    return;
  }

  if (event.target.closest("#add-budget-category-button")) {
    addBudgetCategory();
    return;
  }

  const nav = event.target.closest("[data-nav]");
  if (nav) {
    switchView(nav.dataset.nav);
    return;
  }

  const go = event.target.closest("[data-go]");
  if (go) {
    switchView(go.dataset.go);
    return;
  }

  const journeyDay = event.target.closest("[data-open-day]");
  if (journeyDay) {
    openDays.add(journeyDay.dataset.openDay);
    switchView("itinerary");
    setTimeout(() => {
      document.querySelector(`[data-day-id="${journeyDay.dataset.openDay}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return;
  }

  const daySummary = event.target.closest(".day-summary");
  if (daySummary) {
    const card = daySummary.closest(".day-card");
    const dayId = card.dataset.dayId;
    if (openDays.has(dayId)) openDays.delete(dayId);
    else openDays.add(dayId);
    card.classList.toggle("is-open");
    daySummary.setAttribute("aria-expanded", card.classList.contains("is-open"));
    return;
  }

  if (event.target.closest("#new-trip-button")) {
    openTripModal();
    return;
  }

  if (event.target.closest("#add-plan-button") || event.target.closest("#empty-add-plan-button")) {
    openPlanModal();
    return;
  }

  const editPlan = event.target.closest(".edit-plan");
  if (editPlan) {
    openPlanModal(editPlan.closest(".timeline-item").dataset.itemId);
    return;
  }

  const completeButton = event.target.closest(".toggle-complete");
  if (completeButton) {
    const itemId = completeButton.closest(".timeline-item").dataset.itemId;
    if (state.completed.includes(itemId)) state.completed = state.completed.filter(id => id !== itemId);
    else state.completed.push(itemId);
    saveState();
    renderHome();
    renderItinerary();
    return;
  }

  if (event.target.closest("#add-expense-button")) {
    openExpenseModal();
    return;
  }

  if (event.target.closest("#add-save-button")) {
    openSaveModal();
    return;
  }

  if (event.target.closest("#paste-save-button")) {
    pasteSaveFromClipboard();
    return;
  }

  const editSave = event.target.closest(".edit-save");
  if (editSave) {
    openSaveModal(editSave.dataset.saveId);
    return;
  }

  const addSaveToPlan = event.target.closest(".add-save-to-plan");
  if (addSaveToPlan) {
    openPlanFromSave(addSaveToPlan.dataset.saveId);
    return;
  }

  const categoryExpense = event.target.closest("[data-add-expense-category]");
  if (categoryExpense) {
    openExpenseModal(categoryExpense.dataset.addExpenseCategory);
    return;
  }

  const editExpense = event.target.closest(".edit-expense");
  if (editExpense) {
    openExpenseModal("", editExpense.dataset.expenseId);
    return;
  }

  const deleteExpense = event.target.closest(".delete-expense");
  if (deleteExpense) {
    state.expenses = state.expenses.filter(expense => expense.id !== deleteExpense.dataset.expenseId);
    saveState();
    renderHome();
    renderWallet();
    showToast("花费已删除");
    return;
  }

  const editBudget = event.target.closest(".edit-budget");
  if (editBudget) {
    const budget = state.budgets.find(entry => entry.id === editBudget.dataset.budgetId);
    if (!budget) return;
    const nextValue = window.prompt(`修改「${budget.name}」预算（RM）`, String(budget.limit));
    if (nextValue === null) return;
    const amount = Number(nextValue);
    if (!Number.isFinite(amount) || amount < 0) {
      showToast("请输入有效金额");
      return;
    }
    budget.limit = amount;
    saveState();
    renderHome();
    renderWallet();
    showToast("预算已更新");
    return;
  }

  if (event.target.closest("#refresh-weather-button")) {
    refreshWeather(true);
  }
}

function handleInput(event) {
  const field = event.target.closest("[data-checklist-field]");
  if (field) updateChecklistField(field);
}

function handleChange(event) {
  const toggle = event.target.closest("[data-checklist-toggle]");
  if (!toggle) return;
  const card = toggle.closest("[data-reminder-id]");
  toggleChecklistItem(card?.dataset.reminderId, toggle.checked);
}

function setupForms() {
  $("#trip-select").addEventListener("change", event => switchTrip(event.target.value));

  $("#cover-input").addEventListener("change", event => {
    updateTripImage("cover", event.target.files?.[0]);
    event.target.value = "";
  });

  $("#avatar-input").addEventListener("change", event => {
    updateTripImage("avatar", event.target.files?.[0]);
    event.target.value = "";
  });

  $("#trip-form").addEventListener("submit", event => {
    event.preventDefault();
    if (event.submitter?.value === "cancel") {
      $("#trip-modal").close();
      return;
    }
    if (!event.currentTarget.reportValidity()) return;
    if (saveTripForm()) $("#trip-modal").close();
  });

  $("#plan-form").addEventListener("submit", event => {
    event.preventDefault();
    if (event.submitter?.value === "cancel") {
      $("#plan-modal").close();
      return;
    }
    if (!event.currentTarget.reportValidity()) return;
    savePlanForm();
    $("#plan-modal").close();
  });

  $("#delete-plan-button").addEventListener("click", () => {
    const itemId = $("#plan-form").elements.itemId.value;
    if (itemId) deletePlan(itemId);
  });

  $("#expense-form").addEventListener("submit", event => {
    event.preventDefault();
    if (event.submitter?.value === "cancel") {
      $("#expense-modal").close();
      return;
    }
    if (!event.currentTarget.reportValidity()) return;
    saveExpenseForm();
    $("#expense-modal").close();
  });

  $("#expense-category").addEventListener("change", updateExpenseBudgetHint);
  $("#expense-form").elements.amount.addEventListener("input", updateExpenseBudgetHint);
  $("#wallet-content").addEventListener("submit", event => {
    const quickExpenseForm = event.target.closest(".quick-expense-form");
    if (!quickExpenseForm) return;
    event.preventDefault();
    saveQuickExpenseForm(quickExpenseForm);
  });

  $("#saves-content").addEventListener("submit", event => {
    const quickSaveForm = event.target.closest(".quick-save-form");
    if (!quickSaveForm) return;
    event.preventDefault();
    saveQuickSaveForm(quickSaveForm);
  });

  $("#save-form").addEventListener("submit", event => {
    event.preventDefault();
    if (event.submitter?.value === "cancel") {
      $("#save-modal").close();
      return;
    }
    if (!event.currentTarget.reportValidity()) return;
    saveSaveForm();
    $("#save-modal").close();
  });

  $("#delete-save-button").addEventListener("click", () => {
    const saveId = $("#save-form").elements.saveId.value;
    if (saveId) deleteSave(saveId);
  });

  $$(".modal").forEach(modal => {
    modal.addEventListener("click", event => {
      if (event.target === modal) modal.close();
    });
  });
}

function setupInstall() {
  const installButton = $("#install-button");
  if (!installButton) return;

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton.hidden = false;
  });

  installButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installButton.hidden = true;
  });

  window.addEventListener("appinstalled", () => {
    installButton.hidden = true;
    showToast("旅行助手已安装");
  });
}

function setupLiquidGlassNavigation() {
  const topbar = $(".topbar");
  const bottomNav = $(".bottom-nav");
  let previousScrollY = window.scrollY;
  let scheduled = false;

  const updateNavigation = () => {
    const currentScrollY = Math.max(window.scrollY, 0);
    const movingDown = currentScrollY > previousScrollY + 4;
    const movingUp = currentScrollY < previousScrollY - 4;

    topbar?.classList.toggle("is-scrolled", currentScrollY > 12);

    if (currentScrollY < 90 || movingUp) {
      bottomNav?.classList.remove("is-compact");
    } else if (movingDown && currentScrollY > 180) {
      bottomNav?.classList.add("is-compact");
    }

    previousScrollY = currentScrollY;
    scheduled = false;
  };

  window.addEventListener("scroll", () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(updateNavigation);
  }, { passive: true });

  bottomNav?.addEventListener("focusin", () => bottomNav.classList.remove("is-compact"));
  updateNavigation();
}

function init() {
  applyTheme(activeTheme);
  populateFormOptions();
  const capturedShare = captureIncomingShare();
  renderHome();
  renderItinerary();
  renderWallet();
  renderSaves();
  renderWeather();
  setupForms();
  setupInstall();
  setupLiquidGlassNavigation();
  switchView(capturedShare ? "saves" : activeView, false);

  document.addEventListener("click", handleClick);
  document.addEventListener("input", handleInput);
  document.addEventListener("change", handleChange);
  document.addEventListener("pointerdown", event => {
    const handle = event.target.closest(".drag-handle");
    if (handle) startDrag(event, handle);
  });
  document.addEventListener("pointermove", moveDrag, { passive: false });
  document.addEventListener("pointerup", finishDrag);
  document.addEventListener("pointercancel", finishDrag);
  document.addEventListener("dragstart", startHtmlDrag);
  document.addEventListener("dragover", moveHtmlDrag);
  document.addEventListener("drop", event => {
    if (htmlDragState) event.preventDefault();
  });
  document.addEventListener("dragend", finishHtmlDrag);
  window.addEventListener("hashchange", () => switchView(location.hash.replace("#", ""), false));

  refreshWeather();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

init();
