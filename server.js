const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

async function getClientId(trackingId) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.setContent(`
      <html>
        <head>
          <script async src="https://www.googletagmanager.com/gtag/js?id=${trackingId}"></script>
          <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${trackingId}', { send_page_view: false });
          </script>
        </head>
        <body>
          <h1>Testando o gtag.js com ${trackingId}</h1>
        </body>
      </html>
    `);

    await page.waitForTimeout(5000);

    const clientId = await page.evaluate((trackingId) => {
      return new Promise((resolve, reject) => {
        if (typeof gtag === 'undefined') {
          return reject('gtag não está definido - o script do GA4 pode não ter carregado.');
        }

        gtag('get', trackingId, 'client_id', (clientId) => {
          if (clientId) {
            resolve(clientId);
          } else {
            reject('Não foi possível obter o clientId');
          }
        });
      });
    }, trackingId); 

    await browser.close();
    return clientId;
  } catch (error) {
    await browser.close();
    throw new Error('Erro ao obter o Client ID');
  }
}

app.get('/clientId', async (req, res) => {
  const trackingId = req.query.trackingId;

  if (!trackingId) {
    return res.status(400).json({ error: 'Parâmetro trackingId é necessário' });
  }

  try {
    const clientId = await getClientId(trackingId);
    res.status(200).json({ clientId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao obter o Client ID' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
