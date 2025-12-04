// =========================================================
// CONFIG
// =========================================================
const API_BASE = "http://localhost:8080";
const WS_BASE = "ws://localhost:8080";

let token = "";
let user = null;
let socket = null;

let previousPage = null;
let editingEventId = null;


// =========================================================
// PAGE SWITCHING
// =========================================================
function showPage(id) {
  document
    .querySelectorAll("#login_page, #register_page, #student_page, #organizer_page, #event_detail_page")
    .forEach(el => el.classList.add("hidden"));

  document.getElementById(id).classList.remove("hidden");
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

  initWebSocket();

  if (user.role === "student") {
    showPage("student_page");
    setStudentTab("browse");
  } else {
    showPage("organizer_page");
    setOrganizerTab("browse");
  }

  renderInitialPanels();
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

  token = res.token;
  user = res.user;

  initWebSocket();

  if (user.role === "student") showPage("student_page");
  else showPage("organizer_page");

  renderInitialPanels();
}


// =========================================================
// STUDENT TABS
// =========================================================
function setStudentTab(id) {
  const tabs = ["browse", "live_events", "live_comments", "live_rsvps"];

  tabs.forEach(tab => {
    document.getElementById("student_" + tab).classList.add("hidden");
    document.getElementById("student_" + tab + "_btn")
      .classList.remove("border-blue-600", "text-blue-600");
  });

  document.getElementById("student_" + id).classList.remove("hidden");
  document.getElementById("student_" + id + "_btn")
    .classList.add("border-blue-600", "text-blue-600");

  if (id === "browse") loadEventsList("student");
}


// =========================================================
// ORGANIZER TABS
// =========================================================
function setOrganizerTab(id) {
  const tabs = ["browse", "my_events", "live_events", "live_comments", "live_rsvps", "analytics"];

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
}


// =========================================================
// INITIAL PANELS
// =========================================================
function renderInitialPanels() {
  if (user.role === "student") {
    document.getElementById("student_live_events").innerHTML =
      "<h2 class='text-xl font-semibold mb-3'>Listening for event updates...</h2>";

    document.getElementById("student_live_comments").innerHTML =
      "<h2 class='text-xl font-semibold mb-3'>Listening for comments...</h2>";

    document.getElementById("student_live_rsvps").innerHTML =
      "<h2 class='text-xl font-semibold mb-3'>Listening for RSVPs...</h2>";
  } else {
    document.getElementById("organizer_live_events").innerHTML =
      "<h2 class='text-xl font-semibold mb-3'>Listening for event updates...</h2>";

    document.getElementById("organizer_live_comments").innerHTML =
      "<h2 class='text-xl font-semibold mb-3'>Listening for comments...</h2>";

    document.getElementById("organizer_live_rsvps").innerHTML =
      "<h2 class='text-xl font-semibold mb-3'>Listening for RSVPs...</h2>";
  }
}


