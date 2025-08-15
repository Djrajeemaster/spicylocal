// theme.js — unified theme manager (no floating widget on public pages)
(function () {
  const IS_SUPERADMIN_PAGE = /\/bagit\/admin\/superadmin\.php$/i.test(
    location.pathname.replace(/\/+$/, "")
  );
  const FLOAT_IDS = ["sbThemeFloating", "sb-theme-fab", "theme-fab"];

  function applyVars(color) {
    if (!color) return;
    const r = document.documentElement;
    r.style.setProperty("--sb-accent", color);
    r.style.setProperty("--sb-primary", color);
  }

  async function fetchTheme() {
    try {
      const r = await fetch("/bagit/api/theme_get.php", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await r.json();
      const t = (data && data.theme) ? data.theme : data;
      const c =
        t.brand || t.theme_brand || t.sb_accent || t.accent || t.primary || t.color;
      if (c) return c;
    } catch (e) {}
    try {
      const ls = localStorage.getItem("sb_theme");
      if (ls) {
        const p = JSON.parse(ls);
        return p.brand || p.color || null;
      }
    } catch (e) {}
    return null;
  }

  function killFloating() {
    // Known ids/markers
    FLOAT_IDS.forEach((id) => {
      const n = document.getElementById(id);
      if (n) n.remove();
    });
    document.querySelectorAll('[data-theme-floating="1"]').forEach((n) => n.remove());

    // Heuristic: fixed bottom-right box with color input + “Save” + “Theme”
    if (!IS_SUPERADMIN_PAGE) {
      document.querySelectorAll("div,section").forEach((node) => {
        try {
          const st = getComputedStyle(node);
          if (st.position === "fixed" && parseInt(st.right) >= 0 && parseInt(st.bottom) >= 0) {
            const hasColor = !!node.querySelector('input[type="color"]');
            const hasSave = !!node.querySelector("button, input[type='submit']");
            const hasWord = /theme/i.test(node.textContent || "");
            if (hasColor && hasSave && hasWord) node.remove();
          }
        } catch (_) {}
      });
    }
  }

  function ensureThemeCard() {
    if (!IS_SUPERADMIN_PAGE) return;
    if (document.getElementById("sbThemeCard")) return;

    const host =
      document.querySelector(".sa-content, main .content, main, .content, #content") ||
      document.body;

    const wrap = document.createElement("section");
    wrap.className = "card";
    wrap.id = "sbThemeCard";
    wrap.style.marginTop = "16px";
    wrap.innerHTML = [
      '<h3 style="margin-bottom:8px">Brand Theme</h3>',
      '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">',
      "  <label>Primary</label>",
      '  <input type="color" id="sbThemeColor" value="#e91e63" />',
      '  <button id="sbThemePreview" type="button">Preview</button>',
      '  <button id="sbThemeSave" type="button">Save</button>',
      '  <small id="sbThemeMsg" style="display:block;margin-left:8px;color:#6b7280"></small>',
      "</div>",
    ].join("");
    host.appendChild(wrap);

    const $ = (id) => document.getElementById(id);

    $("sbThemePreview").onclick = () => {
      const c = $("sbThemeColor").value;
      applyVars(c);
      $("sbThemeMsg").textContent = "Preview applied (not saved).";
      $("sbThemeMsg").style.color = "#6b7280";
    };

    $("sbThemeSave").onclick = async () => {
      const c = $("sbThemeColor").value;
      applyVars(c);
      try {
        localStorage.setItem("sb_theme", JSON.stringify({ brand: c }));
      } catch (_) {}

      // Save JSON → fallback FormData (handles your previous 400)
      try {
        const r = await fetch("/bagit/api/theme_set.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ brand: c, theme_brand: c, sb_accent: c, color: c }),
        });
        if (r.ok) {
          $("sbThemeMsg").textContent = "Theme saved.";
          $("sbThemeMsg").style.color = "#16a34a";
          return;
        }
        throw 0;
      } catch (e) {
        const fd = new FormData();
        ["brand", "theme_brand", "sb_accent", "color"].forEach((k) => fd.append(k, c));
        const r2 = await fetch("/bagit/api/theme_set.php", {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        $("sbThemeMsg").textContent = r2.ok ? "Theme saved." : "Save failed (check API)";
        $("sbThemeMsg").style.color = r2.ok ? "#16a34a" : "#dc2626";
      }
    };
  }

  // Live update across tabs
  window.addEventListener("storage", function (e) {
    if (e.key === "sb_theme" && e.newValue) {
      try {
        const t = JSON.parse(e.newValue);
        applyVars(t.brand || t.color);
      } catch (_) {}
    }
  });

  document.addEventListener("DOMContentLoaded", function () {
    fetchTheme().then(function (c) {
      applyVars(c);
      try {
        localStorage.setItem("sb_theme", JSON.stringify({ brand: c || "" }));
      } catch (_) {}
    });

    ensureThemeCard();     // render control only on superadmin page
    killFloating();        // purge any old floating toggles

    if (!IS_SUPERADMIN_PAGE) {
      const mo = new MutationObserver(killFloating);
      mo.observe(document.documentElement, { childList: true, subtree: true });
    }
  });
})();
