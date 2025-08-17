# Trading Bot Workflow Test Guide

## New User Experience

### 1. First Time User `/start` Command
When a new user sends `/start`, they should see:

**Expected Response:**
```
🎯 Welcome to Professional AI Trading Bot!

Let's set up your trading preferences to get started.

Step 1: Choose Your Trading Mode

🎯 Available Trading Modes:

⚡ 1. Scalping
• Timeframe: 1m, 5m
• Risk/Reward: 1:1.5
• Max Hold: 0.25h
• Min Confidence: 85%

📈 2. Intraday
• Timeframe: 5m, 15m, 30m
• Risk/Reward: 1:2
• Max Hold: 8h
• Min Confidence: 75%

🎯 3. Swing Trading
• Timeframe: 30m, 1h, 4h
• Risk/Reward: 1:3
• Max Hold: 168h
• Min Confidence: 70%

🤔 Which trading style fits you best?

Select a mode below to see detailed information and continue setup:
```

**Inline Keyboard:**
- ⚡ Scalping | 📈 Intraday | 🎯 Swing
- ❓ Help Me Choose

### 2. Mode Selection (e.g., user clicks "📈 Intraday")
**Expected Response:**
```
✅ INTRADAY Trading Mode Selected!

**Intraday** (INTRADAY)
📊 Description: Day trading capturing medium price movements (1-8 hours)
⏱️ Timeframe: 5m, 15m, 30m
🎯 Risk/Reward: 1:2
🛡️ Stop Loss: 1x ATR
💰 Take Profit: 2x ATR
⏰ Max Hold: 8h
✅ Min Confidence: 75%
📈 Max Position: 1 lots

Step 2: Risk Management Setup

Now let's configure your risk management settings.

💰 How much do you want to risk per trade?

Please enter your risk percentage (recommended: 1-3%):
• Conservative: 1%
• Balanced: 2% 
• Aggressive: 3%

Type a number like: 2 (for 2%)
```

### 3. Risk Percentage Input (user types "2")
**Expected Response:**
```
✅ Risk Management Set: 2%

Step 3: Account Balance (Optional)

To provide accurate position sizing recommendations, please enter your account balance.

💰 What's your account balance?

Examples:
• 1000 (for $1,000)
• 5000 (for $5,000)
• skip (to set this later)

This helps calculate optimal lot sizes for your trades.
```

### 4. Account Balance Input (user types "5000")
**Expected Response:**
```
🎉 Setup Complete!

Your trading preferences have been saved:

**Intraday** (INTRADAY)
📊 Description: Day trading capturing medium price movements (1-8 hours)
⏱️ Timeframe: 5m, 15m, 30m
🎯 Risk/Reward: 1:2
🛡️ Stop Loss: 1x ATR
💰 Take Profit: 2x ATR
⏰ Max Hold: 8h
✅ Min Confidence: 75%
📈 Max Position: 1 lots

💰 Your Settings:
• Risk per trade: 2%
• Account balance: $5,000
• Account currency: USD

🚀 You're ready to trade!

Try these commands:
• /predict BTCUSD - Get a signal using your preferred mode
• /intraday EURUSD - Get a specific strategy signal
• /settings - Change your preferences anytime

Let's start with your first signal! 🎯
```

**Inline Keyboard:**
- 📈 Get INTRADAY Signal
- 📊 View All Strategies | ⚙️ Settings
- 🖥️ Setup VPS | ❓ Help

### 5. Returning User `/start` Command
When a user with existing preferences sends `/start`, they should see:

**Expected Response:**
```
🤖 Welcome back to Professional AI Trading Bot

You're all set up with INTRADAY trading mode!

**Intraday** (INTRADAY)
📊 Description: Day trading capturing medium price movements (1-8 hours)
⏱️ Timeframe: 5m, 15m, 30m
🎯 Risk/Reward: 1:2
🛡️ Stop Loss: 1x ATR
💰 Take Profit: 2x ATR
⏰ Max Hold: 8h
✅ Min Confidence: 75%
📈 Max Position: 1 lots

💰 Current Settings:
• Risk per trade: 2%
• Account balance: $5,000
• Account currency: USD

🚀 Ready to Trade:
• Use /predict SYMBOL for analysis with your preferred mode
• Use /scalping SYMBOL, /intraday SYMBOL, or /swing SYMBOL for specific strategies
• Use /settings to change your trading preferences

💡 Quick Start: Try /intraday BTCUSD for a signal!
```

## Key Features Implemented

### ✅ Trading Mode Selection at Start
- New users are guided through mode selection
- Each mode displays English terms: Scalping, Intraday, Swing
- Detailed SL/TP information shown for each mode

### ✅ Stop Loss and Take Profit Display
- SL/TP values extracted from existing trading strategies configuration
- Displayed as multipliers (e.g., "1x ATR", "2x ATR")
- Clear risk/reward ratios shown (e.g., "1:2")

### ✅ Risk Management
- Users specify risk percentage per trade
- Optional account balance input for better position sizing
- Personalized lot size recommendations in trading signals

### ✅ User State Management
- Database storage of user preferences
- Intelligent detection of new vs returning users
- Interactive state-based workflow

### ✅ Enhanced Trading Signals
- Signals now include personalized position sizing
- Account balance and risk percentage integration
- Custom recommendations based on user settings

## Commands

### New Commands:
- `/settings` - View and manage trading preferences

### Enhanced Commands:
- `/start` - Now includes setup workflow for new users
- `/predict SYMBOL` - Uses user's preferred trading mode if set
- All strategy commands now consider user risk preferences

## Database Schema

### New Tables:
- `user_preferences` - Stores trading mode, risk %, account balance
- `user_states` - Manages interactive workflow states

### Enhanced Integration:
- Trading signals consider user preferences for position sizing
- Performance tracking remains unchanged and functional