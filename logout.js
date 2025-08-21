
function toggleDropdown() {
  const dropdown = document.getElementById('dropdown');
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}
function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}
