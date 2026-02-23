// sidebar.js
(function () {
  "use strict";

  const sidebar = document.getElementById("sidebar");
  const body = document.body;
  if (!sidebar) return;

  const isDesktop = () => window.matchMedia("(min-width: 992px)").matches;

  const isMobile = () => window.matchMedia("(max-width: 991.98px)").matches;

  /* LOAD SESSION (uses kglSession) */
  let session;
  try {
    session = JSON.parse(localStorage.getItem("kglSession") || "null");
  } catch {
    return;
  }

  if (!session?.user) return;

  const user = session.user;
  const role = (user.role || "").toLowerCase();
  const name = user.displayName || user.name || user.username || "User";

  /* ROLE VISIBILITY */
  sidebar.querySelectorAll(".sidebar-group").forEach((group) => {
    const roles =
      group.dataset.role?.split(" ").map((r) => r.toLowerCase()) || [];

    group.hidden = !roles.includes(role);
  });

  /* ACTIVE LINK (ROBUST)*/
  const currentPath = window.location.pathname.replace(/\/$/, "");

  sidebar.querySelectorAll(".sidebar-link").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    const cleanHref = href.replace(/\/$/, "");

    if (currentPath === cleanHref) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }

    // Auto-close sidebar on mobile navigation
    link.addEventListener("click", () => {
      if (isMobile()) {
        sidebar.classList.remove("open");
        body.classList.remove("sidebar-open");
      }
    });
  });

  /* MOBILE USER CARD */
  const avatar = sidebar.querySelector("#sidebarUserAvatar");
  const username = sidebar.querySelector("#sidebarUserName");
  const userrole = sidebar.querySelector("#sidebarUserRole");

  if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
  if (username) username.textContent = name;
  if (userrole)
    userrole.textContent = role.charAt(0).toUpperCase() + role.slice(1);

  /* DESKTOP COLLAPSE (Persistent) */
  const collapseBtn = sidebar.querySelector("#sidebarCollapseBtn");

  const applyCollapseState = (collapsed) => {
    body.classList.toggle("sidebar-collapsed", collapsed);
    localStorage.setItem("sidebarCollapsed", collapsed ? "1" : "0");

    collapseBtn?.setAttribute("aria-expanded", String(!collapsed));
  };

  const restoreState = () => {
    const saved = localStorage.getItem("sidebarCollapsed") === "1";

    if (isDesktop()) {
      applyCollapseState(saved);
    } else {
      body.classList.remove("sidebar-collapsed");
    }
  };

  restoreState();

  collapseBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isDesktop()) return;

    const collapsed = !body.classList.contains("sidebar-collapsed");

    applyCollapseState(collapsed);
  });

  /* BREAKPOINT SYNC */
  let lastDesktop = isDesktop();

  window.addEventListener("resize", () => {
    const now = isDesktop();
    if (now !== lastDesktop) {
      restoreState();
      lastDesktop = now;
    }
  });
})();
