# AI Trading Bot - Client User Manual

## 🚀 Getting Started

Welcome to your AI Trading Bot! This bot provides professional-grade trading signals using advanced machine learning and connects directly to your MetaTrader 5 account.

### 📋 What You Need

1. **Active Subscription** - Choose from Basic, Premium, or Enterprise
2. **VPS (Windows Server)** - For 24/7 operation 
3. **MetaTrader 5 Account** - Your broker account
4. **Internet Connection** - For real-time data

---

## 💰 Subscription Plans

### 🥉 BASIC - €29/month
- 1 VPS configuration
- 1 MT5 account
- Basic AI signals
- Standard support
- Basic analytics

### 🥈 PREMIUM - €79/month
- 3 VPS configurations
- 3 MT5 accounts
- Advanced AI signals
- Priority support
- Risk management tools
- Strategy backtesting

### 🥇 ENTERPRISE - €199/month
- Unlimited VPS configurations
- Unlimited MT5 accounts
- Premium AI signals
- 24/7 dedicated support
- Custom strategies
- Portfolio management
- White-label options

---

## 🔧 Initial Setup

### Step 1: Check Your Subscription
```
/subscription
```
This shows your current plan, features, and expiry date.

### Step 2: Set Up Your VPS
```
/vps_setup
```
Follow the guided wizard to connect your VPS and MT5 account:

1. **Choose VPS Provider** (Contabo, Vultr, DigitalOcean, etc.)
2. **Enter VPS Details** (IP address, username, password)
3. **Provide MT5 Account** (login, password, server)
4. **Confirm Setup** - The bot will automatically configure everything

### Step 3: Test Your Setup
```
/status
```
Verify that your VPS and MT5 are connected properly.

---

## 📈 Trading Commands

### Basic Analysis
```
/predict BTCUSD    # Analyze Bitcoin
/predict EURUSD    # Analyze Euro
/predict           # Default BTCUSD analysis
```

### Strategy-Specific Analysis

#### ⚡ Scalping (1-15 minutes)
```
/scalping BTCUSD   # Quick Bitcoin trades
/scalping EURUSD   # Euro scalping
/scalping XAUUSD   # Gold scalping
```
**Best for:** Traders who can monitor actively

#### 📈 Intraday (1-8 hours)
```
/intraday EURUSD   # Day trading Euro
/intraday GBPUSD   # Pound day trading
/intraday CRUDE    # Oil day trading
```
**Best for:** Part-time traders

#### 🎯 Swing (1-7 days)
```
/swing BTCUSD      # Bitcoin swing
/swing XAUUSD      # Gold swing
/swing CRUDE       # Oil swing
```
**Best for:** Busy professionals

### Execute Trades
```
/execute BTC-001 0.1           # Execute with 0.1 lots
/execute EUR-002 0.05 SCALPING # Execute scalping trade
```

---

## 🖥️ VPS Management

### Main VPS Dashboard
```
/vps
```
Shows your VPS status and available actions.

### Check VPS Status
```
/vps_status
```
Detailed VPS system information:
- CPU, Memory, Disk usage
- MT5 connection status
- Active trades
- Last signals

### Restart Trading Bot
```
/vps_restart
```
Restarts the trading bot on your VPS if needed.

### View VPS Logs
```
/vps_logs
```
Shows recent VPS activity logs for troubleshooting.

---

## 📊 Monitoring & Analytics

### Performance Stats
```
/performance
```
Shows your trading performance:
- Win rate
- Profit factor
- Best/worst trades
- Average profits/losses

### System Status
```
/status
```
Check if all systems are operational:
- AI engine status
- MT5 connection
- Data feeds
- Account info

### Available Features
```
/features
```
Lists all features available in your subscription plan.

---

## 📖 Understanding Signals

### Signal Components

**Trade ID:** Unique identifier for the trade
**Direction:** LONG (buy) or SHORT (sell)
**Entry Price:** Where to enter the trade
**Take Profit:** Where to close for profit
**Stop Loss:** Where to close to limit loss
**Confidence:** AI confidence percentage (60-95%)
**Risk/Reward:** Ratio of potential loss to gain

