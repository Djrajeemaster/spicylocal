/* auth_probe.js — set body classes so CSS/JS can allow comments/votes */
(function(){
  function apply(u){
    if (u) document.body.classList.add('logged-in'); else document.body.classList.remove('logged-in');
  }
  if (window.SESSION_USER !== undefined) { apply(window.SESSION_USER); return; }
  fetch('api/auth/profile.php', { credentials: 'include' })
    .then(function(r){ if(!r.ok) throw 0; return r.json(); })
    .then(function(j){ apply(j && j.ok); })
    .catch(function(){ apply(false); });
})();