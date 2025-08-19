// File: src/analysis/signal-generator.ts

// Import delle dipendenze necessarie
import { pool } from '../db'; // Importa la connessione al database
import { TradingSignal, MarketData, UserPreferences } from '../types'; // Supponiamo tu abbia un file di tipi
import { calculateStrategyTargets } from './utils'; // Esempio di altre funzioni di analisi
import { getOptimalStrategy } from './trading-strategies';
import { analyzeWithAI } from './ai-engine';

/**
 * Funzione principale che analizza i dati di mercato, genera un segnale di trading
 * e lo salva nel database prima di restituirlo.
 * * @param symbol - Il simbolo da analizzare (es. "EURUSD")
 * @param marketData - I dati di mercato per l'analisi
 * @param preferences - Le preferenze dell'utente (es. rischio)
 * @returns Una Promise che si risolve con l'oggetto TradingSignal generato.
 */
export async function generateAndSaveSignal(
  symbol: string,
  marketData: MarketData,
  preferences: UserPreferences
): Promise<TradingSignal | null> {

  console.log(`Starting signal generation for ${symbol}...`);

  // --- 1. Logica di Analisi Esistente ---
  // (Questa è una simulazione della tua logica di analisi attuale)
  const aiAnalysis = await analyzeWithAI(marketData, symbol);
  if (!aiAnalysis) {
    console.log(`AI analysis failed for ${symbol}. No signal generated.`);
    return null;
  }

  const optimalStrategy = getOptimalStrategy(marketData, aiAnalysis, symbol);
  const currentPrice = marketData['5m'].close;
  const atr = marketData['5m'].indicators.atr;
  
  const priceTargets = calculateStrategyTargets(
    optimalStrategy, currentPrice, atr, aiAnalysis.direction, symbol
  );

  // Creazione dell'oggetto segnale
  const newSignal: TradingSignal = {
    tradeId: `signal_${symbol}_${Date.now()}`, // Genera un ID unico
    symbol: symbol,
    direction: aiAnalysis.direction,
    entryPrice: priceTargets.entryPrice,
    takeProfit: priceTargets.takeProfit,
    stopLoss: priceTargets.stopLoss,
    confidence: aiAnalysis.confidence,
    strategy: optimalStrategy,
    // ...tutti gli altri campi necessari per il tuo oggetto TradingSignal
  };

  // --- 2. NUOVO BLOCCO: Salvataggio del Segnale nel Database ---
  try {
    const queryText = `
      INSERT INTO signals(
        symbol, 
        direction, 
        entry_price, 
        take_profit, 
        stop_loss, 
        confidence_score, 
        strategy_used, 
        status
      )
      VALUES($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING signal_id;
    `;
    
    // I valori devono corrispondere all'ordine dei segnaposto ($1, $2, etc.)
    const values = [
      newSignal.symbol,
      newSignal.direction,
      newSignal.entryPrice,
      newSignal.takeProfit,
      newSignal.stopLoss,
      newSignal.confidence,
      newSignal.strategy,
      'PENDING' // Stato iniziale per il motore di simulazione
    ];

    // Esegui la query usando il pool di connessioni
    const res = await pool.query(queryText, values);
    
    console.log(`✅ Signal for ${newSignal.symbol} saved to database with ID: ${res.rows[0].signal_id}`);

  } catch (error) {
    console.error(`❌ Error saving signal for ${newSignal.symbol} to database:`, error);
    // In caso di errore, potresti decidere di non restituire il segnale
    // o di gestirlo in altro modo, per ora lo restituiamo comunque.
  }
  
  // --- 3. Restituzione del Segnale ---
  // La funzione restituisce ancora il segnale, mantenendo la compatibilità
  // con altre parti del tuo sistema che potrebbero usarlo.
  return newSignal;
}

// Potresti avere altre funzioni di supporto in questo file...

// Esempio di un tipo per TradingSignal, potresti averlo in un file separato come `src/types.ts`
// export interface TradingSignal {
//   tradeId: string;
//   symbol: string;
//   direction: 'LONG' | 'SHORT';
//   entryPrice: number;
//   takeProfit: number;
//   stopLoss: number;
//   confidence: number;
//   strategy: string;
// }