### Confidence Levels

- **90-95%:** Very strong signal ⭐⭐⭐
- **80-89%:** Strong signal ⭐⭐
- **70-79%:** Medium signal ⭐
- **60-69%:** Weak signal ⚠️

### Risk Management

**Never risk more than 2% of your account per trade**

Example with $10,000 account:
- Maximum risk per trade: $200
- If stop loss is 50 pips on EURUSD: Use 0.4 lots max

---

## 🆘 Support & Help

### Get Help
```
/support
```
Shows all support options and your user ID.

### Upgrade Your Plan
```
/upgrade
```
See upgrade options and special offers.

### Quick Help
```
/help
```
Complete command reference.

### Contact Support

- **Bot Support:** @your_support_bot
- **Email:** support@yourdomain.com
- **Telegram Channel:** @your_support_channel

**Always include your User ID when contacting support**

---

## ⚠️ Important Warnings

### Risk Management
- Never trade money you can't afford to lose
- Always use stop losses
- Don't risk more than 2% per trade
- Diversify across multiple symbols

### Technical Requirements
- Keep your VPS running 24/7
- Don't close MetaTrader 5
- Don't close the Python bridge server
- Monitor your internet connection

### Subscription Limits
- Basic: 1 VPS, 1 MT5 account
- Premium: 3 VPS, 3 MT5 accounts  
- Enterprise: Unlimited

---

## 🔄 Workflow Example

### Daily Trading Routine

1. **Morning Check**
   ```
   /status        # Check system health
   /performance   # Review yesterday's trades
   ```

2. **Get Signals**
   ```
   /predict EURUSD    # Main currency pair
   /predict BTCUSD    # Crypto opportunity
   /scalping XAUUSD   # Quick gold trade
   ```

3. **Execute Trades**
   ```
   /execute EUR-001 0.1    # Execute Euro signal
   ```

4. **Monitor**
   ```
   /vps_status    # Check VPS health
   /performance   # Track results
   ```

### Weekly Maintenance

1. **Check Subscription**
   ```
   /subscription
   ```

2. **VPS Health Check**
   ```
   /vps_status
   /vps_logs
   ```

3. **Performance Review**
   ```
   /performance
   ```

---

## 🎯 Pro Tips

### For Scalpers
- Use during London/NY overlap (8-12 EST)
- Monitor trades actively
- Take profits quickly
- Use tight stop losses

### For Intraday Traders
- Check news events before trading
- Close before major announcements
- Use medium-sized positions
- Monitor 2-3 times per day

### For Swing Traders
- Focus on weekly trends
- Use larger stop losses
- Check daily, don't overtrade
- Be patient with positions

### Advanced Users
- Combine multiple timeframes
- Use correlation analysis
- Consider fundamental events
- Maintain trading journal

---

## 📞 Troubleshooting

### Common Issues

**❌ "No active subscription"**
- Contact support to activate your plan
- Check payment status

**❌ "VPS connection failed"**
- Check VPS is running
- Verify credentials
- Check firewall settings

**❌ "MT5 not connected"**
- Ensure MT5 is running
- Check login credentials
- Verify server settings

**❌ "Signal execution failed"**
- Check account balance
- Verify symbol is available
- Check market hours

### Getting Help

1. **Use built-in commands first:**
   ```
   /status
   /vps_status
   /features
   ```

2. **Check your subscription:**
   ```
   /subscription
   ```

3. **Contact support with:**
   - Your User ID
   - Description of the problem
   - Screenshots if possible
   - Error messages

---

## 🎉 Success Stories

*"I've been using the Premium plan for 3 months. The VPS setup was incredibly easy, and the signals are highly accurate. Made 15% profit last month!"* - Marco T.

*"Enterprise plan user here. The unlimited VPS configurations let me run multiple strategies simultaneously. Excellent ROI!"* - Sofia R.

*"Started with Basic plan to test. Upgraded to Premium after seeing 70% win rate. The risk management tools are game-changers!"* - Ahmed K.

---

Ready to start profitable trading? Use `/vps_setup` to begin! 🚀📈