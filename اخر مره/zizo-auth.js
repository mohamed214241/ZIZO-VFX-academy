/* ═══════════════════════════════════════════════════
   ZIZO AUTH — Shared Auth & DB Layer
   كل الصفحات تشتغل بنفس المفاتيح
   localStorage فقط — sessionStorage ممنوع
═══════════════════════════════════════════════════ */

/* ── DB ── */
window.DB = {
  _k: k => 'zizo_' + k,
  get(k, d) {
    try { const v = localStorage.getItem(this._k(k)); return v !== null ? JSON.parse(v) : d; }
    catch { return d; }
  },
  set(k, v) {
    try { localStorage.setItem(this._k(k), JSON.stringify(v)); } catch {}
  },
  del(k) {
    try { localStorage.removeItem(this._k(k)); } catch {}
  },
  log(txt, type = 'info') {
    try {
      const l = this.get('logs', []);
      const t = new Date().toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
      l.unshift({ txt, type, time: t });
      if (l.length > 200) l.length = 200;
      this.set('logs', l);
    } catch {}
  }
};

/* ── AUTH ── */
window.Auth = {
  KEY: 'zizo_auth',
  set(d) {
    try { localStorage.setItem(this.KEY, JSON.stringify(d)); } catch {}
  },
  get() {
    try {
      const v = localStorage.getItem(this.KEY);
      return v ? JSON.parse(v) : null;
    } catch { return null; }
  },
  clear() {
    try { localStorage.removeItem(this.KEY); } catch {}
  },
  update(patch) {
    const cur = this.get() || {};
    this.set({ ...cur, ...patch });
  }
};

/* ── REGS HELPERS ── */
window.RegsDB = {
  getAll() { return DB.get('registrations', []); },
  save(regs) { DB.set('registrations', regs); },
  findByUser(user) {
    if (!user) return null;
    return this.getAll().find(r =>
      (user.email && r.email === user.email) ||
      (user.phone && r.phone === user.phone) ||
      (user.id && r.id === user.id)
    ) || null;
  },
  syncAuthStatus(reg) {
    try {
      const cur = Auth.get();
      if (!cur || cur.role === 'admin') return;
      if (
        (cur.email && cur.email === reg.email) ||
        (cur.phone && cur.phone === reg.phone) ||
        (cur.id && cur.id === reg.id)
      ) { Auth.update({ status: reg.status }); }
    } catch {}
  }
};