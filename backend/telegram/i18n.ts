// Internationalization (i18n) system for multilingual support
// Supports English (default) and Italian

export type SupportedLanguage = 'en' | 'it';

export interface MessageKeys {
  // System messages
  'error.general': string;
  'error.invalid_symbol': string;
  'error.prediction_failed': string;
  'error.execution_failed': string;
  'error.vps_access_denied': string;
  'error.subscription_required': string;
  
  // Welcome and start messages
  'welcome.back': string;
  'welcome.new_user': string;
  'setup.choose_mode': string;
  'setup.complete': string;
  
  // Trading modes
  'trading.scalping': string;
  'trading.intraday': string;
  'trading.swing': string;
  
  // Commands help
  'help.title': string;
  'help.trading_commands': string;
  'help.vps_commands': string;
  'help.info_commands': string;
  
  // Risk management
  'risk.enter_percentage': string;
  'risk.enter_balance': string;
  'risk.invalid_percentage': string;
  'risk.invalid_balance': string;
  
  // Signal display
  'signal.title': string;
  'signal.confidence': string;
  'signal.position_sizing': string;
  'signal.risk_warning': string;
  
  // Performance
  'performance.title': string;
  'performance.stats': string;
  'performance.best_trade': string;
  'performance.worst_trade': string;
  
  // Status messages
  'status.title': string;
  'status.systems_online': string;
  'status.account_info': string;
  
  // Subscription messages
  'subscription.no_active': string;
  'subscription.expired': string;
  'subscription.features': string;
  'subscription.upgrade_info': string;
}

