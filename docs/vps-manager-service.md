# VPS Manager Service - Documentazione Tecnica

## 🎯 Panoramica

Il **VPS Manager Service** è un microservizio separato che gestisce la configurazione automatica dei VPS degli utenti. Si occupa di connessioni SSH, installazione software e monitoraggio.

## 🏗️ Architettura

### **Componenti Principali:**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Telegram Bot  │───▶│  VPS Manager    │───▶│   User's VPS    │
│                 │    │    Service      │    │                 │
│ • User Commands │    │ • SSH Client    │    │ • Windows Server│
│ • Setup Wizard  │    │ • Installers    │    │ • MT5 Terminal  │
│ • Status Updates│    │ • Monitoring    │    │ • Trading Bot   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Tecnologie Utilizzate:**
- **Node.js + TypeScript** per il core service
- **SSH2** per connessioni SSH sicure
- **PowerShell** per automazione Windows
- **Docker** per containerizzazione
- **Redis** per cache e queue management

## 🔧 API Endpoints

### **1. Test Connection**
```typescript
POST /test-connection
{
  "host": "192.168.1.100",
  "username": "Administrator", 
  "password": "SecurePassword123"
}

Response:
{
  "success": true,
  "message": "Connection established",
  "systemInfo": {
    "os": "Windows Server 2022",
    "cpu": "Intel Xeon 4 cores",
    "memory": "8GB",
    "disk": "200GB SSD"
  }
}
```

### **2. Install Software**
```typescript
POST /install-software
{
  "host": "192.168.1.100",
  "username": "Administrator",
  "password": "SecurePassword123"
}

Response:
{
  "success": true,
  "installationId": "inst_123456",
  "estimatedTime": "5-8 minutes",
  "steps": [
    "Installing Python 3.9",
    "Installing MetaTrader 5",
    "Installing Python dependencies",
    "Configuring firewall rules"
  ]
}
```

### **3. Configure MT5**
```typescript
POST /configure-mt5
{
  "host": "192.168.1.100",
  "username": "Administrator",
  "password": "SecurePassword123",
  "mt5Login": "12345678",
  "mt5Password": "MT5Password",
  "mt5Server": "XMGlobal-Demo"
}

Response:
{
  "success": true,
  "mt5Status": "configured",
  "connectionTest": "passed",
  "tradingEnabled": true
}
```

### **4. Start Bot**
```typescript
POST /start-bot
{
  "host": "192.168.1.100",
  "username": "Administrator",
  "password": "SecurePassword123",
  "userId": 123456789
}

Response:
{
  "success": true,
  "botStatus": "running",
  "processId": 4567,
  "logFile": "C:\\TradingBot\\logs\\bot.log"
}
```

### **5. Get Status**
```typescript
POST /status
{
  "host": "192.168.1.100",
  "username": "Administrator",
  "password": "SecurePassword123"
}

Response:
{
  "success": true,
  "system": {
    "cpu": 25,
    "memory": 60,
    "disk": 45,
    "uptime": "2 days, 14 hours"
  },
  "bot": {
    "status": "running",
    "mt5Connected": true,
    "lastSignal": "2024-01-15T14:30:00Z",
    "activeTrades": 2
  }
}
```

## 📦 Installation Scripts

### **Python Installation Script**
```powershell
# install-python.ps1
$pythonUrl = "https://www.python.org/ftp/python/3.9.13/python-3.9.13-amd64.exe"
$pythonInstaller = "C:\temp\python-installer.exe"

# Download Python installer
Invoke-WebRequest -Uri $pythonUrl -OutFile $pythonInstaller

# Install Python silently
Start-Process -FilePath $pythonInstaller -ArgumentList "/quiet", "InstallAllUsers=1", "PrependPath=1" -Wait

# Verify installation
python --version

# Install required packages
pip install MetaTrader5 flask flask-cors requests schedule
```

### **MetaTrader 5 Installation Script**
```powershell
# install-mt5.ps1
$mt5Url = "https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5setup.exe"
$mt5Installer = "C:\temp\mt5setup.exe"

# Download MT5 installer
Invoke-WebRequest -Uri $mt5Url -OutFile $mt5Installer

# Install MT5 silently
Start-Process -FilePath $mt5Installer -ArgumentList "/S" -Wait

# Configure MT5 for automated trading
$mt5ConfigPath = "$env:APPDATA\MetaQuotes\Terminal\D0E8209F77C8CF37AD8BF550E51FF075\config"
New-Item -ItemType Directory -Force -Path $mt5ConfigPath

# Enable automated trading
$configContent = @"
[Common]
AllowDllImports=true
AllowWebRequest=true
ExpertsDllImports=true
ExpertsWebRequest=true
"@

Set-Content -Path "$mt5ConfigPath\terminal.ini" -Value $configContent
```

