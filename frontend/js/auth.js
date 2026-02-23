// auth.js JWT Authentication & Session Management

const API_BASE = "http://localhost:5000/api";

/* ALERT HELPER */
function showAlert(message, type = "danger") {
  const container = document.getElementById("alertContainer");
  if (!container) return;

  const alert = document.createElement("div");
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  container.innerHTML = "";
  container.appendChild(alert);

  setTimeout(() => alert.classList.remove("show"), 6000);
}

/* =========================================================
   LOGIN + SESSION GUARD
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const loginBtn = document.getElementById("loginBtn");

  /* ===========================
     LOGIN HANDLER
  =========================== */
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      loginBtn.disabled = true;
      loginBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2"></span> Signing in...';

      const email = document.getElementById("email")?.value.trim();
      const password = document.getElementById("password")?.value;

      if (!email || !password) {
        showAlert("Email and password are required.");
        resetButton();
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Login failed");
        }

        const session = {
          token: data.token,
          user: data.user,
          loginTime: new Date().toISOString(),
        };

        localStorage.setItem("kglSession", JSON.stringify(session));

        showAlert("Login successful!", "success");

        setTimeout(() => {
          redirectByRole(data.user.role?.toLowerCase());
        }, 800);
      } catch (err) {
        console.error("LOGIN ERROR:", err);
        showAlert(err.message || "Server error. Try again later.");
      } finally {
        resetButton();
      }
    });
  }

  /* ===========================
     SESSION GUARD (non-login pages)
  =========================== */
  const currentPath = window.location.pathname;

  if (currentPath.includes("login.html")) return;

  const session = getSession();

  if (!session || !session.token) {
    redirectToLogin();
    return;
  }

  populateUI(session.user);
  enforceRoleAccess(session.user.role?.toLowerCase());
  attachLogout();

  function resetButton() {
    loginBtn.disabled = false;
    loginBtn.textContent = "Login to Dashboard";
  }
});

/* =========================================================
   SESSION UTILITIES
========================================================= */
function getSession() {
  try {
    const raw = localStorage.getItem("kglSession");
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session.token || !session.user) return null;
    return session;
  } catch {
    localStorage.removeItem("kglSession");
    return null;
  }
}

/* =========================================================
   REDIRECTS (ABSOLUTE PATHS FOR CURRENT SETUP)
========================================================= */
function redirectToLogin() {
  localStorage.removeItem("kglSession");
  window.location.href = "/frontend/login.html";
}

function redirectByRole(role) {
  let path;

  switch (role) {
    case "director":
      path = "/frontend/pages/director/dashboard.html";
      break;

    case "manager":
    case "sales":
      path = "/frontend/dashboard.html";
      break;

    default:
      showAlert("Invalid role assigned.");
      redirectToLogin();
      return;
  }

  window.location.href = path;
}

/* ROLE ENFORCEMENT */
function enforceRoleAccess(role) {
  const allowed = document.body.dataset.role;
  if (!allowed) return;

  const allowedRoles = allowed
    .toLowerCase()
    .split(" ")
    .map((r) => r.trim());

  if (!allowedRoles.includes(role)) {
    alert("You do not have permission to access this page.");
    redirectByRole(role);
  }
}

/* UI POPULATION */
function populateUI(user) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || "-";
  };

  const name = user.name || user.email || "User";

  set("navUserName", name);
  set("dropdownUserName", name);
  set("dropdownUserRole", capitalize(user.role || ""));

  const branchEl = document.getElementById("userBranch");
  if (branchEl) {
    branchEl.textContent =
      user.role?.toLowerCase() === "director"
        ? "All Branches"
        : (user.branch || "-").toUpperCase();
  }

  const avatar = document.getElementById("profileAvatar");
  if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
}

/* LOGOUT HANDLER */
function attachLogout() {
  document
    .querySelectorAll("[data-logout], #logoutBtn, .logout-link")
    .forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("kglSession");
        redirectToLogin();
      });
    });
}

/* UTIL */
function capitalize(str = "") {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
