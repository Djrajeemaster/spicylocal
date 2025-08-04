
// === START: PROFILE.JS WITH DASHBOARD + SAVED/RECENT DEALS ===

document.addEventListener("DOMContentLoaded", () => {
  const username = localStorage.getItem("username") || "User";
  const isVerified = localStorage.getItem("is_verified") === "1";
  const isAdmin = localStorage.getItem("is_admin") === "1";

  const userNameEl = document.getElementById("user-name");
  if (userNameEl) userNameEl.textContent = username;

  const badge = document.getElementById("verified-badge");
  if (!isVerified && badge) badge.style.display = "none";

  const adminLink = document.getElementById("admin-link");
  if (isAdmin && adminLink) {
    adminLink.style.display = "inline-block";
    adminLink.href = "admin/dashboard.php";
  }

  const logoutLink = document.getElementById("logout-link");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = "login_unified.php";
    });
  }

  Promise.all([
    fetch("api/get_my_deals.php").then(res => res.json()),
    fetch("api/get_feedback.php").then(res => res.json()),
    fetch("api/get_comments.php").then(res => res.json())
  ]).then(([deals, feedback, comments]) => {
    const dealList = document.getElementById("recent-deals-list");
    const interactionList = document.getElementById("recent-interactions-list");

    if (dealList && deals && deals.length) {
      const counts = { approved: 0, pending: 0, rejected: 0 };

      deals.forEach(deal => {
        counts[deal.status] = (counts[deal.status] || 0) + 1;
      });

      deals.slice(0, 3).forEach(deal => {
        const div = document.createElement("div");
        div.style.marginBottom = "10px";
        const badge = deal.status === "approved" ? "approved" :
                      deal.status === "pending" ? "pending" : "rejected";
        div.innerHTML = `
          <div><strong>${deal.title}</strong> - $${deal.price || '--'} 
            <span class="badge badge-${badge}">${badge}</span><br>
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
        options: {
          responsive: true,
          plugins: { legend: { display: false } }
        }
      });
    }

    if (interactionList) {
      const combined = [];

      if (feedback && typeof feedback === "object") {
        Object.values(feedback).forEach(item => {
          combined.push({ type: "Feedback", text: `Feedback received: ${item.comment || "Useful"}` });
        });
      }

      if (comments && Array.isArray(comments)) {
        comments.forEach(c => {
          combined.push({ type: "Comment", text: `Comment on deal: "${c.content}"` });
        });
      }

      combined.slice(0, 3).forEach(item => {
        const div = document.createElement("div");
        div.innerHTML = `<div><strong>${item.type}</strong><br><small>${item.text}</small></div>`;
        div.style.marginBottom = "10px";
        interactionList.appendChild(div);
      });
    }
  });

  const infoFields = ["username", "email", "joined", "verified"];
  infoFields.forEach(field => {
    const el = document.getElementById(`info-${field}`);
    if (el) el.textContent = localStorage.getItem(field) || "--";
  });

  const buttons = document.querySelectorAll(".deal-tabs button");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      loadMyDeals(btn.getAttribute("data-status"));
    });
  });

  loadMyDeals("approved");

  const links = document.querySelectorAll(".nav-menu a");
  const sections = document.querySelectorAll(".spa-section");

  links.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.getAttribute("data-target");

      links.forEach(l => l.classList.remove("active"));
      link.classList.add("active");

      sections.forEach(sec => sec.style.display = "none");

      const selected = document.getElementById(target);
      if (selected) selected.style.display = "block";

      if (target === "section-deals") loadMyDeals("approved");
      if (target === "section-saved") loadSavedDeals();
      if (target === "section-recent") loadRecentViews();
    });
  });
});

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
