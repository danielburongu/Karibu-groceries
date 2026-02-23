// navbar.js
(function () {
  "use strict";

  const body = document.body;
  const nav = document.getElementById("mainNav");
  const sidebar = document.getElementById("sidebar");

  if (!nav) return;

  /* LOAD SESSION */
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

  /* PROFILE INFO */
  const avatar = nav.querySelector("#profileAvatar");
  const navUserName = nav.querySelector("#navUserName");
  const dropdownUserName = nav.querySelector("#dropdownUserName");
  const dropdownUserRole = nav.querySelector("#dropdownUserRole");

  if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
  if (navUserName) navUserName.textContent = name;
  if (dropdownUserName) dropdownUserName.textContent = name;
  if (dropdownUserRole)
    dropdownUserRole.textContent = role.charAt(0).toUpperCase() + role.slice(1);

  /* PROFILE DROPDOWN */
  const profileToggle = nav.querySelector("#profileToggle");
  const profileDropdown = nav.querySelector("#profileDropdown");

  const closeDropdown = () => {
    if (!profileDropdown) return;
    profileDropdown.setAttribute("hidden", "");
    profileToggle?.setAttribute("aria-expanded", "false");
  };

  profileToggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = !profileDropdown.hasAttribute("hidden");

    if (isOpen) {
      closeDropdown();
    } else {
      profileDropdown.removeAttribute("hidden");
      profileToggle.setAttribute("aria-expanded", "true");
    }
  });

  profileDropdown?.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  document.addEventListener("click", closeDropdown);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDropdown();
  });

  /* MOBILE SIDEBAR TOGGLE */
  const mobileToggle = nav.querySelector("#mobileMenuToggle");

  const isMobile = () => window.matchMedia("(max-width: 991.98px)").matches;

  const closeSidebar = () => {
    sidebar?.classList.remove("open");
    body.classList.remove("sidebar-open");
    mobileToggle?.setAttribute("aria-expanded", "false");
  };

  mobileToggle?.addEventListener("click", (e) => {
    if (!isMobile()) return;
    e.stopPropagation();

    const open = sidebar?.classList.toggle("open");
    body.classList.toggle("sidebar-open", open);
    mobileToggle.setAttribute("aria-expanded", String(open));
  });

  document.addEventListener("click", (e) => {
    if (
      isMobile() &&
      body.classList.contains("sidebar-open") &&
      sidebar &&
      !sidebar.contains(e.target) &&
      !mobileToggle.contains(e.target)
    ) {
      closeSidebar();
    }
  });

  window.addEventListener("resize", () => {
    if (!isMobile()) closeSidebar();
  });

  /* ACTIVE LINK DETECTION  */
  const currentPath = window.location.pathname.replace(/\/$/, "");

  document.querySelectorAll(".nav-link, .sidebar-link").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    const cleanHref = href.replace(/\/$/, "");
    if (currentPath === cleanHref) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });

  /* ===== LOGOUT ===== */
  const logoutBtn = nav.querySelector("#logoutBtn");

  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("kglSession");
    window.location.href = "/frontend/login.html";
  });
})();
