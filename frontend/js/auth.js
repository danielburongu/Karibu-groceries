// auth.js — Authentication & Role Handling

document.addEventListener("DOMContentLoaded", () => {
  /* SAFE USER LOAD */
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("kglUser"));
  } catch {
    user = null;
  }

  const loginForm = document.getElementById("loginForm");
  const roleSelect = document.getElementById("role");
  const branchSelect = document.getElementById("branch");

  /* LOGIN PAGE LOGIC */
  if (loginForm) {
    if (roleSelect && branchSelect) {
      roleSelect.addEventListener("change", () => {
        const wrapper = branchSelect.closest(".form-floating");

        if (roleSelect.value === "director") {
          branchSelect.value = "";
          branchSelect.disabled = true;
          if (wrapper) wrapper.style.display = "none";
        } else {
          branchSelect.disabled = false;
          if (wrapper) wrapper.style.display = "block";
        }
      });
    }

    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const username = document
        .getElementById("username")
        .value.trim()
        .toLowerCase();

      const role = roleSelect?.value;
      const branch = branchSelect?.value || null;

      if (username.length < 3) {
        showAlert("Username must be at least 3 characters long.");
        return;
      }

      if (!role) {
        showAlert("Please select your role.");
        return;
      }

      if (role !== "director" && !branch) {
        showAlert("Please select your branch.");
        return;
      }

      const session = {
        username,
        displayName: username.charAt(0).toUpperCase() + username.slice(1),
        role,
        branch: role === "director" ? null : branch,
        loginTime: new Date().toISOString(),
      };

      localStorage.setItem("kglUser", JSON.stringify(session));
      window.location.href = "./dashboard.html";
    });

    function showAlert(message) {
      const existing = document.querySelector(".alert");
      if (existing) existing.remove();

      const alert = document.createElement("div");
      alert.className =
        "alert alert-danger alert-dismissible fade show mt-4 mb-0";
      alert.innerHTML = `
        <strong>Error:</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      `;
      loginForm.parentElement.insertBefore(alert, loginForm);
    }

    return; // stop auth.js here on login page
  }

  /* PROTECTED PAGE GUARD */
  if (!user || !user.role) {
    window.location.href = "./index.html";
    return;
  }

  /* 
     <body data-role="director">
     <body data-roles="manager,sales">
   */
  const singleRole = document.body.dataset.role;
  const multipleRoles = document.body.dataset.roles;

  if (singleRole && user.role !== singleRole) {
    alert("Access denied.");
    window.location.href = "./dashboard.html";
    return;
  }

  if (multipleRoles) {
    const allowed = multipleRoles.split(",").map((r) => r.trim());
    if (!allowed.includes(user.role)) {
      alert("Access denied.");
      window.location.href = "./dashboard.html";
      return;
    }
  }

  /* USER INFO  */
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText("navUserName", user.displayName);
  setText("dropdownUserName", user.displayName);
  setText(
    "dropdownUserRole",
    user.role.charAt(0).toUpperCase() + user.role.slice(1),
  );
  setText("profileAvatar", user.displayName.charAt(0).toUpperCase());

  const branchEl = document.getElementById("userBranch");
  if (branchEl) {
    branchEl.textContent = user.branch
      ? user.branch.toUpperCase()
      : "All Branches";
  }

  const dateEl = document.getElementById("currentDate");
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  /* ROLE-BASED VISIBILITY */
  applyRoleVisibility(user.role);
});

/* ROLE VISIBILITY  */
function applyRoleVisibility(role) {
  const map = {
    director: ["role-director"],
    manager: ["role-manager"],
    sales: ["role-sales"],
  };

  document.querySelectorAll("[class*='role-']").forEach((el) => {
    const allowed = map[role]?.some((cls) => el.classList.contains(cls));
    el.style.display = allowed ? "" : "none";
  });
}
