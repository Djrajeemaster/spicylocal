document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const dealId = urlParams.get("id");
  const bookmarkIcon = document.getElementById("bookmark-container");
  const username = localStorage.getItem("username");

  if (!dealId) return;
  try{
    const key = "sb_seen_deals";
    const cur = JSON.parse(localStorage.getItem(key) || "[]");
    if (!cur.includes(String(dealId))) { cur.push(String(dealId)); localStorage.setItem(key, JSON.stringify(cur)); }
  }catch{}

  // Voting and commenting require login, but viewing the deal does not.
  const voteCount = document.getElementById("vote-count");
  const feedbackCounts = {
    useful: document.getElementById("fb-useful"),
    not_interested: document.getElementById("fb-not"),
    fake: document.getElementById("fb-fake")
  };
   


  // ✅ Bookmark Logic: Only logged‑in users can bookmark
  if (bookmarkIcon) {
    if (username) {
      fetch(`api/check_bookmark.php?username=${encodeURIComponent(username)}&deal_id=${dealId}`)
        .then(res => res.json())
        .then(data => {
          if (data.bookmarked) {
            bookmarkIcon.classList.add("bookmarked");
          }
        });
      bookmarkIcon.addEventListener("click", () => {
        if (!localStorage.getItem('username')) {
          alert('Please log in to bookmark deals.');
          return;
        }
        fetch("api/toggle_bookmark.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, deal_id: dealId })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              bookmarkIcon.classList.toggle("bookmarked");
            } else {
              alert("Failed to bookmark deal.");
            }
          })
          .catch(err => {
            console.error("Bookmark error:", err);
          });
      });
    } else {
      bookmarkIcon.addEventListener('click', () => {
        alert('Please log in to bookmark deals.');
      });
    }
  }

  // ✅ Vote Handling
  document.querySelectorAll(".vote-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const vote = btn.dataset.vote;
      try {
        const res = await fetch("api/vote.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deal_id: dealId, vote, username })
        });

        const data = await res.json();
        if (data.success && typeof data.total_votes !== 'undefined') {
          voteCount.textContent = data.total_votes;
        } else {
          alert("Vote failed: " + (data.error || "Unknown error"));
        }
      } catch (err) {
        alert("Vote error: " + err.message);
      }
    });
  });

  // ✅ Feedback Handling
  document.querySelectorAll(".feedback-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const feedback = btn.dataset.feedback;
      try {
        const res = await fetch("api/feedback.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deal_id: dealId, feedback, username })
        });

        const data = await res.json();
        if (data.success && data.counts) {
          feedbackCounts.useful.textContent = data.counts.useful;
          feedbackCounts.not_interested.textContent = data.counts.not_interested;
          feedbackCounts.fake.textContent = data.counts.fake;
        } else {
          alert("Feedback failed: " + (data.error || "Unknown error"));
        }
      } catch (err) {
        alert("Feedback error: " + err.message);
      }
    });
  });

  // ✅ Initial vote & feedback load
  Promise.all([
    fetch("api/get_votes.php").then(res => res.json()),
    fetch("api/get_feedback.php").then(res => res.json())
  ]).then(([votesData, feedbackData]) => {
    const v = votesData[dealId] || { up: 0, down: 0 };
    const f = feedbackData[dealId] || { useful: 0, not_interested: 0, fake: 0 };

    voteCount.textContent = v.up - v.down;
    feedbackCounts.useful.textContent = f.useful;
    feedbackCounts.not_interested.textContent = f.not_interested;
    feedbackCounts.fake.textContent = f.fake;
  }).catch(err => {
    console.error("Error loading vote/feedback counts:", err);
  });
  // ✅ Load detailed deal data and render into the page
  function loadDealDetails() {
    // Always increment the view count; ignore errors
    fetch(`api/increment_view.php?id=${dealId}`).catch(() => {});
    fetch(`api/get_deal.php?id=${dealId}`)
      .then(res => res.json())
      .then(data => {
        if (!data.success || !data.deal) {
          document.getElementById('deal-title').textContent = 'Deal not found.';
          return;
        }
        const d = data.deal;
        // Title
        const titleEl = document.getElementById('deal-title');
        if (titleEl) titleEl.textContent = d.title || 'Untitled';
        // Summary
        const summaryEl = document.getElementById('deal-summary');
        if (summaryEl) {
          summaryEl.textContent = d.summary || '';
          summaryEl.style.display = d.summary ? 'block' : 'none';
        }
        // Description
        const descEl = document.getElementById('deal-description');
        if (descEl) descEl.textContent = d.description || '';
        // User and badges
        const userEl = document.getElementById('deal-user');
        const verifiedBadge = document.getElementById('verified-badge');
        const businessBadge = document.getElementById('business-badge');
        if (userEl) userEl.textContent = d.username || 'Anonymous';
        if (verifiedBadge) {
          verifiedBadge.textContent = Number(d.is_verified) === 1 ? '✔️ Verified' : '';
        }
        if (businessBadge) {
          businessBadge.textContent = Number(d.is_verified_business) === 1 ? '🏬 Verified Business' : '';
        }
        // Views
        const viewsEl = document.getElementById('view-count');
        if (viewsEl) viewsEl.textContent = d.views || 0;
        // Status
        const statusEl = document.getElementById('deal-status');
        if (statusEl) {
          let badge = '';
          try {
            const now = new Date();
            const start = d.start_date ? new Date(d.start_date) : null;
            const end = d.end_date ? new Date(d.end_date) : null;
            if (start && now < start) {
              badge = `⏳ Starts on ${start.toLocaleDateString()}`;
            } else if (end && now > end) {
              badge = `❌ Expired`;
            }
          } catch (e) {}
          statusEl.textContent = badge;
        }
        // Tags
        const tagsEl = document.getElementById('deal-tags');
        if (tagsEl) {
          tagsEl.innerHTML = '';
          if (Array.isArray(d.tags) && d.tags.length) {
            d.tags.forEach(t => {
              const span = document.createElement('span');
              span.className = 'tag-pill';
              span.textContent = t;
              tagsEl.appendChild(span);
            });
          }
        }
        // CTA
        const ctaContainer = document.getElementById('deal-cta');
        if (ctaContainer) {
          ctaContainer.innerHTML = '';
          const hasCta = d.cta_text || d.cta_url;
          if (hasCta) {
            const ctaText = d.cta_text || 'View Deal';
            const ctaUrl  = d.cta_url || `deal.html?id=${dealId}`;
            const a = document.createElement('a');
            a.textContent = ctaText;
            a.href = ctaUrl;
            a.target = '_blank';
            a.className = 'cta-button';
            ctaContainer.appendChild(a);
          }
        }
        // Gallery/Media
        const mediaEl = document.getElementById('deal-media');
        if (mediaEl) {
          mediaEl.innerHTML = '';
          const images = Array.isArray(d.images) ? d.images : [];
          if (images.length) {
            images.forEach((imgPath) => {
              const img = document.createElement('img');
              img.src = imgPath.startsWith('uploads/') ? imgPath : `uploads/${imgPath}`;
              img.alt = 'Deal Image';
              img.style.maxWidth = '100%';
              img.style.borderRadius = '8px';
              img.style.marginBottom = '0.5rem';
              mediaEl.appendChild(img);
            });
          }
        }
        // Load business profile details for verified business deals
        const bpContainer = document.getElementById('business-profile');
        if (bpContainer && Number(d.is_verified_business) === 1) {
          // Fetch business profile by username; this endpoint requires session
          fetch(`api/get_business_profile.php?username=${encodeURIComponent(d.username)}`)
            .then(res => res.json())
            .then(resp => {
              if (resp.success && resp.profile) {
                const { logo, about, social } = resp.profile;
                bpContainer.innerHTML = '';
                if (logo) {
                  const img = document.createElement('img');
                  img.src = logo.startsWith('uploads/') ? logo : `uploads/${logo}`;
                  img.alt = `${d.username} Logo`;
                  img.style.maxWidth = '60px';
                  img.style.marginRight = '8px';
                  img.style.verticalAlign = 'middle';
                  bpContainer.appendChild(img);
                }
                if (about) {
                  const aboutSpan = document.createElement('span');
                  aboutSpan.textContent = about;
                  aboutSpan.style.display = 'inline-block';
                  aboutSpan.style.marginRight = '8px';
                  bpContainer.appendChild(aboutSpan);
                }
                if (social) {
                  // Social can be comma‑separated URLs
                  const links = social.split(',').map(s => s.trim()).filter(Boolean);
                  links.forEach((link) => {
                    const anchor = document.createElement('a');
                    anchor.href = link;
                    anchor.target = '_blank';
                    anchor.style.marginRight = '6px';
                    anchor.textContent = '🔗';
                    bpContainer.appendChild(anchor);
                  });
                }
              }
            })
            .catch(() => {});
        }
      })
      .catch(err => {
        console.error('Error loading deal:', err);
        document.getElementById('deal-title').textContent = 'Error loading deal';
      });
  }

  // Kick off loading the deal details
  loadDealDetails();
});
