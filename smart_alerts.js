// smart_alerts.js
// This script powers the Smart Alerts preferences page. It fetches available
// categories from the deals API, displays them with toggles, and persists
// user selections in localStorage. In a future implementation, the
// selections could be sent to the backend via an API call.

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('alerts-container');
  if (!container) return;

  // Helper: fetch all deals and extract unique categories
  function fetchCategories() {
    return fetch('api/get_deals.php')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load deals');
        return res.json();
      })
      .then(deals => {
        const categories = new Set();
        // Each deal has a 'category' field; collect unique values
        deals.forEach(deal => {
          if (deal.category) categories.add(deal.category);
        });
        return Array.from(categories).sort();
      })
      .catch(err => {
        console.error('[smart_alerts] Error fetching categories:', err);
        return [];
      });
  }

  // Load saved preferences from localStorage
  function loadPrefs() {
    try {
      const raw = localStorage.getItem('smartAlertPrefs');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  // Save preferences back to localStorage
  function savePrefs(prefs) {
    localStorage.setItem('smartAlertPrefs', JSON.stringify(prefs));
  }

  // Render the category list with checkboxes
  function renderCategories(categories, prefs) {
    container.innerHTML = '';
    if (categories.length === 0) {
      const msg = document.createElement('p');
      msg.textContent = 'No categories found.';
      container.appendChild(msg);
      return;
    }
    categories.forEach(category => {
      const item = document.createElement('div');
      item.className = 'alert-item';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = `alert-${category}`;
      input.checked = prefs.includes(category);
      const label = document.createElement('label');
      label.htmlFor = input.id;
      label.textContent = category;
      input.addEventListener('change', () => {
        const current = loadPrefs();
        if (input.checked) {
          if (!current.includes(category)) current.push(category);
        } else {
          const index = current.indexOf(category);
          if (index > -1) current.splice(index, 1);
        }
        savePrefs(current);
        // Placeholder: In a real app, send updated prefs to backend
        console.log('[smart_alerts] Saved preferences:', current);
      });
      item.appendChild(input);
      item.appendChild(label);
      container.appendChild(item);
    });
  }

  // Initialize: fetch categories and build UI
  (async function init() {
    const categories = await fetchCategories();
    const prefs = loadPrefs();
    renderCategories(categories, prefs);
  })();
});