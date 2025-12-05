// =========================================================
// HELPERS
// =========================================================
function formatRSVPStatus(status) {
  if (status === "going") return "registered";
  return status || "";
}

// =========================================================
// CONFIG
// =========================================================
// Check if opened directly from file system
if (window.location.protocol === 'file:') {
  document.body.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif;background:#f3f4f6;padding:20px;text-align:center;">
      <h1 style="color:#dc2626;font-size:2rem;margin-bottom:1rem;">⚠️ Cannot Open Directly</h1>
      <p style="color:#4b5563;font-size:1.1rem;max-width:500px;margin-bottom:1.5rem;">
        This file cannot be opened directly from the file system.<br>
        Please access it through the server.
      </p>
      <div style="background:#1f2937;color:#10b981;padding:1rem 2rem;border-radius:8px;font-family:monospace;font-size:1rem;">
        http://localhost:8080
      </div>
      <p style="color:#6b7280;font-size:0.9rem;margin-top:1.5rem;">
        Make sure Docker is running:<br>
        <code style="background:#e5e7eb;padding:4px 8px;border-radius:4px;">docker-compose -f docker-compose.local.yaml up</code>
      </p>
    </div>
  `;
  throw new Error('App must be accessed through HTTP server, not file:// protocol');
}

// Auto-detect API and WebSocket URLs based on current location
const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const protocol = window.location.protocol;
const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
const host = window.location.host;

// Use relative URLs for production, localhost:8080 for local dev
const API_BASE = isLocalDev ? `${protocol}//${host}` : `${protocol}//${host}`;
const WS_BASE = isLocalDev ? `${wsProtocol}//${host}` : `${wsProtocol}//${host}`;

let token = "";
let user = null;
let socket = null;

let previousPage = null;
let editingEventId = null;

let currentEventRoom = null;
let typingTimeout = null;

// =========================================================
// TOAST NOTIFICATION SYSTEM
// =========================================================
function showToast(message, type = "info") {
  const container = document.getElementById("toast_container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `px-6 py-3 rounded-lg shadow-lg text-white transition-opacity duration-300 ${
    type === "success" ? "bg-green-600" :
    type === "error" ? "bg-red-600" :
    type === "warning" ? "bg-yellow-600" : "bg-blue-600"
  }`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// =========================================================
// DATE FORMATTING UTILITIES
// =========================================================
function formatRelativeDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = date - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days > 1 && days <= 7) return `In ${days} days`;
  if (days < -1 && days >= -7) return `${Math.abs(days)} days ago`;
  return date.toLocaleDateString();
}

function getCategoryColor(category) {
  const colors = {
    'workshop': 'bg-blue-100 text-blue-800',
    'career': 'bg-green-100 text-green-800',
    'academic': 'bg-purple-100 text-purple-800',
    'social': 'bg-pink-100 text-pink-800',
    'seminar': 'bg-yellow-100 text-yellow-800'
  };
  return colors[category?.toLowerCase()] || 'bg-gray-100 text-gray-800';
}

// =========================================================
// PAGE SWITCHING
// =========================================================
function showPage(id) {
  const pages = ["login_page", "register_page", "student_page", "organizer_page", "event_detail_page"];

  pages.forEach(p => {
    const el = document.getElementById(p);
    if (el) el.classList.add("hidden");
  });

  // maybe event_chat_panel is not loaded yet
  const chatPanel = document.getElementById("event_chat_panel");
  if (chatPanel && id !== "event_detail_page") {
    chatPanel.classList.add("hidden");
  }

  const active = document.getElementById(id);
  if (active) active.classList.remove("hidden");
}




// =========================================================
// LOGOUT — HARD RESET TO LOGIN PAGE
// =========================================================
function logout() {
  token = "";
  user = null;
  
  // Clear token from localStorage
  localStorage.removeItem("token");
  
  socket?.disconnect();
  socket = null;

  showPage("login_page");
}



// =========================================================
// PROFILE MODAL
// =========================================================
function openProfileModal() {
  if (!user) return;

  // Get user initials for avatar
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  // Update avatar
  const avatarEl = document.getElementById('profile_avatar');
  if (avatarEl) {
    avatarEl.textContent = initials;
    // Set gradient based on role
    if (user.role === 'student') {
      avatarEl.className = 'w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white';
    } else {
      avatarEl.className = 'w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white';
    }
  }

  // Update profile info
  document.getElementById('profile_name').textContent = user.name;
  document.getElementById('profile_email').textContent = user.email;
  document.getElementById('profile_role').textContent = user.role;
  document.getElementById('profile_id').textContent = `#${user.id}`;

  // Update role badge
  const roleBadge = document.getElementById('profile_role_badge');
  if (roleBadge) {
    if (user.role === 'student') {
      roleBadge.textContent = '🎓 Student';
      roleBadge.className = 'inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700';
    } else if (user.role === 'organizer') {
      roleBadge.textContent = '📋 Organizer';
      roleBadge.className = 'inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700';
    } else {
      roleBadge.textContent = user.role;
      roleBadge.className = 'inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700';
    }
  }

  // Show modal
  document.getElementById('profile_modal').classList.remove('hidden');
}

function closeProfileModal() {
  document.getElementById('profile_modal').classList.add('hidden');
}

function updateUserAvatars() {
  if (!user) return;

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const studentAvatar = document.getElementById('student_avatar');
  const organizerAvatar = document.getElementById('organizer_avatar');

  if (studentAvatar) studentAvatar.textContent = initials;
  if (organizerAvatar) organizerAvatar.textContent = initials;
}



// =========================================================
// LOGIN
// =========================================================
async function login() {
  document.getElementById("login_error").classList.add("hidden");

  const email = document.getElementById("login_email").value;
  const password = document.getElementById("login_password").value;

  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  }).then(r => r.json());

  if (!res.token) {
    document.getElementById("login_error").textContent =
      "Incorrect username or password, please try again.";
    document.getElementById("login_error").classList.remove("hidden");
    return;
  }

  token = res.token;
  user = res.user;
  
  // Save token to localStorage
  localStorage.setItem("token", token);

  initWebSocket();
  updateUserAvatars();

  if (user.role === "student") {
    showPage("student_page");
    setStudentTab("browse");
  } else {
    showPage("organizer_page");
    setOrganizerTab("browse");
  }
}



