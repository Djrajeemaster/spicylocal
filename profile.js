
// === START: PROFILE.JS WITH DASHBOARD + SAVED/RECENT DEALS ===

// === START: PROFILE DASHBOARD FUNCTIONALITY ===

document.addEventListener("DOMContentLoaded", () => {
  // Utility to populate user info fields from localStorage
  function populateUserInfo() {
    const userNameEl = document.getElementById("user-name");
    if (userNameEl) {
      const username = localStorage.getItem("username") || "User";
      userNameEl.textContent = username;
    }
    // Verified badge
    const badge = document.getElementById("verified-badge");
    const isVerified = localStorage.getItem("is_verified") === "1";
    if (badge) {
      badge.style.display = isVerified ? "inline-block" : "none";
    }
    // Fill profile details section
    const infoMap = {
      username: "info-username",
      email: "info-email",
      joined: "info-joined",
      verified: "info-verified"
    };
    Object.keys(infoMap).forEach((key) => {
      const el = document.getElementById(infoMap[key]);
      if (el) {
        const val = localStorage.getItem(key);
        el.textContent = val && val !== "null" ? val : "--";
      }
    });
    const verifiedEl = document.getElementById("info-verified");
    if (verifiedEl) {
      verifiedEl.textContent = (localStorage.getItem("is_verified") === "1") ? "Verified" : "Unverified";
      verifiedEl.className = (localStorage.getItem("is_verified") === "1") ? "badge badge-verified" : "badge badge-unverified";
    }
  }

  // Attempt to fetch user info from server if not present in localStorage
  async function ensureUserInfo() {
    const hasLocal = localStorage.getItem("username") && localStorage.getItem("email") && localStorage.getItem("joined");
    if (!hasLocal) {
      try {
        const res = await fetch("api/get_user_info.php");
        const data = await res.json();
        if (data.success) {
          localStorage.setItem("username", data.username);
          localStorage.setItem("email", data.email);
          localStorage.setItem("joined", data.created_at);
          localStorage.setItem("is_verified", data.is_verified ? "1" : "0");
        }
      } catch (err) {
        console.warn("Unable to fetch user info", err);
      }
    }
    populateUserInfo();
  }

  // Logout link
  const logoutLink = document.getElementById("logout-link");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = "login_unified.php";
    });
  }

  // Immediately assign fetchUserDeals for SPA switching script
  window.fetchUserDeals = loadMyDeals;

  // Setup deal tab buttons (Approved/Pending/Rejected)
  const tabButtons = document.querySelectorAll(".deal-tabs button");
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const status = btn.getAttribute("data-status") || "approved";
      loadMyDeals(status);
    });
  });

  // Default load for My Deals section if visible on initial page load
  if (document.getElementById("section-deals")?.style.display !== "none") {
    loadMyDeals("approved");
  }

  // Fetch dashboard data (deals, feedback, comments) to populate summary and interactions
  (async () => {
    try {
      const [deals, feedback, comments] = await Promise.all([
        fetch("api/get_my_deals.php").then(r => r.json()).catch(() => []),
        fetch("api/get_feedback.php").then(r => r.json()).catch(() => {}),
        fetch("api/get_comments.php").then(r => r.json()).catch(() => [])
      ]);
      const dealList = document.getElementById("recent-deals-list");
      const interactionList = document.getElementById("recent-interactions-list");
      // Populate recent deals and chart
      if (dealList && Array.isArray(deals) && deals.length) {
        const counts = { approved: 0, pending: 0, rejected: 0 };
        deals.forEach(deal => {
          counts[deal.status] = (counts[deal.status] || 0) + 1;
        });
        deals.slice(0, 3).forEach(deal => {
          const div = document.createElement("div");
          div.style.marginBottom = "10px";
          const badgeClass = deal.status === "approved" ? "approved" : (deal.status === "pending" ? "pending" : "rejected");
          div.innerHTML = `
            <div><strong>${deal.title}</strong> - $${deal.price || '--'} 
              <span class="badge badge-${badgeClass}">${badgeClass}</span><br>
              <small>${deal.created_at}</small>
            </div>`;
          dealList.appendChild(div);
        });
        const ctx = document.createElement("canvas");
        ctx.id = "dealChart";
        ctx.width = 300;
        document.querySelector(".summary-cards")?.appendChild(ctx);
        new Chart(ctx, {
          type: "bar",
          data: {
            labels: ["Approved", "Pending", "Rejected"],
            datasets: [{
              label: "Deal Status Overview",
              data: [counts.approved, counts.pending, counts.rejected],
              backgroundColor: ["#4caf50", "#ff9800", "#f44336"]
            }]
          },
          options: { responsive: true, plugins: { legend: { display: false } } }
        });
      }
      // Populate recent interactions (feedback + comments)
      if (interactionList) {
        const combined = [];
        if (feedback && typeof feedback === "object") {
          Object.values(feedback).forEach(item => {
            combined.push({ type: "Feedback", text: `Feedback received: ${item.comment || "Useful"}` });
          });
        }
        if (Array.isArray(comments)) {
          comments.forEach(c => {
            combined.push({ type: "Comment", text: `Comment on deal: \"${c.content}\"` });
          });
        }
        combined.slice(0, 3).forEach(item => {
          const div = document.createElement("div");
          div.innerHTML = `<div><strong>${item.type}</strong><br><small>${item.text}</small></div>`;
          div.style.marginBottom = "10px";
          interactionList.appendChild(div);
        });
      }
      // Gamification: compute XP and badges
      try {
        const dealsCount = Array.isArray(deals) ? deals.length : 0;
        const votesCount = 0; // Could integrate with votes API for real counts
        const isVerifiedBusiness = localStorage.getItem('is_verified_business') === '1';
        const xp = dealsCount * 10 + votesCount;
        function getLevel(xpVal) {
          if (!xpVal || xpVal < 100) return 'newbie';
          if (xpVal < 500) return 'explorer';
          return 'deal_king';
        }
        function getLevelName(key) {
          switch (key) {
            case 'newbie': return 'Newbie';
            case 'explorer': return 'Explorer';
            case 'deal_king': return 'Deal King';
            default: return '';
          }
        }
        function computeBadges(stats) {
          const b = [];
          if (stats.dealsCount > 0) {
            b.push({ name: 'First Deal', description: 'Posted your first deal' });
          }
          if (stats.votesCount >= 100) {
            b.push({ name: '100 Votes', description: 'Received 100 votes across your deals' });
          }
          if (stats.isVerifiedBusiness) {
            b.push({ name: 'Verified Business', description: 'Your business is verified' });
          }
          return b;
        }
        const levelKey = getLevel(xp);
        const levelName = getLevelName(levelKey);
        const xpLevelEl = document.getElementById('xp-level');
        if (xpLevelEl) {
          xpLevelEl.textContent = `XP: ${xp} | Level: ${levelName}`;
        }
        const badges = computeBadges({ dealsCount: dealsCount, votesCount: votesCount, isVerifiedBusiness: isVerifiedBusiness });
        const badgeListEl = document.getElementById('badge-list');
        if (badgeListEl) {
          badgeListEl.innerHTML = '';
          if (badges.length) {
            badges.forEach(badge => {
              const span = document.createElement('span');
              span.style.display = 'inline-block';
              span.style.marginRight = '8px';
              span.style.padding = '4px 6px';
              span.style.background = '#e0e0e0';
              span.style.borderRadius = '12px';
              span.textContent = badge.name;
              span.title = badge.description;
              badgeListEl.appendChild(span);
            });
          } else {
            badgeListEl.textContent = 'No badges yet.';
          }
        }
      } catch (err) {
        console.warn('Gamification error', err);
      }
    } catch (err) {
      console.warn('Error loading dashboard data', err);
    }
  })();

  // Ensure user info is populated from session/localStorage
  ensureUserInfo();

  // Change password form handling
  const changePasswordForm = document.getElementById('change-password-form');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const current = changePasswordForm.current_password.value;
      const newPass = changePasswordForm.new_password.value;
      const confirm = changePasswordForm.confirm_password.value;
      try {
        const res = await fetch('api/change_password.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_password: current, new_password: newPass, confirm_password: confirm })
        });
        const data = await res.json();
        const msgEl = document.getElementById('password-update-msg');
        if (msgEl) {
          msgEl.textContent = data.message || '';
          if (data.success) {
            msgEl.style.color = 'green';
            changePasswordForm.reset();
          } else {
            msgEl.style.color = 'red';
          }
        }
      } catch (err) {
        const msgEl = document.getElementById('password-update-msg');
        if (msgEl) {
          msgEl.textContent = 'Error updating password';
          msgEl.style.color = 'red';
        }
      }
    });
  }
});

