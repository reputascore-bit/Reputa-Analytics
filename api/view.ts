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
        
        const isExternal = !p.username || p.username === 'Anonymous';
        const username = isExternal ? '🌐 External User / Browser' : p.username;
        
        const isVipSignal = p.wallet === "UPGRADED_TO_VIP" || p.wallet === "VIP_PAYMENT_CONFIRMED";

        if (!pioneerMap.has(username)) {
          pioneerMap.set(username, { 
            username, 
            wallets: new Set(p.wallet && !isVipSignal ? [p.wallet] : []), 
            timestamps: [p.timestamp], 
            count: 1,
            isExternal: isExternal,
            isVip: isVipSignal
          });
        } else {
          const existing = pioneerMap.get(username);
          existing.count += 1;
          existing.timestamps.push(p.timestamp);
          if (isVipSignal) existing.isVip = true;
          if (p.wallet && !isVipSignal) existing.wallets.add(p.wallet);
          existing.timestamps.sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime());
        }
      } catch (e) {}
    });

    const allPioneers = Array.from(pioneerMap.values()).sort((a: any, b: any) => new Date(b.timestamps[0]).getTime() - new Date(a.timestamps[0]).getTime());
    const totalItems = allPioneers.length;
    const totalVip = allPioneers.filter(u => u.isVip).length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const paginatedPioneers = allPioneers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const rows = paginatedPioneers.map((u: any) => {
      const walletArray = Array.from(u.wallets);
      const primaryWallet = walletArray.find((w: any) => w.startsWith('G')) || walletArray[0] || (u.isExternal ? '⚠️ External Link' : 'N/A');
      
      const walletsJson = JSON.stringify(walletArray).replace(/'/g, "\\'");
      const timesJson = JSON.stringify(u.timestamps.map((t:any) => new Date(t).toLocaleString())).replace(/'/g, "\\'");

      const rowStyle = u.isVip ? 'background-color: #fffbeb; border-left: 4px solid #f59e0b;' : u.isExternal ? 'background-color: #fff8f8;' : '';

      return `
      <tr style="${rowStyle}">
        <td class="user-cell">
            <div class="user-info">
              <span class="name" style="${u.isExternal ? 'color: #ef4444;' : ''}">
                ${u.username}
                ${u.isVip ? '<span class="vip-tag">⭐ VIP</span>' : ''}
              </span>
              <span class="visit-badge" onclick='showModal("${u.username}", ${walletsJson}, ${timesJson})'>${u.count}x Visits</span>
            </div>
        </td>
        <td class="wallet-cell">
          <span class="status-dot ${primaryWallet.startsWith('G') ? 'active' : 'inactive'}"></span>
          <code>${primaryWallet}</code>
          ${walletArray.length > 1 ? `<span class="multi-tag" style="font-size: 10px; color: #6366f1; cursor: pointer; font-weight: bold; margin-left: 5px;" onclick='showModal("${u.username}", ${walletsJson}, ${timesJson})'>+${walletArray.length - 1} More</span>` : ''}
        </td>
        <td class="date-cell">
          <div class="last-seen">${new Date(u.timestamps[0]).toLocaleString()}</div>
        </td>
      </tr>
    `}).join('');

    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pioneer Admin Console</title>
        <style>
          :root { --bg: #f8fafc; --primary: #0f172a; --accent: #38bdf8; --border: #e2e8f0; --gold: #f59e0b; }
          body { font-family: 'Inter', sans-serif; background: var(--bg); margin: 0; padding: 20px; }
          .container { max-width: 1240px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: var(--primary); padding: 25px; border-radius: 16px; color: white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
          .stats-group { display: flex; gap: 30px; }
          .grid-layout { display: grid; grid-template-columns: 1fr 320px; gap: 20px; }
          @media (max-width: 900px) { .grid-layout { grid-template-columns: 1fr; } }
          .table-wrapper { background: white; border-radius: 12px; border: 1px solid var(--border); overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f1f5f9; padding: 14px 20px; text-align: left; font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; }
          td { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          .vip-tag { background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 900; margin-left: 8px; border: 1px solid #fde68a; }
          .user-info .name { font-weight: 700; color: var(--primary); display: flex; align-items: center; }
          .visit-badge { font-size: 10px; color: #6366f1; background: #eef2ff; padding: 2px 8px; border-radius: 6px; cursor: pointer; font-weight: 800; margin-top: 4px; display: inline-block; }
          .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }
          .active { background: #10b981; } .inactive { background: #cbd5e1; }
          code { background: #f8fafc; padding: 4px 8px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 11px; color: #334155; }
          .feedback-panel { background: white; border-radius: 12px; border: 1px solid var(--border); padding: 20px; align-self: start; }
          .pagination { margin-top: 25px; text-align: center; }
          .pg-btn { padding: 10px 18px; background: white; border: 1px solid var(--border); border-radius: 8px; text-decoration: none; color: var(--primary); font-size: 12px; font-weight: 600; }
          
          /* التعديل الجوهري للنافذة المنبثقة */
          #modal { 
            display: none; 
            position: fixed; 
            top:0; left:0; 
            width:100%; height:100%; 
            background: rgba(15, 23, 42, 0.85); 
            z-index: 9999; 
            justify-content: center; 
            align-items: center; 
            backdrop-filter: blur(5px);
            padding: 15px;
            box-sizing: border-box;
          }
          .modal-content { 
            background: white; 
            width: 100%; 
            max-width: 500px; 
            max-height: 85vh;
            border-radius: 24px; 
            padding: 0; 
            position: relative; 
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); 
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          .modal-header { padding: 20px 25px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
          .modal-body { padding: 25px; overflow-y: auto; flex: 1; }
        </style>
      </head>
      <body>
        <div class="container">
          <header class="header">
            <h1 style="margin:0; font-size: 22px; letter-spacing: -0.02em;">🛡️ Pioneer <span style="color:var(--accent)">Intelligence</span></h1>
            <div class="stats-group">
                <div style="text-align:right">
                    <div style="font-size:10px; opacity:0.6; font-weight:800; text-transform:uppercase">Registered</div>
                    <div style="font-size:22px; font-weight:900">${totalItems}</div>
                </div>
                <div style="text-align:right; border-left: 1px solid rgba(255,255,255,0.1); padding-left: 20px;">
                    <div style="font-size:10px; color:var(--gold); font-weight:800; text-transform:uppercase">VIP Members</div>
                    <div style="font-size:22px; font-weight:900; color:var(--gold);">${totalVip}</div>
                </div>
            </div>
          </header>

          <div class="grid-layout">
            <div class="main-content">
              <div class="table-wrapper">
                <table>
                  <thead><tr><th>Pioneer Identity</th><th>Wallet Source</th><th>Activity Timeline</th></tr></thead>
                  <tbody>${rows}</tbody>
                </table>
              </div>
              <div class="pagination">
                  ${currentPage > 1 ? `<a href="?password=${password}&page=${currentPage - 1}" class="pg-btn">← Previous</a>` : ''}
                  <span class="pg-btn" style="background:var(--primary); color:white; border:none;">Page ${currentPage} of ${totalPages}</span>
                  ${currentPage < totalPages ? `<a href="?password=${password}&page=${currentPage + 1}" class="pg-btn">Next →</a>` : ''}
              </div>
            </div>

            <div class="feedback-panel">
              <h3 style="margin-top:0; font-size: 13px; color: #64748b; border-bottom: 2px solid var(--accent); padding-bottom: 12px; letter-spacing: 0.05em;">LATEST FEEDBACK</h3>
              ${rawFeedbacks.reverse().slice(0, 15).map((f: any) => {
                const data = typeof f === 'string' ? JSON.parse(f) : f;
                return `<div style="font-size:12px; padding:12px 0; border-bottom:1px solid #f1f5f9;">
                          <b style="color:var(--primary)">@${data.username}:</b> 
                          <span style="color:#475569">${data.text}</span>
                        </div>`;
              }).join('')}
            </div>
          </div>
        </div>

        <div id="modal" onclick="closeModal()">
          <div class="modal-content" onclick="event.stopPropagation()">
            <div class="modal-header">
                <h3 id="modalTitle" style="margin:0; font-size: 18px; color: var(--primary);"></h3>
                <span style="cursor:pointer; font-size:24px; color: #94a3b8;" onclick="closeModal()">✕</span>
            </div>
            <div id="modalBody" class="modal-body"></div>
          </div>
        </div>

        <script>
          function showModal(username, wallets, times) {
            const modal = document.getElementById('modal');
            const body = document.getElementById('modalBody');
            document.getElementById('modalTitle').innerText = username;
            
            let html = '<h4 style="font-size:11px; color:#64748b; text-transform:uppercase; margin-top:0; margin-bottom:15px;">Wallets Linked</h4>';
            
            if (wallets && wallets.length > 0) {
              wallets.forEach(w => {
                html += \`<div style="background:#f8fafc; padding:12px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:12px;">
                            <div style="word-break:break-all; font-family:monospace; font-size:12px; color:#334155; margin-bottom:10px;">\${w}</div>
                            <button onclick="copyAction('\${w}')" style="width:100%; background:white; border:1px solid #cbd5e1; padding:8px; border-radius:8px; font-size:10px; font-weight:bold; cursor:pointer; color:#6366f1;">COPY WALLET</button>
                          </div>\`;
              });
            } else {
              html += '<p style="font-size:12px; color:#94a3b8;">No wallets found.</p>';
            }

            html += '<h4 style="font-size:11px; color:#64748b; text-transform:uppercase; margin-top:25px; margin-bottom:15px;">Access Log</h4>';
            times.forEach(t => { 
              html += \`<div style="font-size:11px; color:#64748b; padding:10px 0; border-bottom:1px solid #f1f5f9; display:flex; align-items:center;">
                         <span style="color:#10b981; margin-right:10px;">•</span> \${t}
                       </div>\`; 
            });

            body.innerHTML = html;
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
          }

          function closeModal() { 
            document.getElementById('modal').style.display = 'none'; 
            document.body.style.overflow = 'auto';
          }

          function copyAction(text) {
            const el = document.createElement('textarea');
            el.value = text;
            document.body.appendChild(el);
            el.select();
            try {
              document.execCommand('copy');
              alert('Wallet copied to clipboard!');
            } catch (err) {
              console.error('Copy failed');
            }
            document.body.removeChild(el);
          }

          window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
          });
        </script>
      </body>
      </html>
    `);
  } catch (error: any) {
    return res.status(500).send("Admin Sync Error: " + error.message);
  }
}