// =========================================================
// REGISTER
// =========================================================
async function register() {
  const name = document.getElementById("reg_name").value;
  const email = document.getElementById("reg_email").value;
  const password = document.getElementById("reg_password").value;
  const role = document.getElementById("reg_role").value;

  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role })
  }).then(r => r.json());

  if (res.error) {
    document.getElementById("register_error").textContent = res.error;
    document.getElementById("register_error").classList.remove("hidden");
    return;
  }

  showToast("Account created successfully! Check your email for confirmation.", "success");

  token = res.token;
  user = res.user;
  
  // Save token to localStorage
  localStorage.setItem("token", token);

  initWebSocket();
  updateUserAvatars();

  if (user.role === "student") {
    showPage("student_page");
    setStudentTab("browse");
  } else {
    showPage("organizer_page");
    setOrganizerTab("browse");
  }
}



// =========================================================
// STUDENT TABS
// =========================================================
function setStudentTab(id) {
  const tabs = ["browse", "my_events"];

  tabs.forEach(tab => {
    document.getElementById("student_" + tab).classList.add("hidden");
    document.getElementById("student_" + tab + "_btn")
      .classList.remove("border-blue-600", "text-blue-600");
  });

  document.getElementById("student_" + id).classList.remove("hidden");
  document.getElementById("student_" + id + "_btn")
    .classList.add("border-blue-600", "text-blue-600");

  if (id === "browse") loadEventsList("student");
  if (id === "my_events") loadStudentMyEvents();
}



// =========================================================
// ORGANIZER TABS
// =========================================================
function setOrganizerTab(id) {
  const tabs = ["browse", "my_events", "analytics"];

  tabs.forEach(tab => {
    document.getElementById("organizer_" + tab).classList.add("hidden");
    document.getElementById("organizer_" + tab + "_btn")
      .classList.remove("border-blue-600", "text-blue-600");
  });

  document.getElementById("organizer_" + id).classList.remove("hidden");
  document.getElementById("organizer_" + id + "_btn")
    .classList.add("border-blue-600", "text-blue-600");

  if (id === "browse") loadEventsList("organizer");
  if (id === "my_events") loadMyEventsList();
  if (id === "analytics") loadAnalytics();
}



// =========================================================
// INITIAL PANELS
// =========================================================



