// customize_business_profile.js
// Handles loading and saving of a verified business user's profile.
document.addEventListener('DOMContentLoaded', () => {
  // Ensure only verified business users can access this page.
  const isVerifiedBusiness = localStorage.getItem('is_verified_business');
  if (!isVerifiedBusiness || (isVerifiedBusiness !== '1' && isVerifiedBusiness !== 'true')) {
    alert('Access denied: Verified businesses only');
    window.location.href = 'index.html';
    return;
  }

  const logoInput    = document.getElementById('bp-logo');
  const aboutInput   = document.getElementById('bp-about');
  const socialInput  = document.getElementById('bp-social');
  const logoPreview  = document.getElementById('bp-logo-preview');
  const form         = document.getElementById('business-profile-form');
  const messageDiv   = document.getElementById('bp-message');

  // Fetch current profile via backend API (requires session)
  fetch('api/get_business_profile.php')
    .then(res => res.json())
    .then(data => {
      if (data.success && data.profile) {
        const p = data.profile;
        aboutInput.value = p.about || '';
        socialInput.value = p.social || '';
        if (p.logo) {
          const img = document.createElement('img');
          img.src = p.logo.startsWith('uploads/') ? p.logo : 'uploads/' + p.logo;
          img.alt = 'Business Logo';
          logoPreview.innerHTML = '';
          logoPreview.appendChild(img);
        }
      }
    })
    .catch(() => {
      // Failing silently is acceptable if user has no profile yet
    });

  // Preview logo when a new file is selected
  if (logoInput) {
    logoInput.addEventListener('change', () => {
      const file = logoInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = document.createElement('img');
          img.src = e.target.result;
          img.alt = 'Selected Logo';
          logoPreview.innerHTML = '';
          logoPreview.appendChild(img);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    messageDiv.textContent = '';
    const fd = new FormData();
    const about = aboutInput.value.trim();
    const social = socialInput.value.trim();
    if (about !== '') fd.append('about', about);
    if (social !== '') fd.append('social', social);
    if (logoInput.files && logoInput.files[0]) {
      fd.append('logo', logoInput.files[0]);
    }
    // Submit update to server
    fetch('api/update_business_profile.php', {
      method: 'POST',
      body: fd
    })
      .then(res => res.json())
      .then(resp => {
        if (resp.success) {
          messageDiv.style.color = 'green';
          messageDiv.textContent = resp.message || 'Profile saved';
        } else {
          messageDiv.style.color = 'red';
          messageDiv.textContent = resp.error || 'Failed to save';
        }
      })
      .catch(() => {
        messageDiv.style.color = 'red';
        messageDiv.textContent = 'Error saving profile';
      });
  });
});