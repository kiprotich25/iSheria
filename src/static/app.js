const API_BASE = ""; // same origin

const feedScreen = document.getElementById("feed-screen");
const detailScreen = document.getElementById("detail-screen");
const feedList = document.getElementById("feed-list");
const emptyState = document.getElementById("empty-state");

const detailTitle = document.getElementById("detail-title");
const detailSource = document.getElementById("detail-source");
const detailCategory = document.getElementById("detail-category");
const detailDeadline = document.getElementById("detail-deadline");
const detailOriginal = document.getElementById("detail-original");

const summaryText = document.getElementById("summary-text");
const summaryLoading = document.getElementById("summary-loading");
const loadingLabel = document.getElementById("loading-label");
const summaryError = document.getElementById("summary-error");

const btnEnglish = document.getElementById("btn-english");
const btnKiswahili = document.getElementById("btn-kiswahili");
const backBtn = document.getElementById("back-btn");

const seenIds = new Set();
let documentsById = {};
let currentDocId = null;
let currentLang = "en";

const STRINGS = {
  en: {
    deadlineLabel: "Deadline:",
    noDeadline: "No deadline specified",
    loading: "Simplifying…",
    error: "Couldn't reach the AI model. Check your DEEPSEEK_API_KEY and try again.",
  },
  sw: {
    deadlineLabel: "Tarehe ya mwisho:",
    noDeadline: "Hakuna tarehe ya mwisho iliyowekwa",
    loading: "Inarahisisha…",
    error: "Imeshindikana kufikia modeli ya AI. Angalia DEEPSEEK_API_KEY yako kisha ujaribu tena.",
  },
};

async function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    try { await Notification.requestPermission(); } catch (e) { /* ignore */ }
  }
}

function notify(doc) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("New notice published", {
      body: doc.title,
      tag: doc.id,
    });
  }
}

function categoryClass(cat) {
  return ["Governance", "Finance", "Agriculture"].includes(cat) ? cat : "Other";
}

function renderCard(doc, isNew) {
  const li = document.createElement("li");
  li.className = "feed-card";
  li.dataset.id = doc.id;

  const barColor = {
    Governance: "var(--blue)",
    Finance: "var(--green)",
    Agriculture: "var(--amber)",
  }[doc.category] || "#5b4fb5";

  li.innerHTML = `
    <div class="card-bar" style="background:${barColor}"></div>
    <div class="card-body">
      <div class="card-top">
        <p class="card-title">${doc.title}</p>
        ${isNew ? '<span class="new-pill">NEW</span>' : ""}
      </div>
      <div class="card-meta">
        <span class="badge ${categoryClass(doc.category)}">${doc.category}</span>
        <span class="card-source">${doc.source}</span>
      </div>
    </div>
  `;

  li.addEventListener("click", () => openDetail(doc.id));
  feedList.prepend(li);
}

async function pollDocuments() {
  try {
    const res = await fetch(`${API_BASE}/api/documents`);
    const data = await res.json();
    documentsById = Object.fromEntries(data.documents.map((d) => [d.id, d]));

    for (const doc of data.documents) {
      if (!seenIds.has(doc.id)) {
        seenIds.add(doc.id);
        renderCard(doc, true);
        notify(doc);
        setTimeout(() => {
          const pill = feedList.querySelector(`[data-id="${doc.id}"] .new-pill`);
          if (pill) pill.remove();
        }, 8000);
      }
    }

    emptyState.classList.toggle("hidden", data.documents.length > 0);
  } catch (e) {
    // Backend not reachable yet; fail silently and retry on next tick.
  }
}

function openDetail(id) {
  currentDocId = id;
  currentLang = "en";
  const doc = documentsById[id];
  if (!doc) return;

  detailTitle.textContent = doc.title;
  detailSource.textContent = doc.source;
  detailOriginal.textContent = doc.body;
  detailCategory.textContent = doc.category;
  detailCategory.className = `badge ${categoryClass(doc.category)}`;

  setLangButtons("en");
  renderDeadline(doc, "en");
  summaryText.textContent = "";
  summaryError.classList.add("hidden");

  feedScreen.classList.remove("active");
  detailScreen.classList.add("active");

  fetchSummary(id, "en");
}

function renderDeadline(doc, lang) {
  const s = STRINGS[lang];
  if (doc.deadline) {
    detailDeadline.textContent = `${s.deadlineLabel} ${doc.deadline}`;
    detailDeadline.className = "deadline-chip has-deadline";
  } else {
    detailDeadline.textContent = s.noDeadline;
    detailDeadline.className = "deadline-chip no-deadline";
  }
}

function setLangButtons(lang) {
  btnEnglish.classList.toggle("active", lang === "en");
  btnKiswahili.classList.toggle("active", lang === "sw");
}

const summaryCacheClient = {}; // { "doc-1:en": "...", "doc-1:sw": "..." }

async function fetchSummary(id, lang) {
  const cacheKey = `${id}:${lang}`;
  summaryError.classList.add("hidden");

  if (summaryCacheClient[cacheKey]) {
    summaryText.textContent = summaryCacheClient[cacheKey];
    return;
  }

  summaryText.textContent = "";
  loadingLabel.textContent = STRINGS[lang].loading;
  summaryLoading.classList.remove("hidden");

  try {
    const res = await fetch(`${API_BASE}/api/summarize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doc_id: id, lang }),
    });
    if (!res.ok) throw new Error("bad response");
    const data = await res.json();
    summaryCacheClient[cacheKey] = data.summary;
    summaryText.textContent = data.summary;
  } catch (e) {
    summaryError.textContent = STRINGS[lang].error;
    summaryError.classList.remove("hidden");
  } finally {
    summaryLoading.classList.add("hidden");
  }
}

btnEnglish.addEventListener("click", () => {
  if (currentLang === "en" || !currentDocId) return;
  currentLang = "en";
  setLangButtons("en");
  renderDeadline(documentsById[currentDocId], "en");
  fetchSummary(currentDocId, "en");
});

btnKiswahili.addEventListener("click", () => {
  if (currentLang === "sw" || !currentDocId) return;
  currentLang = "sw";
  setLangButtons("sw");
  renderDeadline(documentsById[currentDocId], "sw");
  fetchSummary(currentDocId, "sw");
});

backBtn.addEventListener("click", () => {
  detailScreen.classList.remove("active");
  feedScreen.classList.add("active");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => { /* ignore in dev */ });
  });
}

requestNotificationPermission();
pollDocuments();
setInterval(pollDocuments, 4000);
