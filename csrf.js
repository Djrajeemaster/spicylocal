// csrf.js — CSRF helper
(function(g){
  let token = null, inflight = null;
  async function getToken(){
    if (token) return token;
    if (inflight) return inflight;
    inflight = fetch('api/csrf.php', {credentials:'include', cache:'no-store'})
      .then(r=>r.json()).then(j=>{ token = j && j.token; return token; })
      .catch(()=>null).finally(()=>{ inflight = null; });
    return inflight;
  }
  g.csrfFetch = async function(url, opts){
    opts = opts || {};
    if (!opts.method || opts.method.toUpperCase()==='GET') {
      opts.credentials = opts.credentials || 'include';
      return fetch(url, opts);
    }
    const t = await getToken();
    opts.headers = Object.assign({}, opts.headers || {}, t? {'X-CSRF-Token': t} : {});
    opts.credentials = opts.credentials || 'include';
    return fetch(url, opts);
  }
})(window);
