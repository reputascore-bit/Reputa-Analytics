import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

export default async function handler(req: any, res: any) {
  const ADMIN_PASSWORD = "med2026";
  const { password, page = "1" } = req.query; 
  const ITEMS_PER_PAGE = 40;
  const currentPage = parseInt(page);

  if (password !== ADMIN_PASSWORD) {
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Login</title>
        <style>
          body { font-family: 'Inter', sans-serif; background: #0f172a; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; color: #fff; }
          .login-box { background: #1e293b; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); width: 100%; max-width: 380px; text-align: center; border: 1px solid #334155; }
          h2 { margin-bottom: 24px; color: #38bdf8; }
          input { width: 100%; padding: 14px; margin-bottom: 16px; border: 1px solid #334155; border-radius: 8px; background: #0f172a; color: white; outline: none; box-sizing: border-box; }
          button { width: 100%; padding: 14px; background: #38bdf8; color: #0f172a; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="login-box">
          <h2>🛡️ Security Wall</h2>
          <form method="GET">
            <input type="password" name="password" placeholder="Admin Password" required autofocus>
            <button type="submit">Authenticate</button>
          </form>
        </div>
      </body>
      </html>
    `);
  }

  try {
    const rawPioneers = await redis.lrange('pioneers', 0, -1);
    const rawFeedbacks = await redis.lrange('feedbacks', 0, -1);

    const pioneerMap = new Map();
    rawPioneers.forEach((item: any) => {
      try {
        const p = typeof item === 'string' ? JSON.parse(item) : item;
        const username = p.username || 'Anonymous';
        
        if (!pioneerMap.has(username)) {
          pioneerMap.set(username, {
            username: username,
            wallet: p.wallet,
            timestamps: [p.timestamp],
            count: 1
          });
        } else {
          const existing = pioneerMap.get(username);
          existing.count += 1;
          existing.timestamps.push(p.timestamp);
          
          // ✅ الأولوية: إذا كان العنوان الجديد يبدأ بـ G والقديم لا، نحدثه
          if (p.wallet?.startsWith('G') && !existing.wallet?.startsWith('G')) {
            existing.wallet = p.wallet;
          }
          
          // الحفاظ على ترتيب التواريخ (الأحدث أولاً)
          existing.timestamps.sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime());
        }
      } catch (e) {}
    });

    const allPioneers = Array.from(pioneerMap.values()).sort((a: any, b: any) => 
      new Date(b.timestamps[0]).getTime() - new Date(a.timestamps[0]).getTime()
    );

    const feedbacks = rawFeedbacks.map((f: any) => typeof f === 'string' ? JSON.parse(f) : f);

    const totalItems = allPioneers.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedPioneers = allPioneers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const rows = paginatedPioneers.map((u: any) => {
      // إعداد قائمة بالتواريخ السابقة لإظهارها عند الحاجة
      const historyTooltip = u.timestamps.slice(1, 5).map((t: any) => new Date(t).toLocaleString()).join('\\n');
      
      return `
      <tr>
        <td class="user-cell">
            <div class="user-info">
              <span class="name">${u.username}</span>
              <span class="visit-badge" title="History:\\n${historyTooltip || 'No previous visits'}">${u.count}x Visits</span>
            </div>
        </td>
        <td class="wallet-cell">
          <span class="status-dot ${u.wallet?.startsWith('G') ? 'active' : 'inactive'}"></span>
          <code>${u.wallet || 'N/A'}</code>
        </td>
        <td class="date-cell">
          <div class="last-seen">Last: ${new Date(u.timestamps[0]).toLocaleString()}</div>
          ${u.count > 1 ? `<div class="first-seen">First: ${new Date(u.timestamps[u.timestamps.length - 1]).toLocaleDateString()}</div>` : ''}
        </td>
      </tr>
    `}).join('');

    const feedbackRows = feedbacks.slice(0, 15).map((f: any) => `
      <div class="feedback-item">
        <strong>@${f.username}:</strong> <span>${f.text}</span>
        <div style="font-size: 10px; color: #94a3b8; margin-top: 5px;">${new Date(f.timestamp).toLocaleString()}</div>
      </div>
    `).join('');

    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Pioneer Admin Console</title>
        <style>
          :root { --bg: #f8fafc; --primary: #0f172a; --accent: #38bdf8; --border: #e2e8f0; }
          body { font-family: 'Inter', sans-serif; background: var(--bg); margin: 0; padding: 20px; }
          .container { max-width: 1240px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: var(--primary); padding: 20px; border-radius: 12px; color: white; }
          
          .grid-layout { display: grid; grid-template-columns: 1fr 320px; gap: 20px; }
          
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
          .stat-card { background: white; padding: 15px; border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
          .stat-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; }
          .stat-value { font-size: 20px; font-weight: 800; }

          .table-wrapper { background: white; border-radius: 12px; border: 1px solid var(--border); overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f1f5f9; padding: 14px 20px; text-align: left; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; }
          td { padding: 14px 20px; border-bottom: 1px solid #f1f5f9; font-size: 13px; vertical-align: middle; }
          
          .user-info { display: flex; flex-direction: column; gap: 4px; }
          .user-info .name { font-weight: 700; color: var(--primary); }
          
          .visit-badge { display: inline-block; width: fit-content; background: #eef2ff; color: #6366f1; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; cursor: help; }
          
          .date-cell .last-seen { font-weight: 600; color: #1e293b; }
          .date-cell .first-seen { font-size: 10px; color: #94a3b8; }

          .feedback-panel { background: white; border-radius: 12px; border: 1px solid var(--border); padding: 20px; height: 80vh; overflow-y: auto; position: sticky; top: 20px; }
          .feedback-item { padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 12px; line-height: 1.5; }
          
          .pagination { margin-top: 25px; display: flex; gap: 8px; align-items: center; justify-content: center; }
          .pg-btn { padding: 10px 20px; background: white; border: 1px solid var(--border); border-radius: 8px; text-decoration: none; color: var(--primary); font-size: 12px; font-weight: 600; transition: 0.2s; }
          .pg-btn:hover { border-color: var(--accent); color: var(--accent); }
          .pg-btn.active { background: var(--primary); border-color: var(--primary); color: white; }
          
          .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }
          .active { background: #10b981; box-shadow: 0 0 6px rgba(16,185,129,0.4); } 
          .inactive { background: #ef4444; }
          code { font-family: 'JetBrains Mono', monospace; color: #475569; background: #f8fafc; padding: 4px 8px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <header class="header">
            <h1 style="margin:0; font-size: 20px; letter-spacing: -0.5px;">🛡️ Reputa Admin Console</h1>
            <div style="font-size: 12px; opacity: 0.8;">Monitoring ${totalItems} Pioneers</div>
          </header>

          <div class="grid-layout">
            <div class="main-content">
              <div class="stats-grid">
                <div class="stat-card"><div class="stat-label">Unique Pioneers</div><div class="stat-value">${totalItems}</div></div>
                <div class="stat-card"><div class="stat-label">Verified Wallet Access</div><div class="stat-value" style="color:#10b981">${allPioneers.filter((u:any) => u.wallet?.startsWith('G')).length}</div></div>
                <div class="stat-card"><div class="stat-label">Feedback Received</div><div class="stat-value" style="color:#6366f1">${feedbacks.length}</div></div>
              </div>

              <div class="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Pioneer & Activity</th><th>Wallet Identity</th><th>Visit Timeline</th></tr>
                  </thead>
                  <tbody>${rows}</tbody>
                </table>
              </div>

              <div class="pagination">
                ${currentPage > 1 ? `<a href="?password=${password}&page=${currentPage - 1}" class="pg-btn">← Previous</a>` : ''}
                <span class="pg-btn active">Page ${currentPage} of ${totalPages}</span>
                ${currentPage < totalPages ? `<a href="?password=${password}&page=${currentPage + 1}" class="pg-btn">Next →</a>` : ''}
              </div>
            </div>

            <div class="feedback-panel">
              <h3 style="margin-top:0; font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 0.1em; border-bottom: 2px solid var(--accent); padding-bottom: 10px;">Pioneer Voice</h3>
              ${feedbackRows || '<p style="color:#94a3b8; font-size:12px; padding:20px 0;">No suggestions recorded yet.</p>'}
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (error: any) {
    return res.status(500).send("Critical Console Error: " + error.message);
  }
}
