// users.js - Director User Management

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("kglUser") || "{}");

  // Restrict to Director only
  if (!user || user.role !== "director") {
    alert("Access denied. Director only.");
    window.location.href = "../../index.html";
    return;
  }

  const usersList = document.getElementById("usersList");
  const userForm = document.getElementById("userForm");
  const modalTitle = document.getElementById("addUserModalLabel");
  const editUserId = document.getElementById("editUserId");

  // Load and display users
  function loadUsers() {
    let users = JSON.parse(localStorage.getItem("kglStaff") || "[]");

    if (users.length === 0) {
      usersList.innerHTML = `
        <div class="text-center text-muted py-5">
          <i class="fas fa-users-slash fa-4x mb-3"></i>
          <h4>No staff accounts yet</h4>
          <p>Click "Add New User" to get started.</p>
        </div>
      `;
      return;
    }

    usersList.innerHTML = users.map((u, index) => `
      <div class="user-card">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h5 class="mb-1">${u.username}</h5>
            <p class="mb-2">
              <span class="role-badge role-${u.role} me-3">
                ${u.role === "manager" ? "Manager" : "Sales Agent"}
              </span>
              <strong>Branch:</strong> ${u.branch}
            </p>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-edit" onclick="editUser(${index})">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-sm btn-delete" onclick="deleteUser(${index})">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `).join("");
  }

  // Add or Edit User
  userForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = document.getElementById("modalUsername").value.trim();
    const role = document.getElementById("modalRole").value;
    const branch = document.getElementById("modalBranch").value;

    if (username.length < 3) {
      alert("Username must be at least 3 characters.");
      return;
    }

    let users = JSON.parse(localStorage.getItem("kglStaff") || "[]");
    const userId = editUserId.value;

    if (userId === "") {
      // Add new
      users.push({ username, role, branch });
    } else {
      // Edit existing
      users[userId] = { username, role, branch };
    }

    localStorage.setItem("kglStaff", JSON.stringify(users));
    bootstrap.Modal.getInstance(document.getElementById("addUserModal")).hide();
    userForm.reset();
    editUserId.value = "";
    modalTitle.innerHTML = `<i class="fas fa-user-plus me-2"></i> Add New User`;
    loadUsers();
  });

  // Edit User
  window.editUser = function(index) {
    let users = JSON.parse(localStorage.getItem("kglStaff") || "[]");
    const u = users[index];

    document.getElementById("modalUsername").value = u.username;
    document.getElementById("modalRole").value = u.role;
    document.getElementById("modalBranch").value = u.branch;
    editUserId.value = index;
    modalTitle.innerHTML = `<i class="fas fa-user-edit me-2"></i> Edit User`;

    new bootstrap.Modal(document.getElementById("addUserModal")).show();
  };

  // Delete User
  window.deleteUser = function(index) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    let users = JSON.parse(localStorage.getItem("kglStaff") || "[]");
    users.splice(index, 1);
    localStorage.setItem("kglStaff", JSON.stringify(users));
    loadUsers();
  };

  // Initial load
  loadUsers();
});