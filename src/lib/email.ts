import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | undefined;

function get_transporter(): nodemailer.Transporter | undefined {
  if (process.env.SMTP_HOST === undefined) return undefined;
  if (transporter === undefined) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth:
        process.env.SMTP_USER === undefined
          ? undefined
          : { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

export async function send_magic_link(email: string, link: string, pin: string) {
  const tx = get_transporter();
  if (tx === undefined) {
    console.log(`\n=== Magic link for ${email} ===\n${link}\nPIN: ${pin}\n=================================\n`);
    return;
  }

  await tx.sendMail({
    from: process.env.EMAIL_FROM || 'Tarok <no-reply@localhost>',
    to: email,
    subject: 'Prijava v Tarok',
    text: `Za prijavo v Tarok odprite povezavo:\n${link}\n\nAli vnesite kodo: ${pin}\n\nPovezava in koda poteceta cez 15 minut. Ce prijave niste zahtevali, to sporocilo prezrite.`,
    html: render_login_email(link, pin),
  });
}

function render_login_email(link: string, pin: string) {
  const font = "font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  return `<!DOCTYPE html>
<html lang="sl">
<body style="margin:0;padding:0;background-color:#f1f5f9;${font}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <tr>
          <td style="background-color:#242c46;padding:20px 32px">
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Tarok</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <h1 style="margin:0 0 8px;font-size:18px;color:#1e293b;font-weight:700">Prijava v Tarok</h1>
            <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#475569">Kliknite spodnji gumb za prijavo ali na strani za prijavo vnesite kodo.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
              <tr><td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr><td style="border-radius:8px;background-color:#0fba81">
                    <a href="${link}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px">Prijava</a>
                  </td></tr>
                </table>
              </td></tr>
            </table>
            <p style="margin:0 0 8px;font-size:13px;color:#64748b">Ali vnesite kodo:</p>
            <div style="font-size:30px;font-weight:700;letter-spacing:10px;color:#242c46;text-align:center;background-color:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:16px;font-family:'Courier New',monospace">${pin}</div>
            <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#94a3b8">Povezava in koda potečeta čez 15 minut. Če prijave niste zahtevali, to sporočilo prezrite.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