// =========================================================
// LOAD EVENTS LIST
// =========================================================
async function loadEventsList(role) {
  const listId = role === "student" ? "student_event_list" : "organizer_event_list";
  const prefix = role === "student" ? "student" : "organizer";

  const params = new URLSearchParams();

  const qEl = document.getElementById(`${prefix}_filter_q`);
  const facultyEl = document.getElementById(`${prefix}_filter_faculty`);
  const categoryEl = document.getElementById(`${prefix}_filter_category`);
  const fromEl = document.getElementById(`${prefix}_filter_from`);
  const toEl = document.getElementById(`${prefix}_filter_to`);
  const sortEl = document.getElementById(`${prefix}_sort`);

  const hasFilters = (qEl && qEl.value.trim()) || (facultyEl && facultyEl.value.trim()) || 
                     (categoryEl && categoryEl.value.trim()) || (fromEl && fromEl.value) || (toEl && toEl.value);

  if (qEl && qEl.value.trim()) params.append("q", qEl.value.trim());
  if (facultyEl && facultyEl.value.trim()) params.append("faculty", facultyEl.value.trim());
  if (categoryEl && categoryEl.value.trim()) params.append("category", categoryEl.value.trim());
  if (fromEl && fromEl.value) params.append("from", fromEl.value);
  if (toEl && toEl.value) params.append("to", toEl.value);

  const queryString = params.toString();
  const url = queryString
    ? `${API_BASE}/api/events?${queryString}`
    : `${API_BASE}/api/events`;

  const container = document.getElementById(listId);
  const resultCount = document.getElementById(`${prefix}_result_count`);
  const clearBtn = document.getElementById(`${prefix}_clear_filters`);

  // Show loading state
  if (container) {
    container.innerHTML = `<div class="text-center py-8"><p class="text-gray-600 italic">Loading events...</p></div>`;
  }

  try {
    const res = await fetch(url);
    const data = await res.json();

    let events = data.events || [];

    // Apply client-side sorting
    const sortValue = sortEl ? sortEl.value : "date_asc";
    if (sortValue === "date_desc") {
      events.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
    } else if (sortValue === "date_asc") {
      events.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    } else if (sortValue === "popular") {
      // For now, sort by ID (proxy for creation order). Could fetch RSVP counts later
      events.sort((a, b) => b.id - a.id);
    }

    // Update result count
    if (resultCount) {
      resultCount.textContent = `Showing ${events.length} event${events.length !== 1 ? 's' : ''}`;
    }

    // Show/hide clear filters button
    if (clearBtn) {
      if (hasFilters) {
        clearBtn.classList.remove("hidden");
      } else {
        clearBtn.classList.add("hidden");
      }
    }

    if (events.length === 0) {
      const emptyMessage = role === "student"
        ? `<div class="text-center py-12">
             <p class="text-gray-600 mb-4">No events found${hasFilters ? ' with current filters' : ''}.</p>
             ${hasFilters ? '<button onclick="clearFilters(\'student\')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Clear Filters</button>' : ''}
           </div>`
        : `<div class="text-center py-12">
             <p class="text-gray-600 mb-4">No events found${hasFilters ? ' with current filters' : ''}.</p>
             ${hasFilters ? '<button onclick="clearFilters(\'organizer\')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Clear Filters</button>' : ''}
           </div>`;
      container.innerHTML = emptyMessage;
      return;
    }

    container.innerHTML = events
      .map(ev => `
        <div class="border p-4 rounded mb-3 hover:bg-gray-50 cursor-pointer transition-shadow hover:shadow-md"
             onclick="openEventDetail(${ev.id}, '${role}')">
          <div class="flex justify-between items-start mb-2">
            <div class="text-xl font-semibold">${ev.title}</div>
            <span class="category-badge ${getCategoryColor(ev.category)}">${ev.category || 'Event'}</span>
          </div>
          <div class="flex items-center gap-4 text-sm text-gray-600 mb-2">
            <span class="date-badge">📅 ${formatRelativeDate(ev.start_time)}</span>
            <span>📍 ${ev.location}</span>
          </div>
          <div class="text-gray-600 text-sm">${new Date(ev.start_time).toLocaleString()}</div>
        </div>
      `)
      .join("");
  } catch (err) {
    console.error("Failed to load events:", err);
    container.innerHTML = `<div class="text-center py-8"><p class="text-red-600">Failed to load events. Please try again.</p></div>`;
    showToast("Failed to load events", "error");
  }
}

// Clear all filters
function clearFilters(role) {
  const prefix = role === "student" ? "student" : "organizer";
  
  const qEl = document.getElementById(`${prefix}_filter_q`);
  const facultyEl = document.getElementById(`${prefix}_filter_faculty`);
  const categoryEl = document.getElementById(`${prefix}_filter_category`);
  const fromEl = document.getElementById(`${prefix}_filter_from`);
  const toEl = document.getElementById(`${prefix}_filter_to`);

  if (qEl) qEl.value = "";
  if (facultyEl) facultyEl.value = "";
  if (categoryEl) categoryEl.value = "";
  if (fromEl) fromEl.value = "";
  if (toEl) toEl.value = "";

  loadEventsList(role);
  showToast("Filters cleared", "success");
}



