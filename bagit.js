const dealsContainer = document.getElementById('deals-container');
const categoriesContainer = document.getElementById('categories-container');
const locationEl = document.getElementById('location');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const loadMoreBtn = document.getElementById('load-more');
let currentPage = 1;
let lastCategory = '';
let lastSearch = '';

function displayLocation() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
        .then(res => res.json())
        .then(data => {
          const addr = data.address || {};
          const city = addr.city || addr.town || addr.village || data.display_name;
          locationEl.textContent = 'Current Location: ' + city;
        })
        .catch(() => {
          locationEl.textContent = `Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`;
        });
    }, () => {
      locationEl.textContent = 'Location unavailable';
    });
  } else {
    locationEl.textContent = 'Geolocation not supported';
  }
}

// Load categories as tiles
fetch('api/get_categories.php')
  .then(res => res.json())
  .then(categories => {
    // "All" tile to reset filtering
    const allTile = document.createElement('div');
    allTile.className = 'category-tile active';
    allTile.textContent = 'All';
    allTile.addEventListener('click', () => {
      currentPage = 1;
      lastCategory = '';
      highlightCategory('All');
      loadDeals('', lastSearch, true);
    });
    categoriesContainer.appendChild(allTile);

    categories.forEach(cat => {
      const tile = document.createElement('div');
      tile.className = 'category-tile';
      tile.textContent = cat.name;
      tile.addEventListener('click', () => {
        currentPage = 1;
        lastCategory = cat.name;
        highlightCategory(cat.name);
        loadDeals(lastCategory, lastSearch, true);
      });
      categoriesContainer.appendChild(tile);
    });

    // ensure "All" starts highlighted
    highlightCategory('All');
  });

function highlightCategory(name) {
  document.querySelectorAll('.category-tile').forEach(tile => {
    tile.classList.toggle('active', tile.textContent === name);
  });
}

searchBtn.addEventListener('click', () => {
  currentPage = 1;
  lastSearch = searchInput.value;
  loadDeals(lastCategory, lastSearch, true);
});

function vote(dealId, type) {
  fetch('api/vote.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deal_id: dealId, vote_type: type })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success && typeof data.total_votes === 'number') {
      const voteElement = document.getElementById(`vote-count-${dealId}`);
      if (voteElement) {
        voteElement.textContent = `Votes: ${data.total_votes}`;
      }
    } else {
      alert(data.error || 'Vote failed');
    }
  })
  .catch(err => {
    console.error('Vote error:', err);
    alert('Error submitting vote');
  });
}

function loadDeals(category = '', search = '', reset = false) {
  let url = `api/get_deals.php?page=${currentPage}`;
  if (category) {
    url += `&category=${encodeURIComponent(category)}`;
  }
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }

  fetch(url)
    .then(response => response.json())
    .then(deals => {
      if (reset) {
        dealsContainer.innerHTML = '';
      }
      deals.forEach(deal => {
        const card = document.createElement('div');
        card.className = 'deal-card';
        const votes = typeof deal.votes === 'number' ? deal.votes : 0;
        const rating = deal.avg_rating ? parseFloat(deal.avg_rating).toFixed(1) : 'N/A';
        card.innerHTML = `
          ${deal.image ? `<img src="images/${deal.image}" alt="${deal.title}" style="width:100%; border-radius:8px;" />` : ''}
          <h2>${deal.title}</h2>
          <p>${deal.description}</p>
          <span class="badge">${deal.status}</span>
          <div style="margin-top: 10px;">
            <button onclick="vote(${deal.id}, 'up')">👍</button>
            <button onclick="vote(${deal.id}, 'down')">👎</button>
            <span id="vote-count-${deal.id}">Votes: ${votes}</span>
          </div>
          <div>Rating: ${rating}</div>
          <a class="view-button" href="deal.html?id=${deal.id}">View Deal</a>
        `;
        dealsContainer.appendChild(card);
      });
      loadMoreBtn.style.display = deals.length === 0 || deals.length < 10 ? 'none' : 'block';
    })
    .catch(error => {
      console.error('Error loading deals:', error);
      dealsContainer.innerHTML = '<p>Failed to load deals. Please try again later.</p>';
    });
}
loadMoreBtn.addEventListener('click', () => {
  currentPage++;
  loadDeals(lastCategory, lastSearch);
});

function init() {
  currentPage = 1;
  loadDeals();
  displayLocation();
}

init();
