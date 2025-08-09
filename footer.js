
document.addEventListener("DOMContentLoaded", () => {
  fetch("footer.html")
    .then(res => res.text())
    .then(data => {
      const footer = document.createElement("div");
      footer.innerHTML = data;
      document.body.appendChild(footer);
    });
});
