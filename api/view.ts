import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

export default async function handler(req: any, res: any) {
  const ADMIN_SECRET = "med2026"; // كلمة السر الخاصة بك
  const { key } = req.query;

  // حماية الصفحة: إذا لم تكن كلمة السر صحيحة، تظهر رسالة بسيطة
  if (key !== ADMIN_SECRET) {
    return res.status(401).send("<h1 style='color:red; text-align:center; margin-top:50px;'>Direct access not allowed.</h1>");
  }

  try {
    const rawData = await redis.lrange('pioneers', 0, -1);
    const data = rawData.map((item: any) => typeof item === 'string' ? JSON.parse(item) : item);

    // تحويل البيانات إلى جدول HTML ليصبح سهل القراءة
    const rows = data.map((u: any) => `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 12px; color: #2c3e50; font-weight: bold;">${u.username}</td>
        <td style="padding: 12px; font-family: monospace; color: ${u.wallet?.startsWith('G') ? 'green' : '#e74c3c'}">
          ${u.wallet}
        </td>
        <td style="padding: 12px; font-size: 0.85em; color: #7f8c8d;">
          ${new Date(u.timestamp).toLocaleString('ar-EG')}
        </td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Admin Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: sans-serif; background: #f4f7f6; padding: 20px; }
          .container { max-width: 900px; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #34495e; color: white; text-align: left; padding: 12px; }
          h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
          .stats { display: flex; gap: 20px; margin-bottom: 20px; }
          .card { background: #ebf5fb; padding: 15px; border-radius: 8px; flex: 1; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>📊 إدارة رواد Pi</h2>
          <div class="stats">
            <div class="card"><b>إجمالي العمليات</b><br>${data.length}</div>
            <div class="card"><b>محافظ حقيقية (G)</b><br>${data.filter((u: any) => u.wallet?.startsWith('G')).length}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Wallet Address</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);

  } catch (error: any) {
    return res.status(500).send("Error loading data: " + error.message);
  }
}
