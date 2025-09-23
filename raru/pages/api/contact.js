import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { type, talent, lastName, firstName, company, email, phone, url, message } = req.body;

    // 環境変数から認証情報を取得
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
      console.error('Gmail credentials are not set in environment variables.');
      return res.status(500).json({ error: 'Server configuration error.' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: pass,
      },
    });

    const mailOptions = {
      from: email,
      to: 'raru.info.official@gmail.com',
      subject: `【お問い合わせ】${type} - ${lastName} ${firstName}様`,
      html: `
        <h2>お問い合わせ内容</h2>
        <p><strong>お問い合わせ種別:</strong> ${type}</p>
        <p><strong>希望タレント:</strong> ${talent}</p>
        <p><strong>お名前:</strong> ${lastName} ${firstName}</p>
        <p><strong>会社名・団体名:</strong> ${company || '未入力'}</p>
        <p><strong>メールアドレス:</strong> ${email}</p>
        <p><strong>電話番号:</strong> ${phone}</p>
        <p><strong>サイトURL:</strong> ${url || '未入力'}</p>
        <hr>
        <h3>お問合せ内容</h3>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Error sending email' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}