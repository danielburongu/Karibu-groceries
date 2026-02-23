// director/users.js Director User Management
// Backend authoritative | JWT protected | Hardened UX

document.addEventListener("DOMContentLoaded", () => {
  /* SESSION VALIDATION */
  const session = JSON.parse(localStorage.getItem("kglSession") || "null");

  if (!session || !session.token || !session.user) {
    redirectToLogin();
    return;
  }

  if (session.user.role !== "director") {
    alert("Access denied. Directors only.");
    redirectToLogin();
    return;
  }

  const TOKEN = session.token;
  const CURRENT_USER_ID = session.user._id;
  const API_BASE = "http://localhost:5000/api";

  /* DOM REFERENCES */
  const usersList = document.getElementById("usersList");
  const userForm = document.getElementById("userForm");
  const userModalEl = document.getElementById("addUserModal");

  const totalUsersEl = document.getElementById("totalUsers");
  const managerCountEl = document.getElementById("managerCount");
  const salesCountEl = document.getElementById("salesCount");
  const branchCountEl = document.getElementById("branchCount");

  const searchInput = document.getElementById("userSearch");

  let users = [];
  let filteredUsers = [];

  /* HELPERS */
  function redirectToLogin() {
    localStorage.removeItem("kglSession");
    window.location.href = "/frontend/login.html";
  }

  function authHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    };
  }

  const capitalize = (text = "") =>
    text ? text.charAt(0).toUpperCase() + text.slice(1) : "-";

  const roleLabel = (role) =>
    ({
      director: "Director",
      manager: "Manager",
      sales: "Sales Agent",
    })[role] || capitalize(role);

  function showLoading() {
    usersList.innerHTML = `
      <div class="text-center text-muted py-5">
        Loading users...
      </div>
    `;
  }

  /* CONTEXT BAR */
  function renderContext() {
    const managers = users.filter((u) => u.role === "manager");
    const sales = users.filter((u) => u.role === "sales");
    const branches = new Set(
      users.filter((u) => u.branch).map((u) => u.branch),
    );

    totalUsersEl.textContent = users.length;
    managerCountEl.textContent = managers.length;
    salesCountEl.textContent = sales.length;
    branchCountEl.textContent = branches.size || "-";
  }

  /* SEARCH FILTER */
  function applyFilter() {
    if (!searchInput) {
      filteredUsers = [...users];
      return;
    }

    const query = searchInput.value.toLowerCase();

    filteredUsers = users.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        (u.email && u.email.toLowerCase().includes(query)) ||
        (u.branch && u.branch.toLowerCase().includes(query)),
    );
  }

  /* RENDER USERS */
  function renderUsers() {
    applyFilter();

    if (!filteredUsers.length) {
      usersList.innerHTML = `
        <div class="text-center text-muted py-5">
          <h5>No matching users found</h5>
        </div>
      `;
      return;
    }

    usersList.innerHTML = filteredUsers
      .map((u) => {
        const isActive = u.isActive !== false;
        const isSelf = u._id === CURRENT_USER_ID;

        return `
        <div class="summary-card mb-3">
          <div class="d-flex justify-content-between align-items-start gap-3">

            <div>
              <h5 class="mb-1">${u.name}</h5>

              <p class="mb-1 small text-muted">
                ${roleLabel(u.role)} • ${
                  u.role === "director" ? "All Branches" : capitalize(u.branch)
                }
              </p>

              <span class="status-pill ${
                isActive ? "status-active" : "status-disabled"
              }">
                ${isActive ? "Active" : "Disabled"}
              </span>
            </div>

            <div class="user-actions">

              ${
                isSelf
                  ? `
                <span class="badge bg-secondary">You</span>
              `
                  : `
                <button
                  class="btn-inline ${isActive ? "danger" : ""} btn-toggle"
                  data-id="${u._id}"
                >
                  ${isActive ? "Disable" : "Activate"}
                </button>
              `
              }
            </div>

          </div>
        </div>
      `;
      })
      .join("");
  }

  /* FETCH USERS */
  async function fetchUsers() {
    showLoading();

    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: authHeaders(),
      });

      if (res.status === 401) {
        redirectToLogin();
        return;
      }

      if (!res.ok) throw new Error("Failed to load users");

      users = await res.json();
      renderContext();
      renderUsers();
    } catch (err) {
      console.error("FETCH USERS ERROR:", err);
      usersList.innerHTML = `
        <div class="text-center text-danger py-5">
          Failed to load users
        </div>
      `;
    }
  }

  /* CREATE USER */
  userForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("modalName").value.trim();
    const email = document.getElementById("modalEmail").value.trim();
    const role = document.getElementById("modalRole").value;
    const branch = document.getElementById("modalBranch").value;

    if (!name || !email || !role) {
      alert("All fields are required.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name, email, role, branch }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to create user");
        return;
      }

      alert(`User created.\nTemporary Password: ${data.temporaryPassword}`);

      bootstrap.Modal.getInstance(userModalEl)?.hide();
      userForm.reset();
      fetchUsers();
    } catch (err) {
      console.error("CREATE USER ERROR:", err);
      alert("Network error.");
    }
  });

  /* TOGGLE USER STATUS */
  usersList.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-toggle");
    if (!btn) return;

    const userId = btn.dataset.id;

    if (!confirm("Change this user's status?")) return;

    try {
      const res = await fetch(`${API_BASE}/users/${userId}/toggle`, {
        method: "PATCH",
        headers: authHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Action failed");
        return;
      }

      fetchUsers();
    } catch (err) {
      console.error("TOGGLE ERROR:", err);
      alert("Network error.");
    }
  });

  /* SEARCH LISTENER */
  searchInput?.addEventListener("input", renderUsers);

  /* MULTI-TAB SYNC */
  window.addEventListener("storage", (e) => {
    if (e.key === "kglSession" && !e.newValue) {
      redirectToLogin();
    }
  });

  /* INIT */
  fetchUsers();
});