// =========================================================
// LOAD EVENTS LIST
// =========================================================
async function loadEventsList(role) {
  const container = document.getElementById(
    role === "student" ? "student_browse" : "organizer_browse"
  );

  container.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-2xl font-semibold">Browse Events</h3>
      <input id="${role}_event_search" class="p-2 border rounded w-64"
        placeholder="Search events..." oninput="searchEvents('${role}')" />
    </div>

    <div id="${role}_event_list"></div>
  `;

  searchEvents(role);
}


// =========================================================
// SEARCH EVENTS
// =========================================================
async function searchEvents(role) {
  const query = document.getElementById(`${role}_event_search`).value || "";

  const res = await fetch(`${API_BASE}/api/events?q=${encodeURIComponent(query)}`);
  const data = await res.json();

  const list = document.getElementById(`${role}_event_list`);

  list.innerHTML = data.events.map(ev => `
    <div class="border p-4 rounded mb-3 hover:bg-gray-50 cursor-pointer"
         onclick="openEventDetail(${ev.id}, '${role}')">
      <div class="text-xl font-semibold">${ev.title}</div>
      <div class="text-gray-600">${new Date(ev.start_time).toLocaleString()}</div>
      <div class="text-gray-800">${ev.location}</div>
    </div>
  `).join("");
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

  document.getElementById("event_detail_content").innerHTML = `
    <h2 class="text-3xl font-bold mb-2">${ev.title}</h2>
    <p class="text-gray-600">${new Date(ev.start_time).toLocaleString()}</p>

    <p class="mt-3"><strong>Location:</strong> ${ev.location}</p>
    <p><strong>Faculty:</strong> ${ev.faculty}</p>
    <p><strong>Category:</strong> ${ev.category}</p>

    <p class="mt-4">${ev.description}</p>

    <div class="mt-6">
      ${
        role === "student"
          ? `<button onclick="sendRSVP(${ev.id}, 'going')" class="px-4 py-2 bg-blue-600 text-white rounded">RSVP Going</button>`
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
}


// =========================================================
// SEND RSVP
// =========================================================
async function sendRSVP(eventId, status) {
  await fetch(`${API_BASE}/api/events/${eventId}/rsvps`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });

  alert("RSVP submitted!");
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
// SUBMIT CREATE EVENT
// =========================================================
async function submitCreateEvent() {
  const title = document.getElementById("ce_title").value;
  const description = document.getElementById("ce_description").value;
  const location = document.getElementById("ce_location").value;
  const faculty = document.getElementById("ce_faculty").value;
  const category = document.getElementById("ce_category").value;
  const start_time = document.getElementById("ce_start").value;
  const end_time = document.getElementById("ce_end").value;

  const res = await fetch(`${API_BASE}/api/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      title, description, location, faculty, category, start_time, end_time
    })
  });

  const data = await res.json();

  if (!res.ok) {
    document.getElementById("create_event_error").textContent =
      data.error || "Failed to create event.";
    document.getElementById("create_event_error").classList.remove("hidden");
    return;
  }

  closeCreateEventModal();
  loadEventsList("organizer");
  loadMyEventsList();
}


// =========================================================
// LOAD MY EVENTS (ORGANIZER)
// =========================================================
async function loadMyEventsList() {
  const list = document.getElementById("my_events_list");
  list.innerHTML = "";

  const res = await fetch(`${API_BASE}/api/events`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  const myEvents = data.events.filter(ev => ev.organizer_id === user.id);

  if (myEvents.length === 0) {
    list.innerHTML = `<p class="text-gray-600 italic">You haven't created any events yet.</p>`;
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
// OPEN EDIT MODAL (LOAD EVENT DATA)
// =========================================================
async function openEditEvent(eventId) {
  editingEventId = eventId;

  const res = await fetch(`${API_BASE}/api/events/${eventId}`);
  const data = await res.json();
  const ev = data.event;

  // Prefill update modal fields
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
// SUBMIT UPDATE EVENT
// =========================================================
async function submitUpdateEvent() {
  const body = {
    title: document.getElementById("ue_title").value,
    description: document.getElementById("ue_description").value,
    location: document.getElementById("ue_location").value,
    faculty: document.getElementById("ue_faculty").value,
    category: document.getElementById("ue_category").value,
    start_time: document.getElementById("ue_start").value,
    end_time: document.getElementById("ue_end").value
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
    document.getElementById("update_event_error").textContent =
      data.error || "Failed to update event.";
    document.getElementById("update_event_error").classList.remove("hidden");
    return;
  }

  closeUpdateEventModal();
  editingEventId = null;

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
    alert("You cannot delete an event you do not own.");
    return;
  }

  if (!res.ok) {
    alert("Failed to delete event.");
    return;
  }

  alert("Event deleted.");
  showPage(previousPage);
  loadMyEventsList();
}


// =========================================================
// BACK TO PREVIOUS PAGE
// =========================================================
function backToPreviousPage() {
  showPage(previousPage);
}


// =========================================================
// WEBSOCKET SETUP
// =========================================================
function initWebSocket() {
  socket = io(WS_BASE);

  socket.on("event:created", d => appendLive("event", d));
  socket.on("event:updated", d => appendLive("event", d));
  socket.on("event:deleted", d => appendLive("event", d));

  socket.on("comment:created", d => appendLive("comment", d));
  socket.on("rsvp:updated", d => appendLive("rsvp", d));
}


// =========================================================
// REALTIME PANELS
// =========================================================
function appendLive(type, payload) {
  const html = `
    <div class="p-3 border-b">
      <div class="font-bold">${type.toUpperCase()}</div>
      <pre class="text-xs">${JSON.stringify(payload, null, 2)}</pre>
    </div>
  `;

  if (user.role === "student") {
    if (type === "event") document.getElementById("student_live_events").innerHTML += html;
    if (type === "comment") document.getElementById("student_live_comments").innerHTML += html;
    if (type === "rsvp") document.getElementById("student_live_rsvps").innerHTML += html;
  } else {
    if (type === "event") document.getElementById("organizer_live_events").innerHTML += html;
    if (type === "comment") document.getElementById("organizer_live_comments").innerHTML += html;
    if (type === "rsvp") document.getElementById("organizer_live_rsvps").innerHTML += html;
  }
}