// === END: PROFILE DASHBOARD FUNCTIONALITY ===

function loadMyDeals(status) {
  const username = localStorage.getItem("username") || "";
  const listContainer = document.getElementById("deal-list");
  const msg = document.getElementById("no-deals-message");
  if (!listContainer || !msg) return;

  listContainer.innerHTML = "<p>Loading...</p>";
  fetch(`api/get_user_deals.php?username=${encodeURIComponent(username)}&status=${status}`)
    .then(res => res.json())
    .then(data => {
      if (!data.success || !data.deals || data.deals.length === 0) {
        listContainer.innerHTML = "";
        msg.classList.remove("hidden");
        return;
      }

      msg.classList.add("hidden");
      listContainer.innerHTML = "";
      data.deals.forEach(deal => {
        const card = document.createElement("div");
        card.className = "deal-card";
        card.innerHTML = `<h4>${deal.title}</h4><p>Status: ${deal.status}</p>`;
        listContainer.appendChild(card);
      });
    })
    .catch(err => {
      listContainer.innerHTML = "<p>Error loading deals.</p>";
      msg.classList.add("hidden");
      console.error(err);
    });
}

// Expose saved and recent loading functions globally for SPA switching
window.loadSavedDeals = loadSavedDeals;
window.loadRecentViews = loadRecentViews;