const messages: Record<SupportedLanguage, MessageKeys> = {
  en: {
    // System messages
    'error.general': '❌ An error occurred while processing your request. Please try again.',
    'error.invalid_symbol': '❌ Error generating prediction. Please try again or check if the symbol is valid.',
    'error.prediction_failed': '❌ Failed to generate prediction. Please try again.',
    'error.execution_failed': '❌ Error executing trade. Please check your MT5 connection and try again.',
    'error.vps_access_denied': '❌ You need an active subscription to access VPS management. Use `/subscription` to learn more.',
    'error.subscription_required': '❌ You need an active subscription to access AI signals. Use `/subscription` to learn more.',
    
    // Welcome and start messages
    'welcome.back': '🤖 **Welcome back to Professional AI Trading Bot**\n\nYou\'re all set up with **{mode}** trading mode!',
    'welcome.new_user': '🎯 **Welcome to Professional AI Trading Bot!**\n\nLet\'s set up your trading preferences to get started.',
    'setup.choose_mode': '**Step 1: Choose Your Trading Mode**\n\n🤔 **Which trading style fits you best?**',
    'setup.complete': '🎉 **Setup Complete!**\n\nYour trading preferences have been saved.',
    
    // Trading modes
    'trading.scalping': 'Scalping',
    'trading.intraday': 'Intraday',
    'trading.swing': 'Swing',
    
    // Commands help
    'help.title': '🤖 **Professional AI Trading Bot - Help**',
    'help.trading_commands': '**🎯 Trading Commands:**',
    'help.vps_commands': '**🖥️ VPS Management:**',
    'help.info_commands': '**📊 Information Commands:**',
    
    // Risk management
    'risk.enter_percentage': '💰 **How much do you want to risk per trade?**\n\nPlease enter your risk percentage (recommended: 1-3%):\n• Conservative: 1%\n• Balanced: 2%\n• Aggressive: 3%\n\nType a number like: `2` (for 2%)',
    'risk.enter_balance': '💰 **What\'s your account balance?**\n\nExamples:\n• `1000` (for $1,000)\n• `5000` (for $5,000)\n• `skip` (to set this later)',
    'risk.invalid_percentage': '❌ Please enter a valid risk percentage between 0.1% and 10%.\n\nExample: `2` (for 2%)',
    'risk.invalid_balance': '❌ Please enter a valid account balance (minimum $100) or type `skip`.\n\nExample: `1000` (for $1,000)',
    
    // Signal display
    'signal.title': '{emoji} **{strategy} Signal - {symbol}**',
    'signal.confidence': '{emoji} **Confidence:** **{confidence}%**',
    'signal.position_sizing': '🎯 **Your Position Sizing:**\n• Account Balance: ${balance}\n• Risk Amount: ${risk} ({percentage}%)\n• Suggested Lot Size: {lots} lots',
    'signal.risk_warning': '💡 **Risk Management:**\nAlways use stop loss and never risk more than 2% of your account per trade.',
    
    // Performance
    'performance.title': '📊 **Trading Performance Dashboard**',
    'performance.stats': '**🎯 Overall Statistics:**\n• Total Trades: {total}\n• Win Rate: {winRate}%\n• Average Profit: ${avgProfit}\n• Average Loss: ${avgLoss}',
    'performance.best_trade': '**📈 Best Performance:**\n• Best Trade: ${best}\n• Profit Factor: {factor}\n• Average Confidence: {confidence}%',
    'performance.worst_trade': '**⚠️ Risk Metrics:**\n• Worst Trade: ${worst}',
    
    // Status messages
    'status.title': '🔧 **Professional Trading System Status**',
    'status.systems_online': '🧠 **ML Engine:** ✅ Online (Advanced Models Active)\n🤖 **Gemini AI:** ✅ Connected (Professional Analysis)\n📊 **Smart Money Tracker:** ✅ Active (Institutional Flow)',
    'status.account_info': '💰 **Account Info:**\n• Balance: $10,000.00\n• Free Margin: $9,500.00\n• Open Positions: 0\n• Risk Level: Conservative',
    
    // Subscription messages
    'subscription.no_active': '❌ **No Active Subscription**\n\nYou don\'t have an active subscription. To access the AI Trading Bot features, please choose a plan.',
    'subscription.expired': '❌ Your subscription has expired. Please renew to continue using premium features.',
    'subscription.features': '🎯 **Your Available Features**',
    'subscription.upgrade_info': '🚀 **Upgrade Your Plan**\n\n**Why Upgrade?**\n• More VPS configurations\n• Advanced AI strategies\n• Priority support\n• Exclusive features',
  },
  
  it: {
    // System messages
    'error.general': '❌ Si è verificato un errore durante l\'elaborazione della tua richiesta. Riprova.',
    'error.invalid_symbol': '❌ Errore nella generazione della previsione. Riprova o controlla se il simbolo è valido.',
    'error.prediction_failed': '❌ Impossibile generare previsione. Riprova.',
    'error.execution_failed': '❌ Errore nell\'esecuzione del trade. Controlla la connessione MT5 e riprova.',
    'error.vps_access_denied': '❌ Hai bisogno di un abbonamento attivo per accedere alla gestione VPS. Usa `/subscription` per saperne di più.',
    'error.subscription_required': '❌ Hai bisogno di un abbonamento attivo per accedere ai segnali AI. Usa `/subscription` per saperne di più.',
    
    // Welcome and start messages
    'welcome.back': '🤖 **Bentornato su AI Trading Bot Professionale**\n\nSei già configurato con la modalità **{mode}**!',
    'welcome.new_user': '🎯 **Benvenuto su AI Trading Bot Professionale!**\n\nConfiguriamo le tue preferenze di trading per iniziare.',
    'setup.choose_mode': '**Passo 1: Scegli la Tua Modalità di Trading**\n\n🤔 **Quale stile di trading ti si addice meglio?**',
    'setup.complete': '🎉 **Configurazione Completata!**\n\nLe tue preferenze di trading sono state salvate.',
    
    // Trading modes
    'trading.scalping': 'Scalping',
    'trading.intraday': 'Intraday',
    'trading.swing': 'Swing',
    
    // Commands help
    'help.title': '🤖 **AI Trading Bot Professionale - Aiuto**',
    'help.trading_commands': '**🎯 Comandi di Trading:**',
    'help.vps_commands': '**🖥️ Gestione VPS:**',
    'help.info_commands': '**📊 Comandi Informativi:**',
    
    // Risk management
    'risk.enter_percentage': '💰 **Quanto vuoi rischiare per trade?**\n\nInserisci la percentuale di rischio (consigliato: 1-3%):\n• Conservativo: 1%\n• Bilanciato: 2%\n• Aggressivo: 3%\n\nScrivi un numero come: `2` (per 2%)',
    'risk.enter_balance': '💰 **Qual è il saldo del tuo account?**\n\nEsempi:\n• `1000` (per $1.000)\n• `5000` (per $5.000)\n• `skip` (per impostarlo dopo)',
    'risk.invalid_percentage': '❌ Inserisci una percentuale di rischio valida tra 0.1% e 10%.\n\nEsempio: `2` (per 2%)',
    'risk.invalid_balance': '❌ Inserisci un saldo account valido (minimo $100) o scrivi `skip`.\n\nEsempio: `1000` (per $1.000)',
    
    // Signal display
    'signal.title': '{emoji} **Segnale {strategy} - {symbol}**',
    'signal.confidence': '{emoji} **Confidenza:** **{confidence}%**',
    'signal.position_sizing': '🎯 **Il Tuo Dimensionamento Posizione:**\n• Saldo Account: ${balance}\n• Importo Rischio: ${risk} ({percentage}%)\n• Dimensione Lotto Suggerita: {lots} lotti',
    'signal.risk_warning': '💡 **Gestione del Rischio:**\nUsa sempre lo stop loss e non rischiare mai più del 2% del tuo account per trade.',
    
    // Performance
    'performance.title': '📊 **Dashboard Performance Trading**',
    'performance.stats': '**🎯 Statistiche Generali:**\n• Trade Totali: {total}\n• Tasso Vittoria: {winRate}%\n• Profitto Medio: ${avgProfit}\n• Perdita Media: ${avgLoss}',
    'performance.best_trade': '**📈 Migliore Performance:**\n• Miglior Trade: ${best}\n• Fattore Profitto: {factor}\n• Confidenza Media: {confidence}%',
    'performance.worst_trade': '**⚠️ Metriche Rischio:**\n• Peggior Trade: ${worst}',
    
    // Status messages
    'status.title': '🔧 **Stato Sistema Trading Professionale**',
    'status.systems_online': '🧠 **Engine ML:** ✅ Online (Modelli Avanzati Attivi)\n🤖 **Gemini AI:** ✅ Connesso (Analisi Professionale)\n📊 **Tracker Smart Money:** ✅ Attivo (Flusso Istituzionale)',
    'status.account_info': '💰 **Info Account:**\n• Saldo: $10.000,00\n• Margine Libero: $9.500,00\n• Posizioni Aperte: 0\n• Livello Rischio: Conservativo',
    
    // Subscription messages
    'subscription.no_active': '❌ **Nessun Abbonamento Attivo**\n\nNon hai un abbonamento attivo. Per accedere alle funzionalità del Bot AI Trading, scegli un piano.',
    'subscription.expired': '❌ Il tuo abbonamento è scaduto. Rinnova per continuare a usare le funzionalità premium.',
    'subscription.features': '🎯 **Le Tue Funzionalità Disponibili**',
    'subscription.upgrade_info': '🚀 **Aggiorna il Tuo Piano**\n\n**Perché Aggiornare?**\n• Più configurazioni VPS\n• Strategie AI avanzate\n• Supporto prioritario\n• Funzionalità esclusive',
  }
};

