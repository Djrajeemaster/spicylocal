
document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll(".nav-menu a");
  const sections = document.querySelectorAll(".spa-section");

  links.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.getAttribute("data-target");

      // Remove active class from all links
      links.forEach(l => l.classList.remove("active"));
      link.classList.add("active");

      // Hide all sections
      sections.forEach(sec => sec.style.display = "none");

      // Show selected section
      const selected = document.getElementById(target);
      if (selected) {
        selected.style.display = "block";

        // ✅ Trigger fetch only when switching to My Deals tab
        if (target === "section-deals") {
          if (typeof window.fetchUserDeals === "function") {
            window.fetchUserDeals("approved");
          } else {
            console.warn("fetchUserDeals() not defined yet.");
          }
        }
      }
    });
  });

  // Show default section
  const defaultSection = document.querySelector(".spa-section");
  if (defaultSection) defaultSection.style.display = "block";
});