function loadSavedDeals() {
  const username = localStorage.getItem("username") || "";
  const container = document.getElementById("saved-deals-container");
  const msg = document.getElementById("no-saved-message");
  if (!container || !msg) return;

  container.innerHTML = "<p>Loading...</p>";
  fetch(`api/get_bookmarked_deals.php?username=${encodeURIComponent(username)}`)
    .then(res => res.json())
    .then(data => {
      if (!data.success || !data.deals || data.deals.length === 0) {
        container.innerHTML = "";
        msg.classList.remove("hidden");
        return;
      }

      msg.classList.add("hidden");
      container.innerHTML = "";
      data.deals.forEach(deal => {
        const card = document.createElement("div");
        card.className = "deal-card";
        card.innerHTML = `
          <h4>${deal.title}</h4>
          <p>${deal.description}</p>
          <small>${deal.category}</small>
        `;
        container.appendChild(card);
      });
    })
    .catch(err => {
      container.innerHTML = "<p>Error loading saved deals.</p>";
      msg.classList.add("hidden");
      console.error(err);
    });
}

function loadRecentViews() {
  const container = document.getElementById("recent-deals-container");
  const msg = document.getElementById("no-recent-message");
  if (!container || !msg) return;

  const recent = JSON.parse(localStorage.getItem("recent_views")) || [];
  container.innerHTML = "";

  if (recent.length === 0) {
    msg.classList.remove("hidden");
    return;
  }

  msg.classList.add("hidden");
  recent.forEach(deal => {
    const card = document.createElement("div");
    card.className = "deal-card";
    card.innerHTML = `
      <h4>${deal.title}</h4>
      <p>${deal.description}</p>
      <small>${deal.category}</small>
    `;
    container.appendChild(card);
  });
}
// === END: PROFILE.JS ===
