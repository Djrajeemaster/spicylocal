console.log("💬 chat.js running...");

(() => {
  const sendBtn = document.getElementById("chat-send-btn");
  const input = document.getElementById("chat-message-input");
  const messages = document.getElementById("chat-messages");
  const roomSelect = document.getElementById("chat-room-select");
  const username = localStorage.getItem("username");

  if (!sendBtn || !input || !messages || !roomSelect || !username) {
    console.warn("❌ Chat elements or username missing");
    return;
  }

  sendBtn.addEventListener("click", () => {
    const msg = input.value.trim();
    const room = roomSelect.value;

    if (msg === "" || !room) {
      console.warn("❌ Empty message or missing room");
      return;
    }

    // Add message to chat UI
    const msgDiv = document.createElement("div");
    msgDiv.className = "chat-message user";
    msgDiv.innerHTML = `<strong>${username}:</strong> ${msg}`;
    messages.appendChild(msgDiv);
    input.value = "";
    messages.scrollTop = messages.scrollHeight;
console.log("Sending chat:", { username, msg, room });

    // Send to backend
    fetch("chat_api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, message: msg, room })
    })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        console.warn("⚠️ Failed to store chat message:", data.error || "Unknown error");
      }
    })
    .catch(err => {
      console.error("❌ Chat API error:", err);
    });
  });

  // Chat widget controls
  const closeBtn = document.getElementById("close-chat");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      document.getElementById("chat-widget").classList.add("hidden");
    });
  }

  const fullBtn = document.getElementById("toggle-fullscreen");
  if (fullBtn) {
    fullBtn.addEventListener("click", () => {
      document.getElementById("chat-widget").classList.toggle("fullscreen");
    });
  }

  const toggleBtn = document.getElementById("chat-toggle-btn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      document.getElementById("chat-widget").classList.toggle("hidden");
    });
  }
})();
