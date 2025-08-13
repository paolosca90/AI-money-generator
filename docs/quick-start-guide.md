# Quick Start Guide - AI Trading Bot

## 🚀 Get Started in 15 Minutes

This guide will get your AI Trading Bot up and running quickly, even if MT5 is not yet configured.

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ Telegram account
- ✅ Google account (for Gemini AI)
- ✅ Email address (for other APIs)
- ✅ MetaTrader 5 account (demo or live)

## 🔧 Step 1: Configure Essential APIs (5 minutes)

### **1.1 Telegram Bot**
1. Open Telegram and search for `@BotFather`
2. Send `/newbot`
3. Choose name: "My AI Trading Bot"
4. Choose username: "my_ai_trading_bot_[random_number]"
5. **Copy the token** you receive

### **1.2 Google Gemini AI**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. **Copy the API key**

### **1.3 News API (Optional)**
1. Go to [NewsAPI.org](https://newsapi.org/register)
2. Register with your email
3. **Copy the API key** from dashboard

### **1.4 Alpha Vantage (Optional)**
1. Go to [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Enter your email
3. **Copy the API key** from email

## ⚙️ Step 2: Configure Infrastructure (2 minutes)

In the Leap **Infrastructure** tab, add these secrets:

```
# Essential (Required)
TelegramBotToken=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
GeminiApiKey=AIzaSyC_your_gemini_key_here

# Optional (Fallback data sources)
NewsApiKey=your_news_api_key_here
AlphaVantageApiKey=your_alpha_vantage_key_here

# MT5 (Configure later when VPS is ready)
MT5ServerHost=localhost
MT5ServerPort=8080
MT5Login=demo_account_number
MT5Password=demo_password
MT5Server=Demo-Server
```

## 🧪 Step 3: Test the Bot (3 minutes)

### **3.1 Find Your Bot**
1. Open Telegram
2. Search for your bot username
3. Click "Start"

### **3.2 Test Basic Commands**
```
/start          # Welcome message
/help           # Show all commands
/predict BTCUSD # Generate first signal
/status         # Check system status
```

### **3.3 Expected Results**
- ✅ Bot responds to `/start`
- ✅ `/predict BTCUSD` generates a trading signal
- ✅ Signal shows direction, prices, confidence
- ⚠️ MT5 execution will be simulated (until VPS is configured)

## 📊 Step 4: Understanding Your First Signal

When you run `/predict BTCUSD`, you'll get something like:

```
📈 Trading Signal - BTCUSD

🆔 Trade ID: BTC-123456
📈 Direction: LONG
💰 Entry Price: 95,000.50
🎯 Take Profit: 97,500.00
🛡️ Stop Loss: 93,200.00
⚡ Confidence: 85%

📊 Smart Money Analysis:
• Institutional Flow: BUYING
• Volume Profile: ACCUMULATION
• Order Flow: BULLISH

📈 Price Action Analysis:
• Market Structure: BULLISH
• Trend: UPTREND
• Breakout Probability: 78%

👥 Professional Trader Consensus:
• Top Traders: Plan B, Willy Woo
• Consensus: BULLISH
• Risk/Reward: 1:2.5
```

## 🎯 Step 5: Test Signal Execution (2 minutes)

Try executing a simulated trade:

```
/execute BTC-123456 0.01
```

You'll get a response like:
```
✅ Trade Executed Successfully (SIMULATION)

🆔 Trade ID: BTC-123456
📋 Order: #SIM-789012
💰 Lot Size: 0.01
💵 Entry Price: 95,000.50

🎯 This is a simulated execution.
Configure MT5 for real trading!
```

## 🖥️ Step 6: Configure MT5 for Real Trading (Optional)

### **Option A: Local Setup (Testing)**
1. Install MT5 on your computer
2. Open demo account
3. Set `MT5ServerHost=localhost` in Infrastructure
4. Follow [MT5 Setup Guide](./mt5-setup-guide.md)

### **Option B: VPS Setup (Recommended)**
1. Purchase Windows VPS
2. Use `/vps_setup` command in Telegram
3. Follow the automated setup wizard
4. See [VPS Connection Guide](./vps-connection-guide.md)

## 📈 Step 7: Monitor Performance

Use these commands to track your bot:

```
/performance    # View trading statistics
/status         # Check system health
/symbols        # See supported symbols
```

## 🎓 Step 8: Learn Advanced Features

### **Available Symbols**
```
/predict BTCUSD    # Bitcoin
/predict EURUSD    # Euro/Dollar
/predict GBPUSD    # Pound/Dollar
/predict XAUUSD    # Gold
/predict CRUDE     # Oil
```

### **Advanced Commands**
```
/vps              # VPS management
/vps_setup        # Automatic VPS configuration
/vps_status       # Check VPS health
```

## 🚨 Troubleshooting

### **Bot Not Responding**
- Check Telegram token is correct
- Verify bot username is correct
- Try `/start` command

### **"Prediction Failed" Error**
- Check Gemini API key is valid
- Try again in a few minutes
- Check internet connection

### **MT5 Connection Issues**
- See [MT5 Troubleshooting Guide](./mt5-connection-troubleshooting.md)
- Verify VPS is running
- Check firewall settings

## 🎯 Success Metrics

After setup, you should achieve:
- ✅ **Response Time**: < 10 seconds for predictions
- ✅ **Accuracy**: 70%+ win rate (after optimization)
- ✅ **Uptime**: 99%+ (with VPS)
- ✅ **Signals**: 5-20 per day depending on market

## 🔄 Next Steps

1. **Monitor Performance**: Check `/performance` daily
2. **Optimize Settings**: Adjust confidence thresholds
3. **Scale Up**: Add more symbols and increase lot sizes
4. **Learn**: Study successful signals to understand patterns

## 💡 Pro Tips

- **Start Small**: Use 0.01 lot sizes initially
- **Demo First**: Test with demo account before live trading
- **Monitor Closely**: Check performance daily for first week
- **Risk Management**: Never risk more than 2% per trade
- **Stay Updated**: Follow market news and bot updates

## 🆘 Need Help?

- **Documentation**: Check the `/help` command
- **Troubleshooting**: See troubleshooting guides
- **Community**: Join trading communities for tips
- **Support**: Contact support if issues persist

**Congratulations! Your AI Trading Bot is now operational!** 🎉

The bot will work with simulated data until you configure MT5, but you can start learning how it works and testing different symbols right away.
