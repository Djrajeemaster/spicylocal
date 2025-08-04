
document.addEventListener("DOMContentLoaded", () => {
  console.log("📌 Profile JS Loaded");

  const username = localStorage.getItem("username") || "User";
  const isVerified = localStorage.getItem("is_verified") === "1";
  const isAdmin = localStorage.getItem("is_admin") === "1";

  console.log("User:", username, "Verified:", isVerified, "Admin:", isAdmin);

  const userNameEl = document.getElementById("user-name");
  if (userNameEl) userNameEl.textContent = username;
  else console.warn("⚠️ user-name element not found");

  const badge = document.getElementById("verified-badge");
  if (!isVerified && badge) badge.style.display = "none";
  else if (!badge) console.warn("⚠️ verified-badge not found");

  const adminLink = document.getElementById("admin-link");
  if (isAdmin && adminLink) {
    adminLink.style.display = "inline-block";
    adminLink.href = "admin/dashboard.php";
  } else if (!adminLink) console.warn("⚠️ admin-link not found");

  const logoutLink = document.getElementById("logout-link");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = "login.html";
    });
  } else {
    console.warn("⚠️ logout-link not found");
  }

  Promise.all([
    fetch("api/get_my_deals.php").then(res => res.json()),
    fetch("api/get_feedback.php").then(res => res.json()),
    fetch("api/get_user_comments.php").then(res => res.json())
  ]).then(([deals, feedback, comments]) => {
    console.log("✅ Deals:", deals);
    console.log("✅ Feedback:", feedback);
    console.log("✅ Comments:", comments);

    const dealList = document.getElementById("recent-deals-list");
    const interactionList = document.getElementById("recent-interactions-list");

    if (!dealList) console.warn("❌ recent-deals-list not found");
    if (!interactionList) console.warn("❌ recent-interactions-list not found");

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
          plugins: {
            legend: { display: false }
          }
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
  });
});
