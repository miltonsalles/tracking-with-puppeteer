const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000;

app.get('/get-client-id', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      devtools: true,
      defaultViewport: {
        width: 1280,
        height: 1024,
      },
      headless: false,
    });
    const page = await browser.newPage();

    const html = 'https://vertice-ds.s3.us-east-1.amazonaws.com/endpoint-ga/index.html';

    await page.goto(html, {
      waitUntil: "domcontentloaded",
    });

    console.log('Aguardando o carregamento do gtag.js e a alteração do clientId...');
    await page.waitForSelector('script[src*="gtag/js"]'); // Aguarda o carregamento do gtag.js
    await page.waitForFunction(
      'document.getElementById("clientId").innerText !== "Carregando..."',
      { timeout: 60000 }
    );

    const clientId = await page.evaluate(() => {
      const clientIdElement = document.getElementById('clientId');
      const parsedResponse = JSON.parse(clientIdElement.innerText);
      return parsedResponse.clientId;
    });

    await browser.close();

    res.json({ clientId });
  } catch (error) {
    console.error('Erro ao obter o clientId:', error);
    res.status(500).json({ error: 'Erro ao obter o clientId' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
