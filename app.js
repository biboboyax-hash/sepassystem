const API_URL = "https://script.google.com/macros/s/AKfycbxmVnEwu2Z0blYzK1xZFK75lbnwFEyPrF6VKIVBk8DXKwVrRUD4L5j8Fg2gfIAJhuvd/exec";
const API_TOKEN = "SEPASSYSTEM2026";
const PENDING = ['Pending Review','Pending Dean Review','Pending Finance Review','Awaiting Final Approval'];
const AVATARS = {
  'System Administrator': ['#8B5CF6','♛'], 'Organizer': ['#38BDF8','▦'],
  'Finance': ['#34D399','₱'], 'School President': ['#FBBF24','♜'],
  'Student Affairs': ['#F472B6','✦'], 'Department Dean': ['#67E8F9','⚑']
};
const sessionRaw = localStorage.getItem("sepas_user");
if (!sessionRaw) window.location.href = "index.html";
const USER = JSON.parse(sessionRaw);
function logout() {
  if (confirm("Are you sure you want to log out?")) {
    localStorage.removeItem("sepas_user");
    window.location.href = "index.html";
  }
}
async function api(body) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ token: API_TOKEN, ...body })
  });
  return res.json();
}
const esc = s => { const d = document.createElement('div'); d.textContent = (s ?? ''); return d.innerHTML; };
const fmtDate = s => {
  if (!s) return '';
  const d = new Date(String(s).replace(' ', 'T'));
  return isNaN(d) ? String(s) : d.toLocaleDateString('en-US', { month:'short', day:'2-digit', year:'numeric' });
};
const fmtDT = s => {
  if (!s) return '';
  const d = new Date(String(s).replace(' ', 'T'));
  return isNaN(d) ? String(s) : d.toLocaleString('en-US', { month:'short', day:'2-digit', year:'numeric', hour:'numeric', minute:'2-digit' });
};
const dateKey = s => {
  const d = new Date(String(s).replace(' ', 'T'));
  if (isNaN(d)) return String(s).slice(0,10);
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
};
/** Countdown: "⏳ X days left" / "🔴 Happening today!" / "✅ Event done" */
const countdown = dateStr => {
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(String(dateStr).replace(' ', 'T'));
  if (isNaN(d)) return '';
  d.setHours(0,0,0,0);
  const days = Math.round((d - today) / 86400000);
  if (days < 0) return '<span style="color:#16a34a;font-size:11px">✅ Event done</span>';
  if (days === 0) return '<span style="color:#e67e22;font-size:11px;font-weight:800">🔴 Happening today!</span>';
  if (days === 1) return '<span style="color:#e67e22;font-size:11px;font-weight:700">⏳ Tomorrow!</span>';
  return '<span style="color:#66758f;font-size:11px">⏳ ' + days + ' days left</span>';
};
const CATEGORIES = ['Academic','Sports','Cultural','Community','Religious','Others'];
const statusClass = s =>
  s === 'Approved' ? 'status-approved' :
  s === 'Rejected' ? 'status-rejected' :
  (s === 'Returned for Revision' || s === 'Revision Requested') ? 'status-returned' :
  PENDING.includes(s) || s === 'Final Approval' ? 'status-pending' : 'status-draft';
function toast(msg, isErr) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = 'toast' + (isErr ? ' err' : '');
  t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 3200);
}
function navLinks() {
  const r = USER.role;
  const links = [['dashboard','Dashboard','dashboard.html','▦']];
  if (r === 'Organizer') links.push(['proposals','Event Proposals','proposals.html','▤'],['create','New Proposal','create_proposal.html','＋'],['revise','Revise Proposal','revise_proposal.html','✎'],['reports','Post-Event Reports','post_event_report.html','▥'],['feedback','Event Feedback','feedback.html','★']);
  else if (r === 'Student Affairs') links.push(['review','Review Queue','review.html','▤'],['feedback','Event Feedback','feedback.html','★']);
  else if (r === 'Department Dean') links.push(['review','Dean Review','dean_review.html','▤']);
  else if (r === 'Finance') links.push(['review','Financial Review','financial_review.html','▤'],['feedback','Event Feedback','feedback.html','★']);
  else if (r === 'School President') links.push(['approval','Final Approval','final_approval.html','▤'],['feedback','Event Feedback','feedback.html','★']);
  else if (r === 'System Administrator') links.push(['users','User Management','users.html','♙'],['feedback','Event Feedback','feedback.html','★']);
  links.push(['workspace','Budget & Comments','workspace.html','₱'],['announcements','Announcements','announcements.html','📢'],['notifications','Notifications','notifications.html','♧'],['calendar','Calendar','calendar.html','□'],['settings','Settings','settings.html','⚙']);
  return links;
}
function buildNav(activeKey) {
  document.getElementById('nav').innerHTML = navLinks().map(l =>
    `<a class="${l[0]===activeKey ? 'active' : ''}" href="${l[2]}"><span class="nav-icon">${l[3]}</span><span>${l[1]}</span>${l[0]==='notifications' ? '<span class="nav-dot" id="notif-dot" style="display:none"></span>' : ''}${l[0]==='announcements' ? '<span class="nav-dot" id="ann-dot" style="display:none;background:#f59e0b"></span>' : ''}</a>`).join('');
}
function setTopbar() {
  document.getElementById('u-name').textContent = USER.full_name;
  document.getElementById('u-role').textContent = USER.role;
  const av = AVATARS[USER.role] || ['#94A3B8','●'];
  const avEl = document.getElementById('avatar');
  avEl.style.background = av[0]; avEl.textContent = av[1];
}
async function refreshNotifDot() {
  try {
    const rows = await api({ action: "where", table: "notifications", field: "user_id", value: String(USER.user_id) });
    const n = (Array.isArray(rows) ? rows : []).filter(r => String(r.is_read) !== 'TRUE' && r.is_read !== true && r.is_read !== '1').length;
    const dot = document.getElementById('notif-dot');
    if (dot && n > 0) { dot.style.display = 'grid'; dot.textContent = n; }
  } catch(e) {}
}
async function refreshAnnDot() {
  try {
    const [ann, reads] = await Promise.all([
      api({ action: "all", table: "announcements" }),
      api({ action: "where", table: "announcement_reads", field: "user_id", value: String(USER.user_id) })
    ]);
    const readIds = new Set((Array.isArray(reads) ? reads : []).map(r => String(r.announcement_id)));
    const n = (Array.isArray(ann) ? ann : []).filter(a => !readIds.has(String(a.announcement_id))).length;
    const dot = document.getElementById('ann-dot');
    if (dot && n > 0) { dot.style.display = 'grid'; dot.textContent = n; }
  } catch(e) {}
}
function pageShell(activeKey) {
  buildNav(activeKey); setTopbar(); refreshNotifDot(); refreshAnnDot();
  // Live refresh sa badges kada 25 seconds
  setInterval(function(){ if(document.visibilityState==='visible'){ refreshNotifDot(); refreshAnnDot(); } }, 60000);
}
