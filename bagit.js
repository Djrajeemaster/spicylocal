document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ bagit.js loaded");

  const navWrapper = document.getElementById("nav-menu");
  const username = localStorage.getItem("username");

  if (navWrapper) {
    navWrapper.innerHTML = "";

    const homeLink = document.createElement("a");
    homeLink.href = "index.html";
    homeLink.textContent = "Home";
    navWrapper.appendChild(homeLink);

    if (!username) {
      const loginLink = document.createElement("a");
      loginLink.href = "login_unified.php";
      loginLink.textContent = "Login";
      navWrapper.appendChild(loginLink);

      const signupLink = document.createElement("a");
      signupLink.href = "signup.html";
      signupLink.textContent = "Signup";
      navWrapper.appendChild(signupLink);
    } else {
      const userMenuDiv = document.createElement("div");
      userMenuDiv.className = "user-menu";

      const icon = document.createElement("span");
      icon.className = "user-icon";
      icon.textContent = "👤";
      icon.title = "User Menu";

      const usernameSpan = document.createElement("span");
      usernameSpan.className = "username-label";
      usernameSpan.textContent = username;

      const dropdown = document.createElement("div");
      dropdown.className = "dropdown hidden";
      dropdown.id = "dropdown";

      const profileLink = document.createElement("a");
      profileLink.href = "profile.html";
      profileLink.textContent = "Profile";
      dropdown.appendChild(profileLink);

      const logoutLink = document.createElement("a");
      logoutLink.href = "#";
      logoutLink.textContent = "Logout";
      logoutLink.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = "login_unified.php";
      });
      dropdown.appendChild(logoutLink);

      userMenuDiv.appendChild(icon);
      userMenuDiv.appendChild(usernameSpan);
      userMenuDiv.appendChild(dropdown);

      icon.addEventListener("click", () => dropdown.classList.toggle("hidden"));
      usernameSpan.addEventListener("click", () => dropdown.classList.toggle("hidden"));

      navWrapper.appendChild(userMenuDiv);
    }
  }

  // ✅ Chat Injection (moved outside navWrapper block)
  if (username) {
    console.log("👤 Username found:", username);
    console.log("📦 Inserting chat widget...");

    const chatStyle = document.createElement("link");
    chatStyle.rel = "stylesheet";
    chatStyle.href = "chat.css";
    document.head.appendChild(chatStyle);

    const chatHTML = `
      <div id="chat-toggle-btn">💬 Chat</div>
      <div id="chat-widget" class="hidden">
        <div class="chat-header">
          <select id="chat-room-select">
            <option value="Hot Deals">🔥 Hot Deals</option>
            <option value="Food & Offers">🍔 Food & Offers</option>
            <option value="General Chat">💬 General Chat</option>
          </select>
          <div class="chat-controls">
            <button id="toggle-fullscreen">⛶</button>
            <button id="close-chat">✖</button>
          </div>
        </div>
        <div class="chat-messages" id="chat-messages"></div>
        <div class="chat-input">
          <input type="text" id="chat-message-input" placeholder="Type your message..." />
          <button id="chat-send-btn">Send</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", chatHTML);

    const chatScript = document.createElement("script");
    chatScript.src = "chat.js";
    chatScript.onload = () => console.log("✅ chat.js loaded");
    document.body.appendChild(chatScript);
  }

  
  // ✅ Chat Injection Block (moved outside navWrapper)
  if (username) {
    console.log("👤 Username found:", username);
    console.log("📦 Inserting chat widget...");

    const chatStyle = document.createElement("link");
    chatStyle.rel = "stylesheet";
    chatStyle.href = "chat.css";
    document.head.appendChild(chatStyle);

    const chatHTML = `
      <div id="chat-toggle-btn">💬 Chat</div>
      <div id="chat-widget" class="hidden">
        <div class="chat-header">
          <select id="chat-room-select">
            <option value="Hot Deals">🔥 Hot Deals</option>
            <option value="Food & Offers">🍔 Food & Offers</option>
            <option value="General Chat">💬 General Chat</option>
          </select>
          <div class="chat-controls">
            <button id="toggle-fullscreen">⛶</button>
            <button id="close-chat">✖</button>
          </div>
        </div>
        <div class="chat-messages" id="chat-messages"></div>
        <div class="chat-input">
          <input type="text" id="chat-message-input" placeholder="Type your message..." />
          <button id="chat-send-btn">Send</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", chatHTML);

    const chatScript = document.createElement("script");
    chatScript.src = "chat.js";
    chatScript.onload = () => console.log("✅ chat.js loaded");
    document.body.appendChild(chatScript);
  }


