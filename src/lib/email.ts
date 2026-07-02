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
    html: `<p>Za prijavo v Tarok kliknite <a href="${link}">to povezavo</a> ali na strani za prijavo vnesite kodo:</p><p style="font-size:1.5em;font-weight:bold;letter-spacing:0.2em">${pin}</p><p>Povezava in koda poteceta čez 15 minut. Če prijave niste zahtevali, to sporočilo prezrite.</p>`,
  });
}
