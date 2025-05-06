const API_KEY = 'd0cbmqpr01ql2j3c4fh0d0cbmqpr01ql2j3c4fhg';
let SYMBOL = document.getElementById('pair').value;
let timeframe = document.getElementById('timeframe').value;
const candleInterval = 60; // Default 1 menit

const chart = LightweightCharts.createChart(document.getElementById('chart'), {
  layout: { background: { color: '#121212' }, textColor: '#ffffff' },
  grid: { vertLines: { color: '#2B2B43' }, horzLines: { color: '#2B2B43' } },
  timeScale: { timeVisible: true, secondsVisible: false }
});
const candleSeries = chart.addCandlestickSeries();

let currentCandle = null;
let ws;

function connectWS() {
  if (ws) ws.close();
  ws = new WebSocket(`wss://ws.finnhub.io?token=${API_KEY}`);
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'subscribe', symbol: SYMBOL }));
  };
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'trade') {
      const trade = data.data[0];
      const timestamp = Math.floor(trade.t / 1000);
      const candleTime = timestamp - (timestamp % candleInterval);
      const price = trade.p;

      if (!currentCandle || currentCandle.time !== candleTime) {
        if (currentCandle) candleSeries.update(currentCandle);
        currentCandle = { time: candleTime, open: price, high: price, low: price, close: price };
      } else {
        currentCandle.high = Math.max(currentCandle.high, price);
        currentCandle.low = Math.min(currentCandle.low, price);
        currentCandle.close = price;
      }

      candleSeries.update(currentCandle);
      document.getElementById("price").textContent = `Harga: ${price}`;
    }
  };
}

async function fetchMACD() {
  const url = `https://finnhub.io/api/v1/indicator?symbol=${SYMBOL}&resolution=${timeframe}&indicator=macd&token=${API_KEY}`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    console.log("MACD Response: ", json);  // Log untuk memastikan respons dari API

    if (json.macd && json.macd.length > 0) {
      const macd = json.macd[json.macd.length - 1].toFixed(2);
      document.getElementById("macd").textContent = `MACD: ${macd}`;
    } else {
      document.getElementById("macd").textContent = `MACD: Data tidak tersedia`;
    }
  } catch (error) {
    console.error("Error fetching MACD data: ", error);
    document.getElementById("macd").textContent = `MACD: Data tidak tersedia`;
  }
}

async function fetchSentiment() {
  const url = `https://finnhub.io/api/v1/news-sentiment?symbol=${SYMBOL}&token=${API_KEY}`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    console.log("Sentiment Response: ", json);  // Log untuk memastikan respons dari API

    if (json.sentiment) {
      const sentiment = json.sentiment.companyNewsSentiment;
      const sentimentLabel = sentiment > 0 ? 'Positif' : (sentiment < 0 ? 'Negatif' : 'Netral');
      document.getElementById("sentiment").textContent = `Sentimen: ${sentimentLabel}`;
    } else {
      document.getElementById("sentiment").textContent = `Sentimen: Data tidak tersedia`;
    }
  } catch (error) {
    console.error("Error fetching Sentiment data: ", error);
    document.getElementById("sentiment").textContent = `Sentimen: Data tidak tersedia`;
  }
}

async function fetchNews() {
  const today = new Date().toISOString().split('T')[0];
  const url = `https://finnhub.io/api/v1/company-news?symbol=${SYMBOL}&from=2024-01-01&to=${today}&token=${API_KEY}`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    console.log("News Response: ", json);  // Log untuk memastikan respons dari API

    if (json.length) {
      document.getElementById("news").textContent = `Berita: ${json[0].headline}`;
    } else {
      document.getElementById("news").textContent = `Berita: Tidak ada berita terbaru`;
    }
  } catch (error) {
    console.error("Error fetching News data: ", error);
    document.getElementById("news").textContent = `Berita: Tidak ada berita terbaru`;
  }
}

function refreshData() {
  fetchMACD();
  fetchSentiment();
  fetchNews();
}

document.getElementById("pair").addEventListener("change", () => {
  SYMBOL = document.getElementById("pair").value;
  currentCandle = null;
  candleSeries.setData([]);
  connectWS();
  refreshData();
});

document.getElementById("timeframe").addEventListener("change", () => {
  timeframe = document.getElementById("timeframe").value;
  currentCandle = null;
  candleSeries.setData([]);
  connectWS();
  refreshData();
});

connectWS();
refreshData();
setInterval(refreshData, 60000);