// search.js
// This script binds a search bar input to filter deal cards in real time.
// It should be loaded on pages that display deal cards (e.g., index.html).

document.addEventListener("DOMContentLoaded", () => {
  /**
   * Attach search and suggestion listeners once header is mounted.
   */
  function attachSearchListener() {
    const searchInput = document.getElementById("deal-search");
    if (!searchInput) {
      setTimeout(attachSearchListener, 100);
      return;
    }
    // Ensure suggestions container exists
    let suggDiv = document.getElementById('search-suggestions');
    if (!suggDiv) {
      suggDiv = document.createElement('div');
      suggDiv.id = 'search-suggestions';
      suggDiv.style.position = 'relative';
      suggDiv.style.zIndex = '1000';
      searchInput.parentNode.appendChild(suggDiv);
    }
    if (searchInput.__searchListenerAttached) return;
    searchInput.__searchListenerAttached = true;

    // Load feature flags for search assist
    let featureFlags = {};
    fetch('api/feature_flags.php')
      .then(r => r.json())
      .then(f => { featureFlags = f || {}; });
    // Load trending tags for suggestions
    let trendingTags = [];
    fetch('api/get_tags.php?limit=10').then(r => r.json()).then(tags => {
      trendingTags = tags || [];
    });

    searchInput.addEventListener('input', function () {
      const query = this.value.toLowerCase().trim();
      // Filter cards regardless of search assist
      const cards = document.querySelectorAll('.deal-card');
      cards.forEach(card => {
        const titleEl = card.querySelector('.deal-title');
        const descEl  = card.querySelector('.deal-description');
        const title = titleEl ? titleEl.textContent.toLowerCase() : '';
        const desc  = descEl ? descEl.textContent.toLowerCase() : '';
        const matches = title.includes(query) || desc.includes(query);
        card.style.display = matches || query === '' ? 'block' : 'none';
      });
      // Generate suggestions if search assist enabled
      if (featureFlags.search_assist) {
        showSearchSuggestions(query, trendingTags);
      }
    });
  }
  attachSearchListener();

  function showSearchSuggestions(query, tags) {
    const suggDiv = document.getElementById('search-suggestions');
    if (!suggDiv) return;
    suggDiv.innerHTML = '';
    if (!query) return;
    const suggestions = [];
    // Tag based suggestions
    tags.forEach(t => {
      if (t.tag_name.toLowerCase().startsWith(query) && suggestions.length < 5) {
        suggestions.push(t.tag_name);
      }
    });
    // Predefined suggestions
    if (suggestions.length < 3) {
      const preset = ['Deals near you', 'Top electronics', 'Weekend deals'];
      preset.forEach(p => {
        if (p.toLowerCase().includes(query) && suggestions.indexOf(p) === -1) {
          suggestions.push(p);
        }
      });
    }
    if (suggestions.length === 0) return;
    const list = document.createElement('div');
    list.style.position = 'absolute';
    list.style.background = '#fff';
    list.style.border = '1px solid #ccc';
    const searchInput = document.getElementById('deal-search');
    if (searchInput) {
      list.style.width = searchInput.offsetWidth + 'px';
    }
    suggestions.forEach(s => {
      const item = document.createElement('div');
      item.textContent = s;
      item.style.padding = '4px 6px';
      item.style.cursor = 'pointer';
      item.addEventListener('mousedown', () => {
        // On click, set search value and trigger input event
        const si = document.getElementById('deal-search');
        if (si) {
          si.value = s;
          const evt = new Event('input', { bubbles: true });
          si.dispatchEvent(evt);
        }
        suggDiv.innerHTML = '';
      });
      list.appendChild(item);
    });
    suggDiv.appendChild(list);
  }
});