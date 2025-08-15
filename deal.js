// deal.js — fixed (v2025-08-12 portrait fix)
document.addEventListener("DOMContentLoaded", () => {
  const username = localStorage.getItem("username");

  const dealId = (() => {
    const v = new URLSearchParams(location.search).get("id");
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  })();

  const BASE = "/bagit/";
  function resolveImg(u) {
    if (!u) return BASE + "uploads/default.jpg";
    if (u.startsWith("http") || u.startsWith("/")) return u;
    if (u.startsWith("uploads/")) return BASE + u;
    return BASE + "uploads/" + u.replace(/^\/+/, "");
  }

  try {
    const key = "sb_seen_deals";
    const cur = JSON.parse(localStorage.getItem(key) || "[]");
    if (dealId && !cur.includes(String(dealId))) {
      cur.push(String(dealId));
      localStorage.setItem(key, JSON.stringify(cur));
    }
  } catch {}

  const voteCount = document.getElementById("vote-count");
  const downvoteCount = document.getElementById("downvote-count");
  const bookmarkIcon = document.getElementById("bookmark-container");
  const feedbackCounts = {
    useful: document.getElementById("fb-useful"),
    not_interested: document.getElementById("fb-not"),
    fake: document.getElementById("fb-fake")
  };

  if (bookmarkIcon) {
    if (username) {
      fetch(`api/check_bookmark.php?username=${encodeURIComponent(username)}&deal_id=${dealId}`, { cache: "no-store" })
        .then(r => r.json())
        .then(d => { if (d.bookmarked) bookmarkIcon.classList.add("bookmarked"); })
        .catch(() => {});
      bookmarkIcon.addEventListener("click", () => {
        if (!localStorage.getItem("username")) { alert("Please log in to bookmark deals."); return; }
        fetch("api/toggle_bookmark.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, deal_id: dealId }),
          credentials: "include",
          cache: "no-store"
        })
          .then(r => r.json())
          .then(d => {
            if (d.success) bookmarkIcon.classList.toggle("bookmarked");
            else alert("Failed to bookmark deal.");
          })
          .catch(err => console.error("Bookmark error:", err));
      });
    } else {
      bookmarkIcon.addEventListener("click", () => alert("Please log in to bookmark deals."));
    }
  }

  if (!dealId) {
    document.querySelectorAll(".vote-btn, .feedback-btn").forEach(b => (b.disabled = true));
    console.warn("Disabled voting/feedback: invalid dealId in URL.");
  }

  document.querySelectorAll(".vote-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!dealId) { alert("Invalid deal. Open from a valid deal link."); return; }
      const vote = btn.dataset.vote;
      try {
        const res = await fetch("api/vote.php", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ deal_id: Number(dealId), value: vote }),
          credentials: "include",
          cache: "no-store"
        });
        const data = await res.json();
        if (!data || !data.ok || !data.counts) throw new Error(data?.error || "Unknown error");
        if (voteCount) voteCount.textContent = String(Number(data.counts.upvotes || 0));
        if (downvoteCount) downvoteCount.textContent = String(Number(data.counts.downvotes || 0));
      } catch (err) {
        alert("Vote failed: " + err.message);
      }
    });
  });

  document.querySelectorAll(".feedback-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!dealId) { alert("Invalid deal. Open from a valid deal link."); return; }
      const feedback = btn.dataset.feedback;
      try {
        const res = await fetch("api/submit_feedback.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deal_id: dealId, feedback, username }),
          credentials: "include",
          cache: "no-store"
        });
        const data = await res.json();
        if (data.success && data.counts) {
          if (feedbackCounts.useful) feedbackCounts.useful.textContent = Number(data.counts.useful || 0);
          if (feedbackCounts.not_interested) feedbackCounts.not_interested.textContent = Number(data.counts.not_interested || 0);
          if (feedbackCounts.fake) feedbackCounts.fake.textContent = Number(data.counts.fake || 0);
        } else {
          alert("Feedback failed: " + (data.error || "Unknown error"));
        }
      } catch (err) {
        alert("Feedback error: " + err.message);
      }
    });
  });

  Promise.all([
    fetch("api/get_votes.php", { cache: "no-store" }).then(r => r.json()).catch(() => ({})),
    fetch("api/get_feedback.php", { cache: "no-store" }).then(r => r.json()).catch(() => ({}))
  ])
    .then(([votesData, feedbackData]) => {
      const v = (votesData || {})[dealId] || { up: 0, down: 0 };
      const f = (feedbackData || {})[dealId] || { useful: 0, not_interested: 0, fake: 0 };
      if (voteCount) voteCount.textContent = Number(v.up || 0);
      if (downvoteCount) downvoteCount.textContent = Number(v.down || 0);
      if (feedbackCounts.useful) feedbackCounts.useful.textContent = Number(f.useful || 0);
      if (feedbackCounts.not_interested) feedbackCounts.not_interested.textContent = Number(f.not_interested || 0);
      if (feedbackCounts.fake) feedbackCounts.fake.textContent = Number(f.fake || 0);
    })
    .catch(err => console.error("Error loading vote/feedback counts:", err));

  function loadDealDetails() {
    fetch(`api/increment_view.php?id=${dealId}`, { cache: "no-store" }).catch(() => {});

    fetch(`api/get_deal.php?id=${dealId}`, { cache: "no-store" })
      .then(res => res.json())
      .then(data => {
        if (!data.success || !data.deal) {
          const t = document.getElementById("deal-title");
          if (t) t.textContent = "Deal not found.";
          return;
        }
        const d = data.deal;

        const titleEl = document.getElementById("deal-title");
        if (titleEl) titleEl.textContent = d.title || "Untitled";

        const summaryEl = document.getElementById("deal-summary");
        if (summaryEl) {
          summaryEl.textContent = d.summary || "";
          summaryEl.style.display = d.summary ? "block" : "none";
        }

        const descEl = document.getElementById("deal-description");
        if (descEl) descEl.textContent = d.description || "";

        const userEl = document.getElementById("deal-user");
        const verifiedBadge = document.getElementById("verified-badge");
        const businessBadge = document.getElementById("business-badge");
        if (userEl) userEl.textContent = d.username || "Anonymous";
        if (verifiedBadge) verifiedBadge.textContent = Number(d.is_verified) === 1 ? "✔️ Verified" : "";
        if (businessBadge) businessBadge.textContent = Number(d.is_verified_business) === 1 ? "🏬 Verified Business" : "";

        const viewsEl = document.getElementById("view-count");
        if (viewsEl) viewsEl.textContent = d.views || 0;

        const statusEl = document.getElementById("deal-status");
        if (statusEl) {
          let badge = "";
          try {
            const now = new Date();
            const start = d.start_date ? new Date(d.start_date) : null;
            const end = d.end_date ? new Date(d.end_date) : null;
            if (start && now < start) badge = `⏳ Starts on ${start.toLocaleDateString()}`;
            else if (end && now > end) badge = `❌ Expired`;
          } catch {}
          statusEl.textContent = badge;
        }

        const tagsEl = document.getElementById("deal-tags");
        if (tagsEl) {
          tagsEl.innerHTML = "";
          if (Array.isArray(d.tags) && d.tags.length) {
            d.tags.forEach(t => {
              const span = document.createElement("span");
              span.className = "tag-pill";
              span.textContent = t;
              tagsEl.appendChild(span);
            });
          }
        }

        const ctaContainer = document.getElementById("deal-cta");
        if (ctaContainer) {
          ctaContainer.innerHTML = "";
          const hasCta = d.cta_text || d.cta_url;
          if (hasCta) {
            const a = document.createElement("a");
            a.textContent = d.cta_text || "View Deal";
            a.href = d.cta_url || `deal.html?id=${dealId}`;
            a.target = "_blank";
            a.className = "cta-button";
            ctaContainer.appendChild(a);
          }
        }

        const mediaEl = document.getElementById("deal-media");
        if (mediaEl) {
          mediaEl.innerHTML = "";
          const gallery = [];
          if (Array.isArray(d.images)) d.images.forEach(it => { if (it) gallery.push(it); });
          if (d.thumbnail) gallery.unshift(d.thumbnail);
          else if (d.image) gallery.unshift(d.image);

          if (gallery.length === 0) {
            const img = document.createElement("img");
            img.loading = "lazy";
            img.src = resolveImg(null);
            img.onload = function () {
              const dealLeft = document.querySelector('.deal-left');
             if (img.naturalHeight > img.naturalWidth) {
  // Removed gridColumn span so it stays in its own column
  img.style.width = '100%';
  img.style.height = 'auto';
  img.style.maxHeight = '450px';
  img.style.objectFit = 'contain';
  img.style.backgroundColor = '#fff';
  img.style.display = 'block';
  img.style.margin = '0'; // No centering strip
} else {
  img.style.width = '100%';
  img.style.height = '450px';
  img.style.objectFit = 'cover';
}

            };
            img.alt = "Deal Image";
            img.style.maxWidth = "100%";
            img.style.borderRadius = "8px";
            img.style.marginBottom = "0.5rem";
            mediaEl.appendChild(img);
          } else {
            gallery.forEach((p, idx) => {
              const img = document.createElement("img");
              img.loading = "lazy";
              img.src = resolveImg(p);
              img.onload = function () {
                const dealLeft = document.querySelector('.deal-left');
                if (img.naturalHeight > img.naturalWidth) {
                  if (dealLeft) {  }
                  img.style.width = '100%'; // FIXED
                  img.style.maxWidth = '100%';
                  img.style.height = 'auto';
                  img.style.maxHeight = '450px';
                  img.style.objectFit = 'contain';
                  img.style.backgroundColor = '#fff';
                  img.style.display = 'block';
                  img.style.margin = '0 auto';
                } else {
                  img.style.width = '100%';
                  img.style.height = '450px';
                  img.style.objectFit = 'cover';
                }
              };
              img.alt = "Deal Image " + (idx + 1);
              img.style.maxWidth = "100%";
              img.style.borderRadius = "8px";
              img.style.marginBottom = "0.5rem";
              mediaEl.appendChild(img);
            });
          }
        }

        const bpContainer = document.getElementById("business-profile");
        if (bpContainer && Number(d.is_verified_business) === 1) {
          fetch(`api/get_business_profile.php?username=${encodeURIComponent(d.username)}`, { cache: "no-store" })
            .then(r => r.json())
            .then(resp => {
              if (resp.success && resp.profile) {
                const { logo, about, social } = resp.profile;
                bpContainer.innerHTML = "";
                if (logo) {
                  const img = document.createElement("img");
                  img.src = resolveImg(logo);
                  img.alt = `${d.username} Logo`;
                  img.style.maxWidth = "60px";
                  img.style.marginRight = "8px";
                  img.style.verticalAlign = "middle";
                  bpContainer.appendChild(img);
                }
                if (about) {
                  const aboutSpan = document.createElement("span");
                  aboutSpan.textContent = about;
                  aboutSpan.style.display = "inline-block";
                  aboutSpan.style.marginRight = "8px";
                  bpContainer.appendChild(aboutSpan);
                }
                if (social) {
                  const links = social.split(",").map(s => s.trim()).filter(Boolean);
                  links.forEach(link => {
                    const a = document.createElement("a");
                    a.href = link;
                    a.target = "_blank";
                    a.style.marginRight = "6px";
                    a.textContent = "🔗";
                    bpContainer.appendChild(a);
                  });
                }
              }
            })
            .catch(() => {});
        }
      })
      .catch(err => {
        console.error("Error loading deal:", err);
        const t = document.getElementById("deal-title");
        if (t) t.textContent = "Error loading deal";
      });
  }

  loadDealDetails();
});
