import {
  bookingReminders,
  defaultBudgets,
  defaultDays,
  defaultExpenses,
  defaultFixedCosts,
  weatherLocations
} from "./data.js";

const STORAGE_KEY = "via26-state-v1";
const STATE_VERSION = 2;
const WEATHER_KEY = "via26-weather-v1";
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const icons = {
  map: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15M15 6v15"/></svg>',
  route: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M9 16h3a3 3 0 0 0 3-3V8"/></svg>',
  edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.5-1 10-10a2.12 2.12 0 0 0-3-3l-10 10L4 20Z"/><path d="m14 7 3 3"/></svg>',
  bed: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 19v-8m18 8v-6a2 2 0 0 0-2-2H8a3 3 0 0 0-3 3v5m0-4h16M8 11V8h4a2 2 0 0 1 2 2v1"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17 15 6m0 0H7m8 0v8"/><path d="M4 7v10h10"/></svg>',
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

function loadState() {
  const fallback = {
    version: STATE_VERSION,
    days: clone(defaultDays),
    fixedCosts: clone(defaultFixedCosts),
    budgets: clone(defaultBudgets),
    expenses: clone(defaultExpenses),
    completed: []
  };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || !Array.isArray(saved.days)) return fallback;

    const currentBudgetIds = new Set(defaultBudgets.map(budget => budget.id));
    const migratedExpenses = Array.isArray(saved.expenses)
      ? saved.expenses
          .filter(expense => expense.id !== "expense-fixed" && expense.category !== "fixed")
          .map(expense => {
            if (currentBudgetIds.has(expense.category)) return expense;
            if (expense.category === "transport") return { ...expense, category: "parking" };
            if (expense.category === "activity") return { ...expense, category: "gondola" };
            return null;
          })
          .filter(Boolean)
      : [];

    return {
      version: STATE_VERSION,
      days: saved.days,
      fixedCosts: saved.version === STATE_VERSION && Array.isArray(saved.fixedCosts)
        ? saved.fixedCosts
        : fallback.fixedCosts,
      budgets: saved.version === STATE_VERSION && Array.isArray(saved.budgets)
        ? saved.budgets
        : fallback.budgets,
      expenses: migratedExpenses,
      completed: Array.isArray(saved.completed) ? saved.completed : []
    };
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

let state = loadState();
let weatherState = loadWeather();
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

function saveState(message = "已自动保存") {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const syncState = $("#sync-state");
  if (syncState) {
    syncState.innerHTML = `<i></i> ${escapeHtml(message)}`;
  }
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

function getBudgetCategoryStats(budget) {
  const spent = state.expenses
    .filter(expense => expense.category === budget.id)
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const remaining = Number(budget.limit || 0) - spent;
  return {
    spent,
    remaining,
    percent: budget.limit ? (spent / budget.limit) * 100 : 0
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

function switchView(view, updateHash = true) {
  const validView = ["home", "itinerary", "wallet", "weather"].includes(view) ? view : "home";
  activeView = validView;
  $$(".view").forEach(section => section.classList.toggle("is-active", section.dataset.view === validView));
  $$(".nav-item").forEach(button => button.classList.toggle("is-active", button.dataset.nav === validView));
  if (updateHash) history.replaceState(null, "", `#${validView}`);
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (validView === "itinerary") renderItinerary();
  if (validView === "wallet") renderWallet();
  if (validView === "weather") renderWeather();
}

function renderHome() {
  const next = getNextPlan();
  const countdown = getCountdown(next?.start);
  const nextCard = $("#next-card");

  if (!next) {
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
        <p>${escapeHtml(next.item.location)} · ${escapeHtml(next.day.city)}</p>
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

  $("#journey-strip").innerHTML = state.days
    .map(
      day => `
        <button class="journey-day" type="button" data-open-day="${day.id}" style="--day-accent:${day.accent}">
          <strong>${getDayNumber(day.date)}</strong>
          <span>${escapeHtml(day.city)}</span>
          <small>${escapeHtml(day.weekday)}</small>
        </button>
      `
    )
    .join("");

  const stats = getBudgetStats();
  const safePercent = Math.min(Math.max(stats.percent, 0), 100);
  $("#budget-glance").innerHTML = `
    <div>
      <div class="budget-top">
        <div>
          <p class="eyebrow">TRIP WALLET</p>
          <h2>预算还好吗？</h2>
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

  $("#reminder-list").innerHTML = bookingReminders
    .map(
      reminder => `
        <article class="reminder">
          <div class="reminder-top">
            <span class="status" data-status="${escapeHtml(reminder.status)}">${escapeHtml(reminder.status)}</span>
            <span class="reminder-date">${escapeHtml(reminder.date)}</span>
          </div>
          <h3>${escapeHtml(reminder.title)}</h3>
          <p>${escapeHtml(reminder.detail)}</p>
        </article>
      `
    )
    .join("");
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
              <strong>${escapeHtml(day.city)}</strong>
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
  const budgetRows = state.budgets
    .map(budget => {
      const categoryStats = getBudgetCategoryStats(budget);
      return `
        <div class="budget-category">
          <div class="budget-category-header">
            <strong>${escapeHtml(budget.name)}</strong>
            <button class="text-button edit-budget" type="button" data-budget-id="${budget.id}" title="修改预算">
              预算 ${formatMoney(budget.limit)}
            </button>
          </div>
          <div class="budget-category-numbers">
            <span>已花 <strong>${formatMoney(categoryStats.spent)}</strong></span>
            <span class="${categoryStats.remaining < 0 ? "is-over" : ""}">
              剩余 <strong>${formatMoney(categoryStats.remaining)}</strong>
            </span>
          </div>
          <div class="budget-track">
            <div class="budget-fill" style="width:${Math.min(Math.max(categoryStats.percent, 0), 100)}%;--category-color:${budget.color}"></div>
          </div>
          <button class="category-expense-button" type="button" data-add-expense-category="${budget.id}">
            + 记入实际花费
          </button>
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
          <button class="delete-expense" type="button" data-expense-id="${expense.id}" aria-label="删除花费" title="删除">×</button>
        </div>
      `;
    })
    .join("");

  $("#wallet-content").innerHTML = `
    <div class="wallet-summary">
      <article class="wallet-stat">
        <span>FIXED PAID</span>
        <strong>${formatMoney(stats.fixedSpent)}</strong>
        <small>已支付，不含摄影师费用</small>
      </article>
      <article class="wallet-stat">
        <span>TRIP BUDGET</span>
        <strong>${formatMoney(stats.tripBudget)}</strong>
        <small>旅途中可控制预算</small>
      </article>
      <article class="wallet-stat">
        <span>TRIP SPENT</span>
        <strong>${formatMoney(stats.tripSpent)}</strong>
        <small>占旅途预算 ${Math.round(stats.percent)}%</small>
      </article>
      <article class="wallet-stat">
        <span>TRIP REMAINING</span>
        <strong>${formatMoney(stats.tripRemaining)}</strong>
        <small>${stats.tripRemaining >= 0 ? "仍可使用的旅途预算" : "已经超过旅途预算"}</small>
      </article>
    </div>
    <div class="wallet-grid">
      <section class="panel budget-panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">BY CATEGORY</p>
            <h2>预算分配</h2>
          </div>
        </div>
        <div class="budget-category-list">${budgetRows}</div>
      </section>
      <section class="panel expense-panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">RECENT</p>
            <h2>花费记录</h2>
          </div>
        </div>
        <div class="expense-list">${expenseRows || '<div class="empty-state">还没有实际花费；从预算分类逐项记录。</div>'}</div>
      </section>
    </div>
    <details class="panel fixed-cost-panel">
      <summary>
        <span>
          <small>PAID BEFORE TRIP</small>
          <strong>已支付固定费用明细</strong>
        </span>
        <strong>${formatMoney(stats.fixedSpent)}</strong>
      </summary>
      <div class="fixed-cost-list">${fixedCostRows}</div>
      <p>摄影师 RM8,460 不计入这里，也不从旅途预算扣减。</p>
    </details>
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
  const nextKey = next?.day.weatherKey || "dubai";
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
  $("#plan-day-select").innerHTML = state.days
    .map(day => `<option value="${day.id}">${dateFormatter.format(new Date(`${day.date}T12:00:00`))} · ${escapeHtml(day.city)}</option>`)
    .join("");
  $("#expense-category").innerHTML = state.budgets
    .map(budget => `<option value="${budget.id}">${escapeHtml(budget.name)}</option>`)
    .join("");
}

function openPlanModal(itemId = null, preferredDayId = null) {
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

  const categoryStats = getBudgetCategoryStats(budget);
  const enteredAmount = Number(form.elements.amount.value || 0);
  const projectedRemaining = categoryStats.remaining - enteredAmount;
  hint.textContent = `预算 ${formatMoney(budget.limit)} · 已花 ${formatMoney(categoryStats.spent)} · 这笔后剩余 ${formatMoney(projectedRemaining)}`;
  hint.classList.toggle("is-over", projectedRemaining < 0);
}

function openExpenseModal(categoryId = "") {
  const form = $("#expense-form");
  form.reset();
  form.elements.date.value = getLocalDateValue();
  if (categoryId && state.budgets.some(budget => budget.id === categoryId)) {
    form.elements.category.value = categoryId;
  }
  updateExpenseBudgetHint();
  $("#expense-modal").showModal();
  setTimeout(() => form.elements.amount.focus(), 50);
}

function saveExpenseForm() {
  const data = new FormData($("#expense-form"));
  state.expenses.push({
    id: `expense-${crypto.randomUUID()}`,
    date: String(data.get("date")),
    category: String(data.get("category")),
    amount: Number(data.get("amount")),
    note: String(data.get("note")).trim()
  });
  saveState();
  renderHome();
  renderWallet();
  showToast("花费已记录");
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

  if (event.target.closest("#add-plan-button")) {
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

  const categoryExpense = event.target.closest("[data-add-expense-category]");
  if (categoryExpense) {
    openExpenseModal(categoryExpense.dataset.addExpenseCategory);
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

function setupForms() {
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
  populateFormOptions();
  renderHome();
  renderItinerary();
  renderWallet();
  renderWeather();
  setupForms();
  setupInstall();
  setupLiquidGlassNavigation();
  switchView(activeView, false);

  document.addEventListener("click", handleClick);
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
