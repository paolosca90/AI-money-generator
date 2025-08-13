# MT5 Direct Connection Setup Guide

This guide explains how to set up direct MetaTrader 5 integration to use it as the **primary source for real-time market data**, removing the dependency on external APIs like Alpha Vantage for quotes.

## Prerequisites

1. **MetaTrader 5 Terminal** installed on Windows (or Windows VM/VPS)
2. **Python 3.7+** installed
3. **Demo or Live Trading Account** with your broker

## Setup Steps

### 1. Install MetaTrader 5

Download and install MT5 from your broker or from MetaQuotes:
- [MetaTrader 5 Download](https://www.metatrader5.com/en/download)

### 2. Install Python Dependencies

```bash
pip install MetaTrader5 flask flask-cors
```

### 3. Configure MT5 Account

1. Open MetaTrader 5
2. Go to **File → Login to Trade Account**
3. Enter your account credentials:
   - **Login**: Your account number
   - **Password**: Your account password  
   - **Server**: Your broker's server (e.g., "Demo-Server", "Live-Server")
4. Go to **Tools → Options → Expert Advisors**
5. **Enable** the following:
   - ✅ Allow automated trading
   - ✅ Allow DLL imports
   - ✅ Allow WebRequest for listed URL (add `http://localhost:8080`)

### 4. Start the Python Server

1. Save the `mt5-python-server.py` file to your computer
2. Run the server:
```bash
python mt5-python-server.py
```
3. The server will start on `http://localhost:8080` and will be ready to serve real-time and historical market data.

### 5. Configure Leap Secrets

In the Leap Infrastructure tab, add these secrets:

```
# MT5 Connection Settings
MT5ServerHost=localhost # Use 'localhost' for local setup, or your VPS IP for remote
MT5ServerPort=8080
MT5Login=your_mt5_account_number
MT5Password=your_mt5_password
MT5Server=your_broker_server_name

# Fallback API Keys (used if MT5 is unavailable)
GeminiApiKey=your_gemini_key
NewsApiKey=your_news_key
AlphaVantageApiKey=your_alpha_vantage_key
```

### 6. Test the Connection

1. Start your Telegram bot.
2. Send `/status` to check if MT5 is connected.
3. Try generating a signal with `/predict EURUSD`.
4. **Check the logs**: You should see messages like `Successfully fetched MT5 data for EURUSD 5m`. If you see messages about Alpha Vantage or simulated data, it means the connection to the MT5 Python server failed.
5. Execute a test trade with `/execute TRADE_ID 0.01`.

## Broker-Specific Setup

### Popular Brokers

**XM Global**
- Server format: `XMGlobal-Demo` or `XMGlobal-Real`
- Supports most major pairs and metals

**IC Markets**
- Server format: `ICMarkets-Demo` or `ICMarkets-Live01`
- Low spreads, good for scalping

**FXCM**
- Server format: `FXCM-Demo` or `FXCM-Server`
- US-regulated broker

**Exness**
- Server format: `Exness-Demo` or `Exness-Real`
- High leverage available

### Symbol Formats

Different brokers may use different symbol formats (e.g., `EURUSD` vs `EURUSDm`). The Python server uses the standard symbol name. Ensure your broker supports these standard names.

## Troubleshooting

### Common Issues

**1. "MT5 initialization failed"**
- Ensure MT5 is running and logged in.
- Check if automated trading and WebRequest are enabled in MT5 options.
- Restart MT5 and the Python server.

**2. "Failed to get rates from MT5" in logs**
- The symbol might not be available in your MT5 Market Watch. Right-click in Market Watch -> Symbols -> find your symbol and enable it.
- Your broker may not provide historical data for that symbol/timeframe.

**3. "Connection timeout" or network errors**
- Check if the Python server is running on the correct host and port.
- Verify firewall settings on the machine running the Python server are not blocking port 8080.
- Test with `curl http://localhost:8080/status` from the command line.

### Debug Mode

To enable debug logging in the Python server:

```python
# In mt5-python-server.py, change:
app.run(host='0.0.0.0', port=8080, debug=True)
```

## Production Deployment

For production use, a **Windows VPS is highly recommended** to ensure the MT5 terminal and Python server are running 24/7. The `MT5ServerHost` secret should be set to the public IP of your VPS.