// =========================================================
// STUDENT: MY EVENTS
// =========================================================
async function loadStudentMyEvents() {
  const list = document.getElementById("student_my_events_list");
  if (!list) return;

  list.innerHTML = `<p class="text-gray-600 italic">Loading your events...</p>`;

  // First fetch all events
  const eventsRes = await fetch(`${API_BASE}/api/events`);
  const eventsData = await eventsRes.json();
  const events = eventsData.events || [];

  const myEvents = [];

  for (const ev of events) {
    try {
      const rsvpRes = await fetch(`${API_BASE}/api/events/${ev.id}/rsvps`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!rsvpRes.ok) continue;

      const rsvpData = await rsvpRes.json();
      const rsvps = rsvpData.rsvps || [];

      const mine = rsvps.find(r => r.attendee_id === user.id && r.status !== "cancelled");
      if (mine) {
        myEvents.push({ event: ev, myRsvp: mine });
      }
    } catch (e) {
      // Ignore individual errors for now
    }
  }

  if (myEvents.length === 0) {
    list.innerHTML = `
      <div class="text-center py-12">
        <p class="text-gray-600 mb-4">You haven't RSVP'd to any events yet.</p>
        <button onclick="setStudentTab('browse')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Browse Events
        </button>
      </div>
    `;
    return;
  }

  list.innerHTML = myEvents
    .map(({ event: ev, myRsvp }) => `
      <div class="border p-4 rounded mb-3 hover:bg-gray-50">
        <div class="flex justify-between items-center">
          <div>
            <div class="text-xl font-semibold">${ev.title}</div>
            <div class="text-gray-600">${new Date(ev.start_time).toLocaleString()}</div>
            <div class="text-gray-500 text-sm">Your status: ${formatRSVPStatus(myRsvp.status)}</div>
          </div>
          <div>
            <button onclick="openEventDetail(${ev.id}, 'student')" class="px-3 py-1 bg-blue-600 text-white rounded">
              Open
            </button>
          </div>
        </div>
      </div>
    `)
    .join("");
}



// =========================================================
// EVENT DETAIL PAGE
// =========================================================
async function openEventDetail(eventId, role) {
  previousPage = role === "student" ? "student_page" : "organizer_page";

  showPage("event_detail_page");

  const res = await fetch(`${API_BASE}/api/events/${eventId}`);
  const data = await res.json();
  const ev = data.event;

  const isOwner = (user.role === "organizer" && user.id === ev.organizer_id);

  // Hide RSVP stats panel by default (will be shown only for owner)
  const statsPanel = document.getElementById("event_stats_panel");
  if (statsPanel) {
    statsPanel.classList.add("hidden");
  }

  document.getElementById("event_detail_content").innerHTML = `
    <h2 class="text-3xl font-bold mb-2">${ev.title}</h2>
    <p class="text-gray-600">${new Date(ev.start_time).toLocaleString()}</p>

    <p class="mt-3"><strong>Location:</strong> ${ev.location}</p>
    <p><strong>Faculty:</strong> ${ev.faculty}</p>
    <p><strong>Category:</strong> ${ev.category}</p>

    <p class="mt-4">${ev.description}</p>

    <p id="event_rsvp_status" class="mt-4 text-green-600 font-semibold"></p>

    <div class="mt-6">
      ${
        role === "student"
          ? `<button id="event_rsvp_button" onclick="sendRSVP(${ev.id}, 'going')" class="px-4 py-2 bg-blue-600 text-white rounded">RSVP Going</button>`
          : (
              isOwner
                ? `
                  <button onclick="openEditEvent(${ev.id})" class="px-4 py-2 bg-green-600 text-white rounded">Edit</button>
                  <button onclick="deleteEvent(${ev.id})" class="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
                `
                : `<p class="italic text-gray-600">You are not the creator of this event.</p>`
            )
      }
    </div>
  `;

  // Load RSVP stats (only for event owner)
  if (isOwner) {
    loadEventRSVPs(eventId);
  }
  
  loadEventComments(eventId);

  // Check student's existing RSVP
  if (role === "student") {
    checkMyRSVP(eventId);
  }

  // show chat panel
  document.getElementById("event_chat_panel").classList.remove("hidden");
  document.getElementById("chat_messages").innerHTML = "";

  currentEventRoom = eventId;

  socket.emit("join-event", {
    eventId,
    user: { id: user.id, name: user.name }
  });
}