// === HOME PAGE DEAL LIST ===
  const dealList = document.getElementById("deal-list");
  if (dealList) {
    Promise.all([
      fetch("api/get_votes.php").then(res => res.json()),
      fetch("api/get_feedback.php").then(res => res.json()),
      fetch("api/get_deals.php").then(res => res.json())
    ]).then(([votes, feedback, deals]) => {
      const voteData = votes || {};
      const feedbackData = feedback || {};
      const allDeals = deals || [];

      const totalElem = document.getElementById("total-deals");
      if (totalElem) totalElem.textContent = allDeals.length;

      dealList.innerHTML = "";
      const fallbackImage = "deal_images/DEFAULT_FALLBACK_IMAGE.jpg";
      allDeals.forEach((deal) => {
        const card = document.createElement("div");
        card.className = "deal-card";
        card.dataset.id = deal.id;

        const verified = deal.is_verified == 1 ? '<span class="badge-verified">✔️ Verified</span>' : '';
        const username = deal.username || "Unknown";

        const votes = voteData[deal.id] || { up: 0, down: 0 };
        const feedbackItem = feedbackData[deal.id] || { useful: 0, not_interested: 0, fake: 0 };

        card.innerHTML = `
          <div class="card-flex">
            <div class="card-left">
              <h3>${deal.title}</h3>
              <p>${deal.description}</p>
              <p>👤 ${username} ${verified}</p>
              <div class="summary-metrics">
                👍 ${votes.up - votes.down} &nbsp;&nbsp;
                ✅ ${feedbackItem.useful} &nbsp;&nbsp;
                🚩 ${feedbackItem.fake}
              </div>
            </div>
            <div class="card-right">
              <img src="deal_images/${deal.thumbnail || 'DEFAULT_FALLBACK_IMAGE.jpg'}" alt="Deal Image" class="thumbnail-img" />
            </div>
          </div>
        `;

        card.addEventListener("click", () => {
          window.location.href = `deal.html?id=${deal.id}`;
        });

        dealList.appendChild(card);
      });
    }).catch(() => {
      dealList.innerHTML = "<p>Error loading deals.</p>";
    });
  }

  // === PAGINATION LOGIC ===
  const pagContainer = document.getElementById("deal-container");
  if (pagContainer) loadDeals();

  function loadDeals() {
    fetch("api/get_deals.php")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          renderDealsWithPagination(data.deals);
        }
      });
  }

  let currentPage = 1;
  const pageSize = 10;

  function renderDealsWithPagination(deals) {
    const totalDealsEl = document.getElementById("total-deals");
    if (totalDealsEl) totalDealsEl.textContent = deals.length;

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const paginatedDeals = deals.slice(start, end);

    pagContainer.innerHTML = "";
    paginatedDeals.forEach(deal => {
      const div = document.createElement("div");
      div.className = "deal-card";
      div.innerHTML = `
        <h3><a href="deal.html?id=${deal.id}">${deal.title}</a></h3>
        <img src="${deal.thumbnail ? 'deal_images/' + deal.thumbnail : fallbackImage}" 
             alt="Deal Image" style="max-width: 100%; height: auto; border-radius: 8px;" />
         <p>${deal.description}</p>
        <p>👤 ${deal.username} ${deal.is_verified == 1 ? '<span class="badge badge-verified">✔ Verified</span>' : ''}</p>
        <p>👍 ${deal.votes || 0} | 🚩 ${deal.feedback_fake || 0}</p>`;
      pagContainer.appendChild(div);
    });

    renderPagination(deals.length);
  }

  function renderPagination(total) {
    const pagination = document.getElementById("pagination");
    if (!pagination) return;

    pagination.innerHTML = "";
    const totalPages = Math.ceil(total / pageSize);

    const prev = document.createElement("button");
    prev.textContent = "← Prev";
    prev.disabled = currentPage === 1;
    prev.onclick = () => { currentPage--; loadDeals(); };
    pagination.appendChild(prev);

    const next = document.createElement("button");
    next.textContent = "Next →";
    next.disabled = currentPage === totalPages;
    next.onclick = () => { currentPage++; loadDeals(); };
    pagination.appendChild(next);
  }
});
