import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

export async function sendPriceAlert({ to, productTitle, targetPrice, currentPrice, productUrl }) {
  const subject = `🎉 Price Drop Alert: ${productTitle?.slice(0, 50)}`;
  const html = `
    <div style="font-family: 'Courier New', monospace; background: #0a0a0f; color: white; padding: 32px; border-radius: 12px; max-width: 520px;">
      <div style="display: flex; align-items: center; gap: 10; margin-bottom: 24px;">
        <span style="font-size: 24px;">🛍</span>
        <h1 style="color: #6ee7b7; font-size: 20px; margin: 0;">BuyWise Alert</h1>
      </div>
      <p style="color: rgba(255,255,255,0.6); font-size: 13px; margin-bottom: 20px;">Good news! A product on your watchlist hit your target price.</p>
      <div style="background: #13131a; border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 20px; margin-bottom: 20px;">
        <p style="color: white; font-size: 14px; font-weight: 600; margin: 0 0 12px;">${productTitle}</p>
        <div style="display: flex; gap: 16px;">
          <div>
            <p style="color: rgba(255,255,255,0.4); font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 4px;">Your Target</p>
            <p style="color: #6ee7b7; font-size: 20px; font-weight: 700; margin: 0;">₹${Number(targetPrice).toLocaleString("en-IN")}</p>
          </div>
          <div>
            <p style="color: rgba(255,255,255,0.4); font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 4px;">Current Price</p>
            <p style="color: white; font-size: 20px; font-weight: 700; margin: 0;">₹${Number(currentPrice).toLocaleString("en-IN")}</p>
          </div>
        </div>
      </div>
      <a href="${productUrl}" style="display: inline-block; background: #6ee7b7; color: #0a0a0f; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 13px;">View Product →</a>
      <p style="color: rgba(255,255,255,0.25); font-size: 11px; margin-top: 24px;">You're receiving this because you set a price alert on BuyWise. <a href="#" style="color: rgba(110,231,183,0.5);">Unsubscribe</a></p>
    </div>
  `;
  await transporter.sendMail({ from: `BuyWise <${process.env.EMAIL_USER}>`, to, subject, html });
}