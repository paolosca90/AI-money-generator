"""
MT5 Python Server - Versione per Download
Copia questo codice e salvalo come 'mt5-python-server.py' sul tuo VPS

Requisiti:
pip install MetaTrader5 flask flask-cors

Utilizzo:
python mt5-python-server.py
"""

import MetaTrader5 as mt5
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configura logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Stato connessione MT5
mt5_connected = False
mt5_account_info = None

def initialize_mt5():
    """Inizializza connessione MT5"""
    global mt5_connected, mt5_account_info
    
    try:
        # Inizializza MT5
        if not mt5.initialize():
            logger.error("Inizializzazione MT5 fallita")
            return False
        
        # Ottieni info account
        account_info = mt5.account_info()
        if account_info is None:
            logger.error("Impossibile ottenere info account")
            return False
        
        mt5_account_info = account_info._asdict()
        mt5_connected = True
        logger.info(f"MT5 connesso con successo. Account: {mt5_account_info['login']}")
        return True
        
    except Exception as e:
        logger.error(f"Errore inizializzazione MT5: {e}")
        return False

def login_mt5(login, password, server):
    """Login a account MT5"""
    global mt5_connected, mt5_account_info
    
    try:
        # Login all'account
        if not mt5.login(login, password, server):
            logger.error(f"Login fallito per account {login}")
            return False
        
        # Ottieni info account dopo login
        account_info = mt5.account_info()
        if account_info is None:
            logger.error("Impossibile ottenere info account dopo login")
            return False
        
        mt5_account_info = account_info._asdict()
        mt5_connected = True
        logger.info(f"Login MT5 riuscito. Account: {login}")
        return True
        
    except Exception as e:
        logger.error(f"Errore login MT5: {e}")
        return False

@app.route('/status', methods=['GET'])
def get_status():
    """Ottieni stato connessione MT5"""
    try:
        if not mt5_connected:
            return jsonify({
                'connected': False,
                'trade_allowed': False,
                'error': 'Non connesso a MT5'
            })
        
        # Controlla se il trading è permesso
        account_info = mt5.account_info()
        if account_info is None:
            return jsonify({
                'connected': False,
                'trade_allowed': False,
                'error': 'Impossibile ottenere info account'
            })
        
        return jsonify({
            'connected': True,
            'trade_allowed': account_info.trade_allowed,
            'server': account_info.server,
            'login': account_info.login,
            'balance': account_info.balance,
            'equity': account_info.equity,
            'margin': account_info.margin,
            'free_margin': account_info.margin_free,
            'margin_level': account_info.margin_level
        })
        
    except Exception as e:
        logger.error(f"Errore controllo stato: {e}")
        return jsonify({
            'connected': False,
            'trade_allowed': False,
            'error': str(e)
        }), 500

