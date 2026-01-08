// auth.js - Authentication & Session Management (GLOBAL)

/* DOM READY */
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const roleSelect = document.getElementById("role");
  const branchSelect = document.getElementById("branch");

  const storedUser = JSON.parse(localStorage.getItem("kglUser"));

  /* LOGIN PAGE LOGIC */
  if (loginForm) {
    /* ROLE → BRANCH VISIBILITY */
    if (roleSelect && branchSelect) {
      roleSelect.addEventListener("change", () => {
        if (roleSelect.value === "director") {
          branchSelect.value = "";
          branchSelect.disabled = true;
          branchSelect.closest(".form-floating").style.display = "none";
        } else {
          branchSelect.disabled = false;
          branchSelect.closest(".form-floating").style.display = "block";
        }
      });
    }

    /* LOGIN SUBMISSION */
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const username = document
        .getElementById("username")
        .value.trim()
        .toLowerCase();

      const role = roleSelect?.value;
      const branch = branchSelect?.value || null;

      /* VALIDATION */
      if (username.length < 3) {
        showAlert("Username must be at least 3 characters long.", "danger");
        return;
      }

      if (!role) {
        showAlert("Please select your role.", "danger");
        return;
      }

      if (role !== "director" && !branch) {
        showAlert("Please select your branch.", "danger");
        return;
      }

      /* CREATE SESSION */
      const userSession = {
        username,
        displayName: username.charAt(0).toUpperCase() + username.slice(1),
        role, // director | manager | sales
        branch: role === "director" ? null : branch,
        loginTime: new Date().toISOString(),
      };

      localStorage.setItem("kglUser", JSON.stringify(userSession));
      console.log("Login successful:", userSession);

      setTimeout(() => {
        window.location.href = "./dashboard.html";
      }, 300);
    });

    /* ALERT HELPER */
    function showAlert(message, type = "danger") {
      const existing = document.querySelector(".alert");
      if (existing) existing.remove();

      const alertDiv = document.createElement("div");
      alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-4 mb-0`;
      alertDiv.innerHTML = `
        <strong>${type === "danger" ? "Error" : "Success"}:</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      `;

      loginForm.parentElement.insertBefore(alertDiv, loginForm);
    }

    return;
  }

  /* PROTECTED PAGES (DASHBOARD, ETC.)*/
  if (!storedUser) {
    window.location.href = "./index.html";
    return;
  }

  /* NAVBAR USER DATA */
  const navUserName = document.getElementById("navUserName");
  const dropdownUserName = document.getElementById("dropdownUserName");
  const dropdownUserRole = document.getElementById("dropdownUserRole");
  const profileAvatar = document.getElementById("profileAvatar");
  const userBranch = document.getElementById("userBranch");

  if (navUserName) navUserName.textContent = storedUser.displayName;
  if (dropdownUserName) dropdownUserName.textContent = storedUser.displayName;
  if (dropdownUserRole)
    dropdownUserRole.textContent =
      storedUser.role.charAt(0).toUpperCase() + storedUser.role.slice(1);

  if (profileAvatar)
    profileAvatar.textContent = storedUser.displayName.charAt(0);

  if (userBranch)
    userBranch.textContent = storedUser.branch
      ? storedUser.branch.toUpperCase()
      : "All Branches";

  /* PROFILE DROPDOWN */
  const profileToggle = document.getElementById("profileToggle");
  const profileDropdown = document.getElementById("profileDropdown");

  if (profileToggle && profileDropdown) {
    profileToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle("open");
    });

    document.addEventListener("click", () => {
      profileDropdown.classList.remove("open");
    });
  }

  /* LOGOUT (GLOBAL) */
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      const confirmLogout = confirm("Are you sure you want to logout?");
      if (!confirmLogout) return;

      localStorage.removeItem("kglUser");
      window.location.href = "./index.html";
    });
  }

  /* DATE DISPLAY */
  const currentDate = document.getElementById("currentDate");
  if (currentDate) {
    currentDate.textContent = new Date().toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
});
