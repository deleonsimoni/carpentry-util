const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = {
  enviarEmail
};

async function enviarEmail(email, assunto, corpo) {
  try {
    const msg = {
      to: email,
      from: {
        email: 'no-reply@carpentrygo.ca', // remetente validado no SendGrid
        name: 'CarpentryGo'
      },
      subject: assunto,
      html: corpo,
      text: corpo.replace(/<[^>]+>/g, ""), // fallback texto puro
    };

    const [response] = await sgMail.send(msg);

    // status 202 = aceito para envio
    return response.statusCode === 202;
  } catch (err) {
    console.error("Erro ao enviar e-mail:", err.response?.body || err.message);
    return false;
  }
}

