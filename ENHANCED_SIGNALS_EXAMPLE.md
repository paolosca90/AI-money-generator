# Enhanced Trading Signal Example

## Before (Original Signal)
```
📈 INTRADAY Signal - BTCUSD

🆔 Trade ID: BTC-123456
📈 Direction: LONG
💰 Entry Price: 95,000.50
🎯 Take Profit: 95,500.00
🛡️ Stop Loss: 94,750.00
⚡ Confidence: 85%
📊 Risk/Reward: 1:2.0
💎 Recommended Size: 0.1 lots
⏱️ Max Hold Time: 8h

📊 Strategy Analysis:
⚡ INTRADAY SETUP:
• Hold for 1-8 hours maximum
• Balanced risk/reward ratio
• Follow trend direction
• Close before market close
• Monitor news and events

⚡ Quick Execute:
/execute BTC-123456 0.1
```

## After (Enhanced with User Preferences)
```
📈 INTRADAY Signal - BTCUSD

🆔 Trade ID: BTC-123456
📈 Direction: LONG
💰 Entry Price: 95,000.50
🎯 Take Profit: 95,500.00
🛡️ Stop Loss: 94,750.00
⚡ Confidence: 85%
📊 Risk/Reward: 1:2.0
💎 Recommended Size: 0.1 lots
⏱️ Max Hold Time: 8h

🎯 Your Position Sizing:
• Account Balance: $5,000
• Risk Amount: $100.00 (2%)
• Suggested Lot Size: 0.4 lots

📊 Strategy Analysis:
⚡ INTRADAY SETUP:
• Hold for 1-8 hours maximum
• Balanced risk/reward ratio
• Follow trend direction
• Close before market close
• Monitor news and events

[... rest of technical analysis ...]

⚡ Quick Execute:
/execute BTC-123456 0.4
```

## Key Improvements

### 1. Personalized Position Sizing
- Shows user's account balance ($5,000)
- Calculates risk amount based on user's risk percentage (2% = $100)
- Suggests optimal lot size based on stop loss distance (0.4 lots)

### 2. Risk-Aware Recommendations
- The suggested lot size is calculated as: Risk Amount ÷ Stop Loss Distance
- Example: $100 ÷ $250 (stop loss distance) = 0.4 lots
- Capped at maximum allowed for the strategy (e.g., 1.0 lots for INTRADAY)

### 3. User-Specific Quick Execute
- The quick execute button now uses the personalized lot size
- Still provides conservative 0.01 option as alternative

## Position Size Calculation Logic

```typescript
const riskAmount = userPrefs.accountBalance * (userPrefs.riskPercentage / 100);
const stopLossDistance = Math.abs(prediction.entryPrice - prediction.stopLoss);
const suggestedLotSize = Math.min(riskAmount / stopLossDistance, maxLotSizeForStrategy);
```

Example with user settings:
- Account Balance: $5,000
- Risk Percentage: 2%
- Entry Price: $95,000.50
- Stop Loss: $94,750.00

Calculation:
- Risk Amount: $5,000 × 2% = $100
- Stop Loss Distance: $95,000.50 - $94,750.00 = $250.50
- Suggested Lot Size: $100 ÷ $250.50 = 0.399... ≈ 0.4 lots

This ensures the user risks exactly their desired percentage while maximizing position size within their risk tolerance.