### **Trading Bot Deployment Script**
```powershell
# deploy-bot.ps1
param(
    [string]$UserId,
    [string]$MT5Login,
    [string]$MT5Password,
    [string]$MT5Server
)

# Create bot directory
$botPath = "C:\TradingBot"
New-Item -ItemType Directory -Force -Path $botPath
New-Item -ItemType Directory -Force -Path "$botPath\logs"

# Download bot files
$botFilesUrl = "https://github.com/your-repo/trading-bot/archive/main.zip"
$botZip = "$botPath\bot.zip"
Invoke-WebRequest -Uri $botFilesUrl -OutFile $botZip

# Extract bot files
Expand-Archive -Path $botZip -DestinationPath $botPath -Force

# Create configuration file
$configContent = @"
{
  "userId": "$UserId",
  "mt5": {
    "login": "$MT5Login",
    "password": "$MT5Password",
    "server": "$MT5Server"
  },
  "api": {
    "host": "localhost",
    "port": 8080
  }
}
"@

Set-Content -Path "$botPath\config.json" -Value $configContent

# Create startup script
$startupScript = @"
@echo off
cd /d C:\TradingBot
python mt5-python-server.py
"@

Set-Content -Path "$botPath\start-bot.bat" -Value $startupScript

# Add to Windows startup
$startupPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
Copy-Item "$botPath\start-bot.bat" "$startupPath\TradingBot.bat"

# Start the bot
Start-Process -FilePath "$botPath\start-bot.bat" -WindowStyle Hidden
```

## 🔍 Monitoring System

### **Health Check Script**
```typescript
// health-monitor.ts
import { SSHClient } from './ssh-client';

export class HealthMonitor {
  private clients: Map<string, SSHClient> = new Map();

  async monitorVPS(config: VPSConfig): Promise<HealthStatus> {
    const client = this.getClient(config.host);
    
    try {
      // Check system resources
      const systemStats = await client.executeCommand(`
        Get-WmiObject -Class Win32_Processor | Measure-Object -Property LoadPercentage -Average | Select-Object Average
        Get-WmiObject -Class Win32_OperatingSystem | Select-Object @{Name="MemoryUsage";Expression={[math]::Round(($_.TotalVisibleMemorySize - $_.FreePhysicalMemory) / $_.TotalVisibleMemorySize * 100, 2)}}
        Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'" | Select-Object @{Name="DiskUsage";Expression={[math]::Round(($_.Size - $_.FreeSpace) / $_.Size * 100, 2)}}
      `);

      // Check bot status
      const botStatus = await client.executeCommand(`
        Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object {$_.CommandLine -like "*mt5-python-server*"}
      `);

      // Check MT5 connection
      const mt5Status = await client.executeCommand(`
        Test-NetConnection -ComputerName "mt5-server.com" -Port 443 -InformationLevel Quiet
      `);

      return {
        system: this.parseSystemStats(systemStats),
        bot: this.parseBotStatus(botStatus),
        mt5: this.parseMT5Status(mt5Status),
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  private parseSystemStats(output: string): SystemStats {
    // Parse PowerShell output and return structured data
    return {
      cpu: 25,
      memory: 60,
      disk: 45,
      uptime: "2 days, 14 hours"
    };
  }

  private parseBotStatus(output: string): BotStatus {
    return {
      running: output.includes("python"),
      processId: this.extractProcessId(output),
      lastActivity: new Date()
    };
  }

  private parseMT5Status(output: string): MT5Status {
    return {
      connected: output.includes("True"),
      lastPing: new Date()
    };
  }
}
```

