
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btn-abuse");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const username = localStorage.getItem("username");
    const dealId = btn.dataset.id;
    if (!username) return alert("Login to report abuse");
    fetch("report_abuse.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, deal_id: dealId })
    })
    .then(res => res.json())
    .then(resp => {
      if (resp.success) alert("Reported successfully!");
      else alert(resp.error || "Failed to report.");
    });
  });
});
