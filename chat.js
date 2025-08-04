console.log("💬 chat.js running...");

(() => {
  const sendBtn = document.getElementById("chat-send-btn");
  const input = document.getElementById("chat-message-input");
  const messages = document.getElementById("chat-messages");
  const roomSelect = document.getElementById("chat-room-select");
  const chatWidget = document.getElementById("chat-widget");

  if (!sendBtn || !input || !messages || !roomSelect) {
    console.warn("❌ Chat elements missing");
    return;
  }

  function disableChat() {
    sendBtn.disabled = true;
    input.disabled = true;
    const msgDiv = document.createElement("div");
    msgDiv.className = "chat-message system";
    msgDiv.textContent = "Please log in to chat.";
    messages.appendChild(msgDiv);
  }

  function fetchMessages(room, username) {
    fetch(`chat_api.php?room=${encodeURIComponent(room)}`)
      .then(res => res.json())
      .then(data => {
        if (!data.success) return;
        messages.innerHTML = "";
        data.messages.forEach(m => {
          const msgDiv = document.createElement("div");
          msgDiv.className = "chat-message" + (m.username === username ? " user" : "");
          msgDiv.innerHTML = `<strong>${m.username}:</strong> ${m.message}`;
          messages.appendChild(msgDiv);
        });
        messages.scrollTop = messages.scrollHeight;
      })
      .catch(err => console.error("❌ Chat fetch error:", err));
  }

  // Session check to get username
  fetch("api/session.php")
    .then(res => res.json())
    .then(data => {
      if (!data.loggedIn) {
        localStorage.removeItem("username");
        disableChat();
        return;
      }

      const username = data.username;
      localStorage.setItem("username", username);

      // Load initial messages
      fetchMessages(roomSelect.value, username);
      setInterval(() => fetchMessages(roomSelect.value, username), 5000);
      roomSelect.addEventListener("change", () => fetchMessages(roomSelect.value, username));

      sendBtn.addEventListener("click", () => {
        const msg = input.value.trim();
        const room = roomSelect.value;

        if (msg === "" || !room) {
          console.warn("❌ Empty message or missing room");
          return;
        }

        const msgDiv = document.createElement("div");
        msgDiv.className = "chat-message user";
        msgDiv.innerHTML = `<strong>${username}:</strong> ${msg}`;
        messages.appendChild(msgDiv);
        input.value = "";
        messages.scrollTop = messages.scrollHeight;

        console.log("Sending chat:", { username, msg, room });

        fetch("chat_api.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, message: msg, room_name: room })
        })
        .then(res => res.json())
        .then(data => {
          if (!data.success) {
            console.warn("⚠️ Failed to store chat message:", data.error || "Unknown error");
          } else {
            fetchMessages(room, username); // Refresh chat
          }
        })
        .catch(err => {
          console.error("❌ Chat API error:", err);
        });
      });
    })
    .catch(err => {
      console.error("❌ Session check failed:", err);
      disableChat();
    });

  // Chat widget UI controls
  const closeBtn = document.getElementById("close-chat");
  const fullBtn = document.getElementById("toggle-fullscreen");
  const toggleBtn = document.getElementById("chat-toggle-btn");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      chatWidget.classList.add("hidden");
    });
  }

  if (fullBtn) {
    fullBtn.addEventListener("click", () => {
      chatWidget.classList.toggle("fullscreen");
    });
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      chatWidget.classList.toggle("hidden");
    });
  }
})();