// Check if current student has existing RSVP
async function checkMyRSVP(eventId) {
  try {
    const res = await fetch(`${API_BASE}/api/events/${eventId}/rsvps`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;

    const data = await res.json();
    const myRsvp = data.rsvps?.find(r => r.attendee_id === user.id && r.status !== "cancelled");

    if (myRsvp) {
      const label = document.getElementById("event_rsvp_status");
      if (label) {
        label.textContent = "Your RSVP: registered";
      }

      const btn = document.getElementById("event_rsvp_button");
      if (btn) {
        btn.textContent = "Cancel RSVP";
        btn.className = "px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded";
        btn.onclick = () => cancelRSVP(eventId);
      }
    }
  } catch (e) {
    console.error("Failed to check RSVP:", e);
  }
}



// =========================================================
// RSVP
// =========================================================
async function sendRSVP(eventId, status) {
  const res = await fetch(`${API_BASE}/api/events/${eventId}/rsvps`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });

  if (!res.ok) {
    showToast("Failed to submit RSVP.", "error");
    return;
  }

  showToast("RSVP submitted! Check your email for confirmation.", "success");

  const label = document.getElementById("event_rsvp_status");
  if (label) {
    label.textContent = "Your RSVP: registered";
  }

  const btn = document.getElementById("event_rsvp_button");
  if (btn) {
    btn.textContent = "Cancel RSVP";
    btn.className = "px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded";
    btn.onclick = () => cancelRSVP(eventId);
  }

  // Refresh student My Events if applicable
  if (user.role === "student") {
    loadStudentMyEvents();
  }
}

async function cancelRSVP(eventId) {
  if (!confirm("Are you sure you want to cancel your RSVP?")) return;

  const res = await fetch(`${API_BASE}/api/events/${eventId}/rsvps`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status: "cancelled" })
  });

  if (!res.ok) {
    showToast("Failed to cancel RSVP.", "error");
    return;
  }

  showToast("RSVP cancelled successfully.", "success");

  const label = document.getElementById("event_rsvp_status");
  if (label) {
    label.textContent = "";
  }

  const btn = document.getElementById("event_rsvp_button");
  if (btn) {
    btn.textContent = "RSVP Going";
    btn.className = "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded";
    btn.onclick = () => sendRSVP(eventId, "going");
  }

  // Refresh student My Events
  if (user.role === "student") {
    loadStudentMyEvents();
  }
}



// =========================================================
// CREATE EVENT MODAL
// =========================================================
function openCreateEventModal() {
  document.getElementById("create_event_modal").classList.remove("hidden");
}

function closeCreateEventModal() {
  document.getElementById("create_event_modal").classList.add("hidden");
  document.getElementById("create_event_error").classList.add("hidden");
}



// =========================================================
// UPDATE EVENT MODAL
// =========================================================
function openUpdateEventModal() {
  document.getElementById("update_event_modal").classList.remove("hidden");
}

function closeUpdateEventModal() {
  document.getElementById("update_event_modal").classList.add("hidden");
  document.getElementById("update_event_error").classList.add("hidden");
}



