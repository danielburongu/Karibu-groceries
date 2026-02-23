// layout-utils.js

(function (window) {
  "use strict";

  const LayoutUtils = {};

  LayoutUtils.getCurrentUser = function () {
    try {
      const session = JSON.parse(localStorage.getItem("kglSession") || "{}");
      return session.user || null;
    } catch {
      return null;
    }
  };

  LayoutUtils.applyRoleVisibility = function (role, root = document) {
    if (!role) return;

    root.querySelectorAll("[data-role]").forEach((el) => {
      const allowed = el.dataset.role
        .toLowerCase()
        .split(" ")
        .map((r) => r.trim());
      el.hidden = !allowed.includes(role.toLowerCase());
    });
  };

  LayoutUtils.applyActiveLinks = function (root = document) {
    const path = window.location.pathname.replace(/\/$/, "");

    root.querySelectorAll("a[href]").forEach((link) => {
      const href = link.getAttribute("href")?.replace(/\/$/, "");
      if (!href) return;

      if (path === href || path.startsWith(href + "/")) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    });
  };

  // Optional: call on load
  document.addEventListener("DOMContentLoaded", () => {
    const user = LayoutUtils.getCurrentUser();
    if (user?.role) {
      LayoutUtils.applyRoleVisibility(user.role);
    }
    LayoutUtils.applyActiveLinks();
  });

  window.LayoutUtils = LayoutUtils;
})(window);
