function escapeHTML(s){ s=String(s==null?'':s); return s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
window.onload = () => {
  console.log("💬 chat.js running...");

  const sendBtn = document.getElementById("chat-send-btn");
  const input = document.getElementById("chat-message-input");
  const messages = document.getElementById("chat-messages");
  const roomSelect = document.getElementById("chat-room-select");
  const closeBtn = document.getElementById("close-chat");
  const fullBtn = document.getElementById("toggle-fullscreen");
  const toggleBtn = document.getElementById("chat-toggle-btn");
  const chatWidget = document.getElementById("chat-widget");

  const username = localStorage.getItem("username");

  if (!sendBtn || !input || !messages || !roomSelect || !username) {
    console.warn("❌ Chat elements or username missing");
    return;
  }

  // ✅ Load saved chat history
  const saved = JSON.parse(localStorage.getItem("chat_history") || "[]");
  saved.forEach(item => {
    const msgDiv = document.createElement("div");
    msgDiv.className = "chat-message user";
    msgDiv.innerHTML = `<strong>${escapeHTML(item.username)}:</strong> ${escapeHTML(item.message)}`;
    messages.appendChild(msgDiv);
  });
  messages.scrollTop = messages.scrollHeight;

  // ✅ Send message function
  function sendMessage() {
    const msg = input.value.trim();
    const room = roomSelect.value;

    if (msg === "" || !room) {
      console.warn("❌ Empty message or missing room");
      return;
    }

    const msgDiv = document.createElement("div");
    msgDiv.className = "chat-message user";
    msgDiv.innerHTML = `<strong>${escapeHTML(username)}:</strong> ${escapeHTML(msg)}`;
    messages.appendChild(msgDiv);
    input.value = "";
    messages.scrollTop = messages.scrollHeight;

    let chatHistory = JSON.parse(localStorage.getItem("chat_history") || "[]");
    chatHistory.push({ username, message: msg });
    localStorage.setItem("chat_history", JSON.stringify(chatHistory));

    fetch("chat_api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, message: msg, room_name: room })
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
  }

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  closeBtn?.addEventListener("click", () => {
    chatWidget.classList.add("hidden");
  });

  fullBtn?.addEventListener("click", () => {
    chatWidget.classList.toggle("fullscreen");
  });

  toggleBtn?.addEventListener("click", () => {
    chatWidget?.classList.toggle("hidden");
  });
};
