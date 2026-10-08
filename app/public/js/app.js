// Shared helpers for the HR portal pages. All per-user data lives in sessionStorage,
// so every browser tab (and every Playwright test) starts from a clean state.

const NAV_LINKS = [
  { href: "/dashboard.html", label: "Dashboard" },
  { href: "/time-off.html", label: "Time Off" },
  { href: "/documents.html", label: "Documents" },
  { href: "/directory.html", label: "Directory" },
  { href: "/profile.html", label: "My Profile" },
  { href: "/chat.html", label: "HR Assistant" },
];

export const store = {
  get(key, fallback) {
    const raw = sessionStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  },
  set(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
  },
};

export function currentUser() {
  return store.get("session", null);
}

// Redirects to the login page when nobody is signed in; otherwise renders the header.
// While redirecting it never resolves, so the calling page script stops without an error.
export async function requireAuth() {
  const user = currentUser();
  if (!user) {
    location.replace(`/login.html?next=${encodeURIComponent(location.pathname)}`);
    return new Promise(() => {});
  }
  renderHeader(user);
  return user;
}

function renderHeader(user) {
  const header = document.createElement("header");
  header.className = "site-header";
  const links = NAV_LINKS.map(({ href, label }) => {
    const current = location.pathname === href ? ' aria-current="page"' : "";
    return `<a href="${href}"${current}>${label}</a>`;
  }).join("");
  header.innerHTML = `
    <span class="brand">Acme HR Portal</span>
    <nav aria-label="Main">${links}</nav>
    <span class="user">
      <span data-testid="user-name">${user.name}</span>
      <button type="button" class="link-button" data-testid="logout-button">Log out</button>
    </span>`;
  header.querySelector("[data-testid=logout-button]").addEventListener("click", () => {
    sessionStorage.clear();
    location.assign("/login.html?loggedOut=1");
  });
  document.body.prepend(header);
}

let configPromise;
export function getConfig() {
  configPromise ??= fetch("/api/config").then((r) => r.json());
  return configPromise;
}

// Seeded bugs are switched on server-side with the BUGS env var, e.g. BUGS=upload.
export async function bugEnabled(name) {
  const { bugs } = await getConfig();
  return bugs.includes(name);
}

export async function ptoSummary() {
  const { ptoBalanceDays } = await getConfig();
  const requests = store.get("timeOffRequests", []);
  const used = requests.reduce((sum, r) => sum + r.days, 0);
  return { total: ptoBalanceDays, used, available: ptoBalanceDays - used, requests };
}

export function showMessage(el, text, kind) {
  el.textContent = text;
  el.className = `message ${kind}`;
  el.hidden = false;
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
