
document.getElementById("msg-form").addEventListener("submit", e => {
  e.preventDefault();
  const from = localStorage.getItem("username");
  const to = document.getElementById("to").value.trim();
  const body = document.getElementById("msg-body").value.trim();
  if (!to || !body) return;
  fetch("send_message.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, message: body })
  }).then(res => res.json())
    .then(data => {
      document.getElementById("msg-status").textContent = data.success ? "✅ Sent!" : "❌ Failed";
    });
});
