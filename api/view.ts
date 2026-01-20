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
    return res.status(200).send(`<html><body style="background:#0f172a;color:white;display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><form method="GET"><input type="password" name="password" placeholder="Password" style="padding:10px;border-radius:5px;border:none;"><button type="submit" style="padding:10px 20px;margin-left:10px;background:#38bdf8;border:none;border-radius:5px;cursor:pointer;">Login</button></form></body></html>`);
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
          pioneerMap.set(username, { username, wallets: new Set(p.wallet ? [p.wallet] : []), timestamps: [p.timestamp], count: 1 });
        } else {
          const existing = pioneerMap.get(username);
          existing.count += 1;
          existing.timestamps.push(p.timestamp);
          if (p.wallet) existing.wallets.add(p.wallet);
          existing.timestamps.sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime());
        }
      } catch (e) {}
    });

    const allPioneers = Array.from(pioneerMap.values()).sort((a: any, b: any) => new Date(b.timestamps[0]).getTime() - new Date(a.timestamps[0]).getTime());
    const totalItems = allPioneers.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const paginatedPioneers = allPioneers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const rows = paginatedPioneers.map((u: any) => {
      const walletArray = Array.from(u.wallets);
      const primaryWallet = walletArray.find((w: any) => w.startsWith('G')) || walletArray[0] || 'N/A';
      
      const walletsData = JSON.stringify(walletArray).replace(/'/g, "&apos;");
      const timesData = JSON.stringify(u.timestamps.map((t:any) => new Date(t).toLocaleString())).replace(/'/g, "&apos;");

      return `
      <tr>
        <td class="user-cell" onclick='openPanel("${u.username}", ${walletsData}, ${timesData})' style="cursor:pointer">
            <div class="user-info">
              <span class="name">${u.username}</span>
              <span class="visit-badge">${u.count}x Visits <small>(Click to view)</small></span>
            </div>
        </td>
        <td class="wallet-cell">
          <span class="status-dot ${primaryWallet.startsWith('G') ? 'active' : 'inactive'}"></span>
          <code>${primaryWallet}</code>
          ${walletArray.length > 1 ? `<span class="multi-tag">+${walletArray.length - 1} more</span>` : ''}
        </td>
        <td class="date-cell">${new Date(u.timestamps[0]).toLocaleString()}</td>
      </tr>`;
    }).join('');

    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Reputa Admin Console</title>
        <style>
          :root { --bg: #f8fafc; --primary: #0f172a; --accent: #38bdf8; --border: #e2e8f0; }
          body { font-family: 'Inter', sans-serif; background: var(--bg); margin: 0; padding: 20px; overflow-x: hidden; }
          .container { max-width: 1240px; margin: 0 auto; transition: margin-right 0.3s; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: var(--primary); padding: 20px; border-radius: 12px; color: white; }
          .table-wrapper { background: white; border-radius: 12px; border: 1px solid var(--border); overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f1f5f9; padding: 14px 20px; text-align: left; font-size: 11px; color: #475569; text-transform: uppercase; }
          td { padding: 14px 20px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          .user-info .name { font-weight: 700; color: #6366f1; text-decoration: underline; }
          .visit-badge { font-size: 10px; color: #64748b; font-weight: 600; }
          .multi-tag { font-size: 10px; color: #ef4444; background: #fee2e2; padding: 2px 6px; border-radius: 4px; font-weight: 800; margin-left: 5px; }
          .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }
          .active { background: #10b981; } .inactive { background: #94a3b8; }
          code { background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-family: monospace; font-size: 12px; }

          /* Right Side Panel */
          #sidePanel { position: fixed; right: -400px; top: 0; width: 380px; height: 100%; background: white; box-shadow: -5px 0 25px rgba(0,0,0,0.1); transition: 0.3s; z-index: 2000; padding: 30px; box-sizing: border-box; overflow-y: auto; }
          #sidePanel.open { right: 0; }
          .panel-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.3); display:none; z-index: 1500; }
          .panel-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--accent); padding-bottom: 15px; margin-bottom: 20px; }
          .close-panel { cursor: pointer; font-size: 24px; font-weight: bold; }
          
          .wallet-card { background: #f8fafc; border: 1px solid var(--border); border-radius: 10px; padding: 12px; margin-bottom: 15px; }
          .wallet-card code { display: block; word-break: break-all; margin-bottom: 10px; background: white; padding: 10px; border: 1px solid #eee; }
          .copy-btn { width: 100%; background: var(--primary); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px; }
          .copy-btn:active { background: var(--accent); }
          .timeline-item { font-size: 12px; color: #64748b; padding: 8px 0; border-bottom: 1px dashed #eee; }
          
          .pagination { margin-top: 25px; text-align: center; }
          .pg-btn { padding: 10px 20px; background: white; border: 1px solid var(--border); border-radius: 8px; text-decoration: none; color: var(--primary); font-size: 12px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="panel-overlay" id="overlay" onclick="closePanel()"></div>
        <div id="sidePanel">
          <div class="panel-header">
            <h2 id="panelTitle" style="margin:0; font-size:18px;">Pioneer Details</h2>
            <span class="close-panel" onclick="closePanel()">&times;</span>
          </div>
          <div id="panelContent"></div>
        </div>

        <div class="container">
          <header class="header">
            <h1 style="margin:0; font-size: 20px;">🛡️ Reputa Admin Terminal</h1>
            <div>Total: ${totalItems}</div>
          </header>

          <div class="table-wrapper">
            <table>
              <thead><tr><th>Pioneer (Click to view)</th><th>Primary Wallet</th><th>Last Seen</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>

          <div class="pagination">
             ${currentPage > 1 ? `<a href="?password=${password}&page=${currentPage - 1}" class="pg-btn">← Previous</a>` : ''}
             <span class="pg-btn" style="background:var(--primary); color:white;">Page ${currentPage}</span>
             ${currentPage < totalPages ? `<a href="?password=${password}&page=${currentPage + 1}" class="pg-btn">Next →</a>` : ''}
          </div>
        </div>

        <script>
          function openPanel(username, wallets, times) {
            const panel = document.getElementById('sidePanel');
            const overlay = document.getElementById('overlay');
            const content = document.getElementById('panelContent');
            document.getElementById('panelTitle').innerText = username;
            
            let html = '<h3 style="font-size:13px; color:#64748b; text-transform:uppercase;">Registered Wallets</h3>';
            wallets.forEach((w, index) => {
              html += \`
                <div class="wallet-card">
                  <code>\${w}</code>
                  <button class="copy-btn" onclick="copyWallet(this, '\${w}')">COPY WALLET ADDRESS</button>
                </div>\`;
            });

            html += '<h3 style="font-size:13px; color:#64748b; text-transform:uppercase; margin-top:30px;">Activity Logs</h3>';
            times.forEach(t => {
              html += \`<div class="timeline-item">🕒 \${t}</div>\`;
            });

            content.innerHTML = html;
            panel.classList.add('open');
            overlay.style.display = 'block';
          }

          function closePanel() {
            document.getElementById('sidePanel').classList.remove('open');
            document.getElementById('overlay').style.display = 'none';
          }

          function copyWallet(btn, text) {
            navigator.clipboard.writeText(text).then(() => {
              const originalText = btn.innerText;
              btn.innerText = '✅ COPIED!';
              btn.style.background = '#10b981';
              setTimeout(() => {
                btn.innerText = originalText;
                btn.style.background = '';
              }, 2000);
            });
          }
        </script>
      </body>
      </html>
    `);
  } catch (error: any) {
    return res.status(500).send("Error: " + error.message);
  }
}