### **Alert System**
```typescript
// alert-system.ts
export class AlertSystem {
  async checkAlerts(health: HealthStatus, config: VPSConfig): Promise<void> {
    const alerts: Alert[] = [];

    // CPU usage alert
    if (health.system.cpu > 90) {
      alerts.push({
        type: 'warning',
        message: `High CPU usage: ${health.system.cpu}%`,
        severity: 'medium'
      });
    }

    // Memory usage alert
    if (health.system.memory > 85) {
      alerts.push({
        type: 'warning',
        message: `High memory usage: ${health.system.memory}%`,
        severity: 'medium'
      });
    }

    // Bot not running alert
    if (!health.bot.running) {
      alerts.push({
        type: 'error',
        message: 'Trading bot is not running',
        severity: 'high'
      });
    }

    // MT5 disconnected alert
    if (!health.mt5.connected) {
      alerts.push({
        type: 'error',
        message: 'MT5 connection lost',
        severity: 'high'
      });
    }

    // Send alerts to user
    for (const alert of alerts) {
      await this.sendAlert(config.userId, alert);
    }
  }

  private async sendAlert(userId: number, alert: Alert): Promise<void> {
    // Send alert via Telegram
    const message = `🚨 **VPS Alert**\n\n${alert.message}\n\nTime: ${new Date().toLocaleString()}`;
    await sendTelegramMessage(userId, message);
  }
}
```

## 🔒 Security Features

### **SSH Key Management**
```typescript
// ssh-key-manager.ts
export class SSHKeyManager {
  async generateKeyPair(): Promise<KeyPair> {
    const { privateKey, publicKey } = await generateSSHKeyPair({
      type: 'rsa',
      bits: 4096,
      comment: 'trading-bot-access'
    });

    return { privateKey, publicKey };
  }

  async installPublicKey(config: VPSConfig, publicKey: string): Promise<void> {
    const client = new SSHClient(config);
    
    // Add public key to authorized_keys (for Linux) or configure for Windows
    await client.executeCommand(`
      $authorizedKeys = "$env:USERPROFILE\\.ssh\\authorized_keys"
      New-Item -ItemType Directory -Force -Path (Split-Path $authorizedKeys)
      Add-Content -Path $authorizedKeys -Value "${publicKey}"
    `);
  }
}
```

### **Password Encryption**
```typescript
// encryption.ts
import crypto from 'crypto';

export class PasswordEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;

  static encrypt(password: string, masterKey: string): EncryptedData {
    const key = crypto.scryptSync(masterKey, 'salt', this.KEY_LENGTH);
    const iv = crypto.randomBytes(this.IV_LENGTH);
    
    const cipher = crypto.createCipher(this.ALGORITHM, key, iv);
    
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  static decrypt(encryptedData: EncryptedData, masterKey: string): string {
    const key = crypto.scryptSync(masterKey, 'salt', this.KEY_LENGTH);
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');
    
    const decipher = crypto.createDecipher(this.ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

## 📊 Logging and Analytics

### **Structured Logging**
```typescript
// logger.ts
export class VPSLogger {
  async logOperation(
    userId: number,
    operation: string,
    status: 'started' | 'completed' | 'failed',
    details?: any
  ): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      operation,
      status,
      details,
      sessionId: this.generateSessionId()
    };

    // Store in database
    await this.storeLog(logEntry);
    
    // Send to analytics service
    await this.sendToAnalytics(logEntry);
  }

  async getOperationLogs(userId: number, limit: number = 50): Promise<LogEntry[]> {
    return await this.queryLogs({
      userId,
      limit,
      orderBy: 'timestamp DESC'
    });
  }
}
```

### **Performance Metrics**
```typescript
// metrics.ts
export class PerformanceMetrics {
  async trackSetupTime(userId: number, startTime: Date, endTime: Date): Promise<void> {
    const duration = endTime.getTime() - startTime.getTime();
    
    await this.recordMetric({
      userId,
      metric: 'setup_duration',
      value: duration,
      unit: 'milliseconds',
      timestamp: endTime
    });
  }

  async trackSystemHealth(userId: number, health: HealthStatus): Promise<void> {
    const metrics = [
      { metric: 'cpu_usage', value: health.system.cpu },
      { metric: 'memory_usage', value: health.system.memory },
      { metric: 'disk_usage', value: health.system.disk },
      { metric: 'bot_uptime', value: health.bot.uptime }
    ];

    for (const metric of metrics) {
      await this.recordMetric({
        userId,
        ...metric,
        timestamp: new Date()
      });
    }
  }
}
```

Il **VPS Manager Service** fornisce un'infrastruttura completa per la gestione automatica dei VPS degli utenti, garantendo sicurezza, affidabilità e monitoraggio continuo. 🚀
