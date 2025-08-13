# MT5 Connection Status Guide - Troubleshooting 404 Errors

## 🚨 Current Issue Analysis

Based on the logs, the system is encountering:
```
MT5 REST API error: 404 NOT FOUND
MT5 connection methods failed, using simulation mode
```

This indicates that the MT5 Python server is not accessible at the configured endpoint.

## 🔍 Diagnostic Steps

### **Step 1: Check Current Configuration**

In the Leap Infrastructure tab, verify these secrets:

```
MT5ServerHost=?     # What is this set to?
MT5ServerPort=8080  # Should be 8080
MT5Login=?          # Your MT5 account number
MT5Password=?       # Your MT5 password
MT5Server=?         # Your broker server name
```

### **Step 2: Common Configuration Issues**

#### **Issue A: localhost Configuration**
If `MT5ServerHost=localhost`:
- ✅ **Correct for**: Local development on same machine
- ❌ **Incorrect for**: VPS or remote server setup
- 🔧 **Fix**: Update to your VPS IP address

#### **Issue B: Placeholder Values**
If `MT5ServerHost=your_vps_ip`:
- ❌ This is a placeholder value
- 🔧 **Fix**: Replace with actual IP address (e.g., `154.61.187.189`)

#### **Issue C: Missing Configuration**
If any secrets are empty:
- 🔧 **Fix**: Set all required MT5 secrets

## 🛠️ Quick Fixes

### **Fix 1: Update VPS IP Address**

If you're using a VPS, update the configuration:

```
# CHANGE FROM:
MT5ServerHost=localhost

# CHANGE TO:
MT5ServerHost=YOUR_VPS_IP_ADDRESS
```

Example:
```
MT5ServerHost=154.61.187.189
MT5ServerPort=8080
```

### **Fix 2: Test VPS Connection**

From your computer, test if the VPS is accessible:

```bash
# Test if VPS is reachable
ping YOUR_VPS_IP

# Test if MT5 server is running
curl http://YOUR_VPS_IP:8080/status
```

Expected response:
```json
{
  "connected": true,
  "trade_allowed": true,
  "server": "YourBroker-Demo",
  "login": 12345678,
  "balance": 10000.0
}
```

### **Fix 3: Restart MT5 Python Server**

On your VPS:

1. **Connect to VPS** via Remote Desktop
2. **Open Command Prompt**
3. **Navigate to bot directory**:
   ```bash
   cd C:\TradingBot
   ```
4. **Start the server**:
   ```bash
   python mt5-python-server.py
   ```
5. **Verify startup message**:
   ```
   ✅ MT5 connesso con successo!
   🚀 Avvio server su porta 8080...
   ```

## 🔧 Advanced Troubleshooting

### **Check 1: VPS Firewall**

Ensure port 8080 is open:

1. **Windows Firewall**:
   - Open Windows Defender Firewall
   - Advanced Settings → Inbound Rules
   - New Rule → Port → TCP → 8080 → Allow

2. **VPS Provider Firewall**:
   - Check your VPS provider's control panel
   - Ensure port 8080 is open for inbound connections

### **Check 2: MT5 Terminal Status**

On your VPS:

1. **Open MetaTrader 5**
2. **Verify connection**:
   - Bottom right should show "Connected"
   - Account number should be visible
3. **Check trading permissions**:
   - Tools → Options → Expert Advisors
   - ✅ Allow automated trading
   - ✅ Allow DLL imports

### **Check 3: Python Dependencies**

On your VPS, verify Python packages:

```bash
pip list | findstr MetaTrader5
pip list | findstr flask
```

If missing, install:
```bash
pip install MetaTrader5 flask flask-cors
```

## 📊 Expected Log Messages

### **When Working Correctly:**
```
🔗 Testing MT5 connection to: http://154.61.187.189:8080
📊 MT5 connection status: Connected
💰 MT5 Account - Login: 12345678, Balance: 10000.0, Server: Demo-Server
✅ Successfully fetched MT5 data for EURUSD 5m - Close: 1.08450
```

### **When Not Working:**
```
⚠️ MT5 status check failed: 404 NOT FOUND
⚠️ MT5 data unavailable for EURUSD 5m, using enhanced fallback data
🔄 Using simulation mode for order execution
```

## 🎯 Step-by-Step Resolution

### **For VPS Users:**

1. **Update Configuration**:
   ```
   MT5ServerHost=YOUR_VPS_IP_ADDRESS
   MT5ServerPort=8080
   ```

2. **Test Connection**:
   ```bash
   curl http://YOUR_VPS_IP:8080/status
   ```

3. **If 404 Error**:
   - Check VPS is running
   - Restart MT5 Python server
   - Verify firewall settings

4. **If Connection Timeout**:
   - Check VPS internet connection
   - Verify firewall allows port 8080
   - Restart VPS if necessary

### **For Local Users:**

1. **Keep Configuration**:
   ```
   MT5ServerHost=localhost
   MT5ServerPort=8080
   ```

2. **Ensure MT5 and Python Server Running**:
   - Open MT5 and login
   - Run: `python mt5-python-server.py`

3. **Test Locally**:
   ```bash
   curl http://localhost:8080/status
   ```

## 🚀 Success Indicators

When properly configured, you should see:

1. **In Logs**:
   ```
   ✅ Successfully fetched MT5 data for EURUSD 5m
   ✅ Order executed successfully: EURUSD LONG 0.1 lots
   ```

2. **In MT5 Terminal**:
   - Green connection indicator
   - Real-time price updates
   - Order execution confirmations

3. **In Bot Responses**:
   - Real market prices instead of simulated data
   - Actual order confirmations with MT5 order IDs

## 💡 Pro Tips

1. **Always test connection** after configuration changes
2. **Monitor logs** for connection status messages
3. **Keep VPS running 24/7** for continuous operation
4. **Use static IP** for VPS to avoid configuration changes
5. **Set up monitoring** to alert if connection fails

## 🆘 Still Having Issues?

If you're still seeing 404 errors:

1. **Double-check VPS IP address** in configuration
2. **Verify Python server is actually running** on VPS
3. **Test with browser**: Go to `http://YOUR_VPS_IP:8080/status`
4. **Check VPS provider firewall** settings
5. **Try restarting VPS** completely

The system will continue to work in simulation mode until the MT5 connection is properly established, so you can still test the trading logic while fixing the connection issues.
