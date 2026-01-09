// users.js — Director User Management

document.addEventListener("DOMContentLoaded", () => {
  /* AUTH & ROLE PROTECTION */
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("kglUser"));
  } catch {
    currentUser = null;
  }

  if (!currentUser || currentUser.role !== "director") {
    alert("Access denied. Directors only.");
    window.location.href = "../../index.html";
    return;
  }

  /* DOM REFERENCES */
  const usersList = document.getElementById("usersList");
  const userForm = document.getElementById("userForm");
  const modalTitle = document.getElementById("addUserModalLabel");
  const editUserId = document.getElementById("editUserId");

  /* HELPERS */
  const safeParse = (key, fallback = []) => {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      return Array.isArray(data) ? data : fallback;
    } catch {
      return fallback;
    }
  };

  const capitalize = (text = "") =>
    text.charAt(0).toUpperCase() + text.slice(1);

  const roleLabel = (role) =>
    ({
      manager: "Manager",
      sales: "Sales Agent",
      director: "Director",
    })[role] || capitalize(role);

  /* LOAD USERS */
  function loadUsers() {
    const users = safeParse("kglStaff");

    if (users.length === 0) {
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
        return `
          <div class="user-card mb-3">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h5 class="mb-1">${u.username}</h5>
                <p class="mb-0">
                  <span class="role-badge role-${u.role} me-2">
                    ${roleLabel(u.role)}
                  </span>
                  <strong>Branch:</strong> ${capitalize(u.branch)}
                </p>
              </div>

              <div class="d-flex gap-2">
                <button
                  class="btn btn-sm btn-edit"
                  onclick="editUser(${index})"
                >
                  Edit
                </button>
                <button
                  class="btn btn-sm btn-delete"
                  onclick="deleteUser(${index})"
                >
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

    let users = safeParse("kglStaff");
    const userId = editUserId.value;

    const duplicate = users.find(
      (u, i) => u.username === username && i.toString() !== userId,
    );

    if (duplicate) {
      alert("A user with this username already exists.");
      return;
    }

    const userData = {
      username,
      role,
      branch,
      active: true,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.username,
    };

    if (userId === "") {
      users.push(userData);
    } else {
      if (!confirm("Save changes to this user?")) return;
      users[userId] = { ...users[userId], ...userData };
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
    const users = safeParse("kglStaff");
    const u = users[index];
    if (!u) return;

    document.getElementById("modalUsername").value = u.username;
    document.getElementById("modalRole").value = u.role;
    document.getElementById("modalBranch").value = u.branch;

    editUserId.value = index;
    modalTitle.textContent = "Edit User";

    new bootstrap.Modal(document.getElementById("addUserModal")).show();
  };

  /* DELETE USER (SAFE) */
  window.deleteUser = function (index) {
    const users = safeParse("kglStaff");
    const u = users[index];

    if (!u) return;

    if (u.username === currentUser.username) {
      alert("You cannot delete your own account.");
      return;
    }

    if (!confirm(`Delete user "${u.username}"?`)) return;

    users.splice(index, 1);
    localStorage.setItem("kglStaff", JSON.stringify(users));
    loadUsers();
  };

  /* INIT*/
  loadUsers();
});
