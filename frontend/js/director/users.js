// users.js - Director User Management (FINAL)

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("kglUser") || "{}");

  /* ROLE PROTECTION */
  if (!user || user.role !== "director") {
    alert("Access denied. Director only.");
    window.location.href = "../../index.html";
    return;
  }

  const usersList = document.getElementById("usersList");
  const userForm = document.getElementById("userForm");
  const modalTitle = document.getElementById("addUserModalLabel");
  const editUserId = document.getElementById("editUserId");

  /* LOAD USERS */
  function loadUsers() {
    const users = JSON.parse(localStorage.getItem("kglStaff") || "[]");

    if (!Array.isArray(users) || users.length === 0) {
      usersList.innerHTML = `
        <div class="text-center text-muted py-5">
          <h4>No staff accounts found</h4>
          <p>Click <strong>“Add New User”</strong> to create staff access.</p>
        </div>
      `;
      return;
    }

    usersList.innerHTML = users
      .map((u, index) => {
        const roleLabel = u.role === "manager" ? "Manager" : "Sales Agent";

        return `
          <div class="user-card mb-3">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h5 class="mb-1">${u.username}</h5>
                <p class="mb-0">
                  <span class="role-badge role-${u.role} me-2">${roleLabel}</span>
                  <strong>Branch:</strong> ${capitalize(u.branch)}
                </p>
              </div>

              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-edit" onclick="editUser(${index})">
                  Edit
                </button>
                <button class="btn btn-sm btn-delete" onclick="deleteUser(${index})">
                  Delete
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  /* ADD / EDIT USER */
  userForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const usernameInput = document.getElementById("modalUsername");
    const role = document.getElementById("modalRole").value;
    const branch = document.getElementById("modalBranch").value;

    const username = usernameInput.value.trim().toLowerCase();

    if (username.length < 3) {
      alert("Username must be at least 3 characters.");
      return;
    }

    if (!branch) {
      alert("Branch is required.");
      return;
    }

    let users = JSON.parse(localStorage.getItem("kglStaff") || "[]");
    const userId = editUserId.value;

    // Prevent duplicate usernames
    const duplicate = users.find(
      (u, i) => u.username === username && i.toString() !== userId,
    );

    if (duplicate) {
      alert("A user with this username already exists.");
      return;
    }

    const userData = { username, role, branch };

    if (userId === "") {
      users.push(userData);
    } else {
      if (!confirm("Save changes to this user?")) return;
      users[userId] = userData;
    }

    localStorage.setItem("kglStaff", JSON.stringify(users));

    bootstrap.Modal.getInstance(document.getElementById("addUserModal")).hide();

    userForm.reset();
    editUserId.value = "";
    modalTitle.textContent = "Add New User";

    loadUsers();
  });

  /* EDIT USER */
  window.editUser = function (index) {
    const users = JSON.parse(localStorage.getItem("kglStaff") || "[]");
    const u = users[index];

    document.getElementById("modalUsername").value = u.username;
    document.getElementById("modalRole").value = u.role;
    document.getElementById("modalBranch").value = u.branch;

    editUserId.value = index;
    modalTitle.textContent = "Edit User";

    new bootstrap.Modal(document.getElementById("addUserModal")).show();
  };

  /* DELETE USER */
  window.deleteUser = function (index) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    const users = JSON.parse(localStorage.getItem("kglStaff") || "[]");
    users.splice(index, 1);
    localStorage.setItem("kglStaff", JSON.stringify(users));
    loadUsers();
  };

  /* UTIL */
  function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  loadUsers();
});
