// client_error.js — capture errors and send to server (throttled)
(function(g){
  var last = { msg:'', ts:0 };
  function post(path, body){
    try {
      if (typeof csrfFetch === 'function') return csrfFetch(path, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      return fetch(path, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    } catch(e){}
  }
  function send(type, payload){
    var now = Date.now();
    var sig = type + '|' + (payload.message || payload.reason || '');
    if (last.msg === sig && (now - last.ts) < 5000) return;
    last = { msg:sig, ts:now };
    post('/bagit/api/log_client_error.php', {
      type: type, url: location.href, ua: navigator.userAgent, ts: now, payload: payload
    });
  }
  g.addEventListener('error', function(ev){
    try{ send('error', { message:String(ev.message||''), file:String(ev.filename||''), line:ev.lineno||0, col:ev.colno||0, stack:String(ev.error && ev.error.stack || '') }); }catch(e){}
  });
  g.addEventListener('unhandledrejection', function(ev){
    var reason = ev && (ev.reason && (ev.reason.stack || ev.reason.message) || ev.reason);
    send('unhandledrejection', { reason:String(reason||'') });
  });
})(window);