export function getMessage(key: keyof MessageKeys, language: SupportedLanguage = 'en', params: Record<string, string | number> = {}): string {
  let message = messages[language][key] || messages['en'][key];
  
  // Replace parameters in the message
  Object.keys(params).forEach(param => {
    const value = params[param];
    message = message.replace(new RegExp(`{${param}}`, 'g'), String(value));
  });
  
  return message;
}

export function getUserLanguage(userId: number): SupportedLanguage {
  // For now, default to English. In a real implementation, 
  // this would fetch from user preferences database
  return 'en';
}

export function setUserLanguage(userId: number, language: SupportedLanguage): Promise<void> {
  // For now, this is a placeholder. In a real implementation,
  // this would save to user preferences database
  return Promise.resolve();
}

// Utility functions for common message patterns
export function formatCurrency(amount: number, language: SupportedLanguage = 'en'): string {
  if (language === 'it') {
    return new Intl.NumberFormat('it-IT', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2 
    }).format(amount);
  }
  
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2 
  }).format(amount);
}

export function formatPercentage(value: number, language: SupportedLanguage = 'en'): string {
  if (language === 'it') {
    return new Intl.NumberFormat('it-IT', { 
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1 
    }).format(value / 100);
  }
  
  return new Intl.NumberFormat('en-US', { 
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1 
  }).format(value / 100);
}

export function formatNumber(value: number, language: SupportedLanguage = 'en'): string {
  if (language === 'it') {
    return new Intl.NumberFormat('it-IT').format(value);
  }
  
  return new Intl.NumberFormat('en-US').format(value);
}