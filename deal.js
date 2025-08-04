document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const dealId = urlParams.get("id");
  const bookmarkIcon = document.getElementById("bookmark-container");
  const username = localStorage.getItem("username");

  if (!dealId) return;
  if (!username) {
    alert("You must be logged in to interact with deals.");
    return;
  }

  const voteCount = document.getElementById("vote-count");
  const feedbackCounts = {
    useful: document.getElementById("fb-useful"),
    not_interested: document.getElementById("fb-not"),
    fake: document.getElementById("fb-fake")
  };
   


  // ✅ Bookmark Logic
  if (bookmarkIcon && username) {
    fetch(`api/check_bookmark.php?username=${encodeURIComponent(username)}&deal_id=${dealId}`)
      .then(res => res.json())
      .then(data => {
        if (data.bookmarked) {
          bookmarkIcon.classList.add("bookmarked");
        }
      });

    bookmarkIcon.addEventListener("click", () => {
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
  // ✅ Load deal image (with fallback)
fetch("api/get_deal.php?id=" + dealId)
  .then(res => res.json())
  .then(data => {
    if (data.success && data.deal) {
      const deal = data.deal;

      const imageSrc = deal.thumbnail
        ? `uploads/${deal.thumbnail}`
        : "images/default.jpg";

      // 🔁 Check if image already exists
      if (!document.getElementById("deal-image")) {
        const imageWrapper = document.createElement("div");
        imageWrapper.className = "image-wrapper";

        const img = document.createElement("img");
        img.src = imageSrc;
        img.alt = "Deal Image";
        img.id = "deal-image";

        imageWrapper.appendChild(img);

        const target = document.querySelector(".deal-card");
        if (target) target.insertBefore(imageWrapper, target.children[1]); // insert after title
      }
    }
  });
});