// =========================================================
// CREATE EVENT
// =========================================================
async function submitCreateEvent() {
  const title = document.getElementById("ce_title").value.trim();
  const description = document.getElementById("ce_description").value.trim();
  const location = document.getElementById("ce_location").value.trim();
  const faculty = document.getElementById("ce_faculty").value.trim();
  const category = document.getElementById("ce_category").value.trim();
  const start_time = document.getElementById("ce_start").value;
  const end_time = document.getElementById("ce_end").value;

  const errorEl = document.getElementById("create_event_error");

  // Validation
  if (!title) {
    errorEl.textContent = "Event title is required.";
    errorEl.classList.remove("hidden");
    return;
  }
  if (!location) {
    errorEl.textContent = "Location is required.";
    errorEl.classList.remove("hidden");
    return;
  }
  if (!start_time) {
    errorEl.textContent = "Start time is required.";
    errorEl.classList.remove("hidden");
    return;
  }
  if (!end_time) {
    errorEl.textContent = "End time is required.";
    errorEl.classList.remove("hidden");
    return;
  }
  if (new Date(start_time) >= new Date(end_time)) {
    errorEl.textContent = "End time must be after start time.";
    errorEl.classList.remove("hidden");
    return;
  }

  const body = {
    title,
    description,
    location,
    faculty,
    category,
    start_time,
    end_time
  };

  const res = await fetch(`${API_BASE}/api/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!res.ok) {
    errorEl.textContent = data.error || "Failed to create event.";
    errorEl.classList.remove("hidden");
    return;
  }

  closeCreateEventModal();
  showToast("Event created successfully.", "success");
  loadEventsList("organizer");
  loadMyEventsList();
}



// =========================================================
// LOAD MY EVENTS
// =========================================================
async function loadMyEventsList() {
  const res = await fetch(`${API_BASE}/api/events`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  const myEvents = data.events.filter(ev => ev.organizer_id === user.id);

  const list = document.getElementById("my_events_list");
  list.innerHTML = "";

  if (myEvents.length === 0) {
    list.innerHTML = `
      <div class="text-center py-12">
        <p class="text-gray-600 mb-4">You haven't created any events yet.</p>
        <button onclick="openCreateEventModal()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          Create Your First Event
        </button>
      </div>
    `;
    return;
  }

  list.innerHTML = myEvents
    .map(ev => `
      <div class="border p-4 rounded hover:bg-gray-50">
        <div class="flex justify-between items-center">
          <div>
            <div class="text-xl font-semibold">${ev.title}</div>
            <div class="text-gray-600">${new Date(ev.start_time).toLocaleString()}</div>
          </div>

          <div class="space-x-2">
            <button onclick="openEventDetail(${ev.id}, 'organizer')" class="px-3 py-1 bg-blue-600 text-white rounded">Open</button>
            <button onclick="openEditEvent(${ev.id})" class="px-3 py-1 bg-green-600 text-white rounded">Edit</button>
            <button onclick="deleteEvent(${ev.id})" class="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
          </div>
        </div>
      </div>
    `)
    .join("");
}



// =========================================================
// EDIT EVENT
// =========================================================
async function openEditEvent(eventId) {
  editingEventId = eventId;

  const res = await fetch(`${API_BASE}/api/events/${eventId}`);
  const data = await res.json();
  const ev = data.event;

  document.getElementById("ue_title").value = ev.title;
  document.getElementById("ue_description").value = ev.description;
  document.getElementById("ue_location").value = ev.location;
  document.getElementById("ue_faculty").value = ev.faculty;
  document.getElementById("ue_category").value = ev.category;

  document.getElementById("ue_start").value = ev.start_time.replace("Z", "");
  document.getElementById("ue_end").value = ev.end_time.replace("Z", "");

  document.getElementById("update_event_error").classList.add("hidden");

  openUpdateEventModal();
}



// =========================================================
// SUBMIT UPDATE
// =========================================================
async function submitUpdateEvent() {
  const title = document.getElementById("ue_title").value.trim();
  const description = document.getElementById("ue_description").value.trim();
  const location = document.getElementById("ue_location").value.trim();
  const faculty = document.getElementById("ue_faculty").value.trim();
  const category = document.getElementById("ue_category").value.trim();
  const start_time = document.getElementById("ue_start").value;
  const end_time = document.getElementById("ue_end").value;

  const errorEl = document.getElementById("update_event_error");

  // Validation
  if (!title) {
    errorEl.textContent = "Event title is required.";
    errorEl.classList.remove("hidden");
    return;
  }
  if (!location) {
    errorEl.textContent = "Location is required.";
    errorEl.classList.remove("hidden");
    return;
  }
  if (!start_time) {
    errorEl.textContent = "Start time is required.";
    errorEl.classList.remove("hidden");
    return;
  }
  if (!end_time) {
    errorEl.textContent = "End time is required.";
    errorEl.classList.remove("hidden");
    return;
  }
  if (new Date(start_time) >= new Date(end_time)) {
    errorEl.textContent = "End time must be after start time.";
    errorEl.classList.remove("hidden");
    return;
  }

  const body = {
    title,
    description,
    location,
    faculty,
    category,
    start_time,
    end_time
  };

  const res = await fetch(`${API_BASE}/api/events/${editingEventId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!res.ok) {
    errorEl.textContent = data.error || "Failed to update event.";
    errorEl.classList.remove("hidden");
    return;
  }

  closeUpdateEventModal();
  editingEventId = null;

  showToast("Event updated successfully.", "success");
  loadEventsList("organizer");
  loadMyEventsList();
}



// =========================================================
// DELETE EVENT
// =========================================================
async function deleteEvent(eventId) {
  const res = await fetch(`${API_BASE}/api/events/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (res.status === 403) {
    showToast("You cannot delete an event you do not own.", "error");
    return;
  }

  if (!res.ok) {
    showToast("Failed to delete event.", "error");
    return;
  }

  showToast("Event deleted successfully.", "success");
  showPage(previousPage);
  loadMyEventsList();
}



// =========================================================
// BACK
// =========================================================
function backToPreviousPage() {
  if (currentEventRoom) {
    socket.emit("leave-event", {
      eventId: currentEventRoom,
      user: { id: user.id, name: user.name }
    });
    currentEventRoom = null;
  }

  document.getElementById("event_chat_panel").classList.add("hidden");
  showPage(previousPage);
}



// =========================================================
// CHAT
// =========================================================
function sendChatMessage() {
  const input = document.getElementById("chat_input");
  const message = input.value.trim();

  if (!message || !socket || !currentEventRoom) return;

  socket.emit("chat:send", {
    eventId: currentEventRoom,
    user: { id: user.id, name: user.name },
    message
  });

  input.value = "";
  stopTyping();
}

function handleTyping() {
  if (!socket || !currentEventRoom) return;

  socket.emit("chat:typing", {
    eventId: currentEventRoom,
    user: { id: user.id, name: user.name }
  });

  if (typingTimeout) clearTimeout(typingTimeout);

  typingTimeout = setTimeout(stopTyping, 1500);
}

function stopTyping() {
  typingTimeout = null;
}

function appendChatMessage(html) {
  const box = document.getElementById("chat_messages");
  if (!box) return;

  box.innerHTML += html;
  box.scrollTop = box.scrollHeight;
}



// =========================================================
// WEBSOCKET SETUP
// =========================================================
function initWebSocket() {
  socket = io(WS_BASE);

  socket.on("comment:created", (d) => {
    if (currentEventRoom && d.eventId === currentEventRoom) {
      appendCommentToList(d.comment);
    }
  });

  socket.on("rsvp:updated", (d) => {
    // Only refresh RSVP stats if we're viewing this event AND the stats panel is visible (owner only)
    if (currentEventRoom && d.eventId === currentEventRoom) {
      const statsPanel = document.getElementById("event_stats_panel");
      if (statsPanel && !statsPanel.classList.contains("hidden")) {
        loadEventRSVPs(d.eventId);
      }
    }
  });

  socket.on("chat:new", (msg) => {
    appendChatMessage(`
      <div class="mb-2">
        <span class="font-semibold">${msg.user.name}:</span>
        <span>${msg.message}</span>
        <div class="text-xs text-gray-400">${new Date(msg.ts).toLocaleTimeString()}</div>
      </div>
    `);
  });

  socket.on("chat:typing", (userTyping) => {
    const el = document.getElementById("chat_typing");
    if (!el) return;

    el.textContent = `${userTyping.name} is typing...`;
    el.classList.remove("hidden");

    setTimeout(() => el.classList.add("hidden"), 1500);
  });

  socket.on("user:joined", ({ user }) => {
    appendChatMessage(`
      <div class="text-center text-gray-500 text-xs mb-2">
        ${user.name} joined the chat
      </div>
    `);
  });

  socket.on("user:left", ({ user }) => {
    appendChatMessage(`
      <div class="text-center text-gray-500 text-xs mb-2">
        ${user.name} left the chat
      </div>
    `);
  });
}



// =========================================================
// REALTIME PANELS
// =========================================================



// =========================================================
// EVENT RSVP STATS
// =========================================================
async function loadEventRSVPs(eventId) {
  const panel = document.getElementById("event_stats_panel");
  const summary = document.getElementById("event_stats_summary");
  const list = document.getElementById("event_attendees_list");

  if (!panel || !summary || !list) return;

  summary.textContent = "Loading RSVP statistics...";
  list.innerHTML = "";
  panel.classList.remove("hidden");

  const res = await fetch(`${API_BASE}/api/events/${eventId}/rsvps`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    summary.textContent = "Unable to load RSVP data.";
    return;
  }

  const data = await res.json();
  const rsvps = data.rsvps || [];

  // Only count "going" RSVPs
  const goingRsvps = rsvps.filter(r => r.status === "going");
  const goingCount = goingRsvps.length;

  summary.textContent = `Total Registered: ${goingCount}`;

  if (goingCount === 0) {
    list.innerHTML = `<li class="text-gray-600 italic">No RSVPs yet.</li>`;
    return;
  }

  list.innerHTML = goingRsvps
    .map(r => `
      <li class="flex justify-between items-center border-b py-1">
        <span>${r.attendee_name}</span>
        <span class="text-sm text-green-600">Registered</span>
      </li>
    `)
    .join("");
}



// =========================================================
// EVENT COMMENTS
// =========================================================
async function loadEventComments(eventId) {
  const panel = document.getElementById("event_comments_panel");
  const list = document.getElementById("event_comments_list");
  const errorEl = document.getElementById("comment_error");

  if (!panel || !list || !errorEl) return;

  panel.classList.remove("hidden");
  errorEl.classList.add("hidden");
  list.innerHTML = `<p class="text-gray-600 italic">Loading comments...</p>`;

  const res = await fetch(`${API_BASE}/api/events/${eventId}/comments`);
  if (!res.ok) {
    list.innerHTML = `<p class="text-gray-600 italic">Unable to load comments.</p>`;
    return;
  }

  const data = await res.json();
  const comments = data.comments || [];

  renderEventComments(comments);
}

function renderEventComments(comments) {
  const list = document.getElementById("event_comments_list");
  if (!list) return;

  if (comments.length === 0) {
    list.innerHTML = `<p class="text-gray-600 italic">No comments yet. Be the first to comment!</p>`;
    return;
  }

  list.innerHTML = comments
    .map(c => `
      <div class="border-b pb-2">
        <div class="text-sm"><span class="font-semibold">${c.author_name}</span></div>
        <div class="text-gray-800 text-sm mt-1">${c.body}</div>
        <div class="text-xs text-gray-400 mt-1">${new Date(c.created_at).toLocaleString()}</div>
      </div>
    `)
    .join("");
}

function appendCommentToList(comment) {
  const list = document.getElementById("event_comments_list");
  if (!list) return;

  // If list currently shows "no comments", reset it
  if (list.innerHTML.includes("No comments yet")) {
    list.innerHTML = "";
  }

  const html = `
    <div class="border-b pb-2">
      <div class="text-sm"><span class="font-semibold">${comment.author_name}</span></div>
      <div class="text-gray-800 text-sm mt-1">${comment.body}</div>
      <div class="text-xs text-gray-400 mt-1">${new Date(comment.created_at).toLocaleString()}</div>
    </div>
  `;

  list.innerHTML += html;
}

async function submitComment() {
  const errorEl = document.getElementById("comment_error");
  const textarea = document.getElementById("new_comment_body");

  if (!textarea || !errorEl || !currentEventRoom) return;

  const body = textarea.value.trim();
  if (!body) {
    errorEl.textContent = "Comment cannot be empty.";
    errorEl.classList.remove("hidden");
    return;
  }

  errorEl.classList.add("hidden");

  const res = await fetch(`${API_BASE}/api/events/${currentEventRoom}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ body })
  });

  const data = await res.json();

  if (!res.ok) {
    errorEl.textContent = data.error || "Failed to post comment.";
    errorEl.classList.remove("hidden");
    return;
  }

  textarea.value = "";
}