@app.route('/rates', methods=['POST'])
def get_rates():
    """Ottieni dati storici per un simbolo"""
    try:
        if not mt5_connected:
            return jsonify({'error': 'Non connesso a MT5'}), 400
        
        data = request.json
        symbol = data.get('symbol')
        timeframe_str = data.get('timeframe') # es. '5m', '15m'
        count = int(data.get('count', 100)) # Numero di barre
        
        timeframe_map = {
            '1m': mt5.TIMEFRAME_M1,
            '5m': mt5.TIMEFRAME_M5,
            '15m': mt5.TIMEFRAME_M15,
            '30m': mt5.TIMEFRAME_M30,
            '1h': mt5.TIMEFRAME_H1,
            '4h': mt5.TIMEFRAME_H4,
            '1d': mt5.TIMEFRAME_D1,
        }
        
        timeframe = timeframe_map.get(timeframe_str)
        if timeframe is None:
            return jsonify({'error': f'Timeframe non valido: {timeframe_str}'}), 400
            
        rates = mt5.copy_rates_from_pos(symbol, timeframe, 0, count)
        
        if rates is None or len(rates) == 0:
            return jsonify({'error': f'Impossibile ottenere dati per {symbol}'}), 500
            
        # Converti array numpy in lista di dizionari
        rates_list = []
        for rate in rates:
            rates_list.append({
                'time': int(rate['time']),
                'open': rate['open'],
                'high': rate['high'],
                'low': rate['low'],
                'close': rate['close'],
                'tick_volume': int(rate['tick_volume']),
                'spread': int(rate['spread']),
                'real_volume': int(rate['real_volume'])
            })
            
        return jsonify({'rates': rates_list})
        
    except Exception as e:
        logger.error(f"Errore ottenimento dati: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/execute', methods=['POST'])
def execute_trade():
    """Esegui un ordine di trading"""
    try:
        if not mt5_connected:
            return jsonify({
                'success': False,
                'error': 'Non connesso a MT5',
                'retcode': -1
            }), 400
        
        data = request.json
        
        # Estrai parametri ordine
        symbol = data.get('symbol')
        action = data.get('action')  # 'BUY' o 'SELL'
        volume = float(data.get('volume'))
        price = float(data.get('price', 0))
        sl = float(data.get('sl', 0))
        tp = float(data.get('tp', 0))
        deviation = int(data.get('deviation', 20))
        magic = int(data.get('magic', 234000))
        comment = data.get('comment', 'AI Trading Bot')
        
        # Prepara richiesta ordine
        if action == 'BUY':
            order_type = mt5.ORDER_TYPE_BUY
            if price == 0:
                tick = mt5.symbol_info_tick(symbol)
                price = tick.ask if tick else 0
        else:
            order_type = mt5.ORDER_TYPE_SELL
            if price == 0:
                tick = mt5.symbol_info_tick(symbol)
                price = tick.bid if tick else 0
        
        request_dict = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": volume,
            "type": order_type,
            "price": price,
            "sl": sl,
            "tp": tp,
            "deviation": deviation,
            "magic": magic,
            "comment": comment,
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }
        
        # Invia ordine
        result = mt5.order_send(request_dict)
        
        if result is None:
            return jsonify({
                'success': False,
                'error': 'Invio ordine fallito',
                'retcode': -1
            }), 500
        
        return jsonify({
            'success': result.retcode == mt5.TRADE_RETCODE_DONE,
            'retcode': result.retcode,
            'order': result.order,
            'deal': result.deal,
            'price': result.price,
            'volume': result.volume,
            'comment': result.comment,
            'request_id': result.request_id,
            'error': result.comment if result.retcode != mt5.TRADE_RETCODE_DONE else None
        })
        
    except Exception as e:
        logger.error(f"Errore esecuzione trade: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'retcode': -1
        }), 500

@app.route('/positions', methods=['GET'])
def get_positions():
    """Ottieni posizioni aperte"""
    try:
        if not mt5_connected:
            return jsonify({'error': 'Non connesso a MT5'}), 400
        
        positions = mt5.positions_get()
        if positions is None:
            return jsonify({'positions': []})
        
        positions_list = []
        for pos in positions:
            positions_list.append({
                'ticket': pos.ticket,
                'symbol': pos.symbol,
                'type': pos.type,
                'volume': pos.volume,
                'price_open': pos.price_open,
                'price_current': pos.price_current,
                'profit': pos.profit,
                'swap': pos.swap,
                'comment': pos.comment,
                'magic': pos.magic,
                'time': pos.time
            })
        
        return jsonify({'positions': positions_list})
        
    except Exception as e:
        logger.error(f"Errore ottenimento posizioni: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("=== AI TRADING BOT - MT5 SERVER ===")
    print("Inizializzazione in corso...")
    
    # Inizializza MT5 all'avvio
    if initialize_mt5():
        print("✅ MT5 connesso con successo!")
        print("🚀 Avvio server su porta 8080...")
        print("📡 Il bot può ora ricevere dati in tempo reale da MT5!")
        print("\n💡 IMPORTANTE: Lascia questa finestra aperta!")
        print("   Se la chiudi, il bot non potrà più comunicare con MT5.\n")
        
        try:
            app.run(host='0.0.0.0', port=8080, debug=False)
        except KeyboardInterrupt:
            print("\n🛑 Server fermato dall'utente")
        except Exception as e:
            print(f"\n❌ Errore server: {e}")
    else:
        print("❌ Impossibile connettersi a MT5!")
        print("\n🔧 SOLUZIONI:")
        print("1. Assicurati che MetaTrader 5 sia aperto e connesso")
        print("2. Verifica di essere loggato al tuo account")
        print("3. Controlla che il trading automatico sia abilitato")
        print("4. Riavvia MT5 e riprova")
        input("\nPremi Invio per chiudere...")
