# MT5 Connection Troubleshooting Guide

## 🚨 Common Error: "fetch failed"

If you see this error in the logs:
```
Error fetching MT5 data for BTCUSD: fetch failed
MT5 data unavailable for BTCUSD 5m, falling back to Alpha Vantage
```

This means the system cannot connect to your MT5 Python server. Here's how to fix it:

## 🔧 Step-by-Step Troubleshooting

### **Step 1: Check Infrastructure Settings**

In the Leap Infrastructure tab, verify these secrets are set correctly:

```
MT5ServerHost=192.168.1.100  # Your VPS IP address (NOT localhost)
MT5ServerPort=8080
MT5Login=12345678            # Your MT5 account number
MT5Password=your_password    # Your MT5 account password
MT5Server=XMGlobal-Demo      # Your broker server name
```

⚠️ **Important**: If you're using a VPS, `MT5ServerHost` must be your VPS's public IP address, not "localhost".

### **Step 2: Verify VPS is Running**

1. **Connect to your VPS** via Remote Desktop
2. **Check if VPS is online** and accessible
3. **Verify internet connection** on the VPS

### **Step 3: Check MT5 Python Server**

On your VPS, open Command Prompt and check if the server is running:

```bash
# Navigate to your bot directory
cd C:\TradingBot

# Check if the server is running
python mt5-python-server.py
```

You should see:
```
=== AI TRADING BOT - MT5 PY-SERVER ===
✅ MT5 connesso con successo!
🚀 Avvio server su porta 8080...
```

If you see errors, continue to Step 4.

### **Step 4: Verify MT5 Terminal**

1. **Open MetaTrader 5** on your VPS
2. **Check connection status** (should show "Connected" in bottom right)
3. **Verify account login** (should show your account number)
4. **Check trading permissions**:
   - Go to **Tools → Options → Expert Advisors**
   - ✅ Enable "Allow automated trading"
   - ✅ Enable "Allow DLL imports"

### **Step 5: Test Network Connectivity**

On your VPS, test if the server is accessible:

```bash
# Test local connection
curl http://localhost:8080/status

# Test external connection (replace with your VPS IP)
curl http://192.168.1.100:8080/status
```

If this fails, continue to Step 6.

### **Step 6: Check Firewall Settings**

**Windows Firewall on VPS:**
1. **Open** Windows Defender Firewall
2. **Click** "Advanced settings"
3. **Add Inbound Rule**:
   - Rule Type: Port
   - Protocol: TCP
   - Port: 8080
   - Action: Allow

**VPS Provider Firewall:**
- Check your VPS provider's control panel
- Ensure port 8080 is open for inbound connections

### **Step 7: Restart Services**

1. **Close MetaTrader 5**
2. **Stop the Python server** (Ctrl+C)
3. **Restart MetaTrader 5**
4. **Login to your account**
5. **Restart Python server**: `python mt5-python-server.py`

## 🔍 Advanced Diagnostics

### **Check Server Status Endpoint**

Test the MT5 server status:

```bash
# Replace with your VPS IP
curl -X GET http://192.168.1.100:8080/status
```

Expected response:
```json
{
  "connected": true,
  "trade_allowed": true,
  "server": "XMGlobal-Demo",
  "login": 12345678,
  "balance": 10000.0
}
```

### **Test Data Endpoint**

Test fetching market data:

```bash
curl -X POST http://192.168.1.100:8080/rates \
  -H "Content-Type: application/json" \
  -d '{"symbol": "EURUSD", "timeframe": "5m", "count": 10}'
```

### **Check Python Dependencies**

Ensure all required packages are installed:

```bash
pip install MetaTrader5 flask flask-cors
```

## 🚨 Common Issues and Solutions

### **Issue: "MT5 initialization failed"**
**Solution:**
- Restart MetaTrader 5
- Ensure you're logged into your account
- Check if MT5 is running as Administrator

### **Issue: "Port 8080 already in use"**
**Solution:**
```bash
# Find process using port 8080
netstat -ano | findstr :8080

# Kill the process (replace PID with actual process ID)
taskkill /PID 1234 /F
```

### **Issue: "Connection timeout"**
**Solution:**
- Check VPS internet connection
- Verify firewall settings
- Ensure MT5ServerHost is correct IP address

### **Issue: "Trade not allowed"**
**Solution:**
- Enable automated trading in MT5 options
- Check if market is open
- Verify account has sufficient margin

## 📊 Monitoring Connection Health

### **Real-time Status Check**

Add this to your monitoring routine:

```bash
# Create a batch file for regular checks
echo @echo off > check_mt5.bat
echo curl -s http://localhost:8080/status >> check_mt5.bat
echo pause >> check_mt5.bat
```

### **Log Monitoring**

Check these log files regularly:
- **Python Server**: Console output
- **MT5 Logs**: `%APPDATA%\MetaQuotes\Terminal\[ID]\Logs\`
- **Windows Event Logs**: Event Viewer

## 🎯 Success Indicators

When everything is working correctly, you should see:

**In the bot logs:**
```
Successfully fetched MT5 data for BTCUSD 5m - Close: 95000.50
```

**In the Python server:**
```
✅ MT5 connesso con successo!
📡 Il bot può ora ricevere dati in tempo reale da MT5!
```

**In MT5 terminal:**
- Green connection indicator
- Account balance visible
- "Automated trading allowed" message

## 🆘 Still Having Issues?

If you're still experiencing problems:

1. **Check the complete error message** in the logs
2. **Verify all steps** have been completed correctly
3. **Try with a different symbol** (some brokers have different symbol names)
4. **Contact your broker** to ensure API access is enabled
5. **Consider using demo account** first for testing

## 💡 Pro Tips

- **Use a VPS** for 24/7 operation
- **Keep MT5 updated** to the latest version
- **Monitor connection** regularly
- **Have backup data sources** (Alpha Vantage, CoinGecko)
- **Test with demo account** before live trading

Remember: The system will automatically fall back to alternative data sources if MT5 is not available, so your bot will continue working even during connection issues!