// =========================================================
// ANALYTICS DASHBOARD
// =========================================================

let analyticsChart = null;

async function loadAnalytics() {
  const loadingEl = document.getElementById("analytics_loading");
  const contentEl = document.getElementById("analytics_content");
  
  // Show loading state
  loadingEl.classList.remove("hidden");
  contentEl.classList.add("hidden");

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/api/analytics/organizer/summary`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error("Failed to load analytics");
    }

    const response = await res.json();
    const data = response.data;

    // Update KPIs
    document.getElementById("kpi_total_events").textContent = data.kpis.totalEvents;
    document.getElementById("kpi_total_rsvps").textContent = data.kpis.totalRsvps;
    document.getElementById("kpi_avg_rsvps").textContent = data.kpis.avgRsvpsPerEvent;

    // Render Chart
    renderAnalyticsChart(data.eventsChart);

    // Render Top Events Table
    renderTopEventsTable(data.topEvents);

    // Hide loading, show content
    loadingEl.classList.add("hidden");
    contentEl.classList.remove("hidden");
  } catch (error) {
    console.error("Error loading analytics:", error);
    loadingEl.innerHTML = '<p class="text-red-600">Failed to load analytics data. Please try again.</p>';
  }
}

function renderAnalyticsChart(eventsData) {
  const ctx = document.getElementById("analytics_chart");
  
  // Destroy existing chart if any
  if (analyticsChart) {
    analyticsChart.destroy();
  }

  // Prepare data
  const labels = eventsData.map(e => truncateText(e.title, 20));
  const data = eventsData.map(e => e.rsvpCount);

  // Create chart
  analyticsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'RSVPs',
        data: data,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'RSVP Count by Event (Top 10)',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

function renderTopEventsTable(topEvents) {
  const tbody = document.getElementById("top_events_table");
  
  if (topEvents.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4 text-gray-500">No events yet. Create your first event!</td></tr>';
    return;
  }

  tbody.innerHTML = topEvents.map((ev, index) => `
    <tr class="hover:bg-gray-50 cursor-pointer" onclick="openEventDetail(${ev.id}, 'organizer')">
      <td class="p-3">
        <span class="inline-flex items-center justify-center w-8 h-8 rounded-full ${
          index === 0 ? 'bg-yellow-100 text-yellow-800' :
          index === 1 ? 'bg-gray-100 text-gray-800' :
          index === 2 ? 'bg-orange-100 text-orange-800' :
          'bg-blue-100 text-blue-800'
        } font-bold text-sm">
          ${index + 1}
        </span>
      </td>
      <td class="p-3 font-medium text-gray-900">${ev.title}</td>
      <td class="p-3 text-gray-700">
        <span class="inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">${ev.category}</span>
      </td>
      <td class="p-3 text-gray-700 text-sm">${ev.faculty}</td>
      <td class="p-3">
        <span class="inline-flex items-center px-2 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
          ${ev.rsvpCount}
        </span>
      </td>
      <td class="p-3 text-gray-700 text-sm">${ev.commentCount}</td>
      <td class="p-3 text-gray-600 text-sm">${new Date(ev.startTime).toLocaleDateString()}</td>
    </tr>
  `).join("");
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}


// =========================================================
// PAGE INITIALIZATION
// =========================================================

// Note: Auto-login is disabled to allow testing multiple accounts
// Users must manually login each time

