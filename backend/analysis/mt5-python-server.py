"""
MT5 Python Server
This is a separate Python service that connects to MetaTrader 5
and exposes REST API endpoints for the Node.js backend.

Requirements:
pip install MetaTrader5 flask flask-cors

Usage:
python mt5-python-server.py

This will start a Flask server on localhost:8080 that the Node.js backend can call.
"""

import MetaTrader5 as mt5
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MT5 connection status
mt5_connected = False
mt5_account_info = None

def initialize_mt5():
    """Initialize MT5 connection"""
    global mt5_connected, mt5_account_info
    
    try:
        # Initialize MT5
        if not mt5.initialize():
            logger.error("MT5 initialization failed")
            return False
        
        # Get account info
        account_info = mt5.account_info()
        if account_info is None:
            logger.error("Failed to get account info")
            return False
        
        mt5_account_info = account_info._asdict()
        mt5_connected = True
        logger.info(f"MT5 connected successfully. Account: {mt5_account_info['login']}")
        return True
        
    except Exception as e:
        logger.error(f"MT5 initialization error: {e}")
        return False

def login_mt5(login, password, server):
    """Login to MT5 account"""
    global mt5_connected, mt5_account_info
    
    try:
        # Login to account
        if not mt5.login(login, password, server):
            logger.error(f"Login failed for account {login}")
            return False
        
        # Get account info after login
        account_info = mt5.account_info()
        if account_info is None:
            logger.error("Failed to get account info after login")
            return False
        
        mt5_account_info = account_info._asdict()
        mt5_connected = True
        logger.info(f"MT5 login successful. Account: {login}")
        return True
        
    except Exception as e:
        logger.error(f"MT5 login error: {e}")
        return False

@app.route('/status', methods=['GET'])
def get_status():
    """Get MT5 connection status"""
    try:
        if not mt5_connected:
            return jsonify({
                'connected': False,
                'trade_allowed': False,
                'error': 'Not connected to MT5'
            })
        
        # Check if trading is allowed
        account_info = mt5.account_info()
        if account_info is None:
            return jsonify({
                'connected': False,
                'trade_allowed': False,
                'error': 'Failed to get account info'
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
        logger.error(f"Status check error: {e}")
        return jsonify({
            'connected': False,
            'trade_allowed': False,
            'error': str(e)
        }), 500

@app.route('/account', methods=['GET'])
def get_account_info():
    """Get account information"""
    try:
        if not mt5_connected:
            return jsonify({'error': 'Not connected to MT5'}), 400
        
        account_info = mt5.account_info()
        if account_info is None:
            return jsonify({'error': 'Failed to get account info'}), 500
        
        return jsonify({
            'login': account_info.login,
            'server': account_info.server,
            'balance': account_info.balance,
            'equity': account_info.equity,
            'margin': account_info.margin,
            'free_margin': account_info.margin_free,
            'margin_level': account_info.margin_level,
            'currency': account_info.currency,
            'trade_allowed': account_info.trade_allowed,
            'expert_allowed': account_info.trade_expert,
            'company': account_info.company,
            'name': account_info.name
        })
        
    except Exception as e:
        logger.error(f"Account info error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/execute', methods=['POST'])
def execute_trade():
    """Execute a trade order"""
    try:
        if not mt5_connected:
            return jsonify({
                'success': False,
                'error': 'Not connected to MT5',
                'retcode': -1
            }), 400
        
        data = request.json
        
        # Extract order parameters
        login = data.get('login')
        password = data.get('password')
        server = data.get('server')
        symbol = data.get('symbol')
        action = data.get('action')  # 'BUY' or 'SELL'
        volume = float(data.get('volume'))
        price = float(data.get('price', 0))
        sl = float(data.get('sl', 0))
        tp = float(data.get('tp', 0))
        deviation = int(data.get('deviation', 20))
        magic = int(data.get('magic', 234000))
        comment = data.get('comment', 'AI Trading Bot')
        
        # Login if credentials provided
        if login and password and server:
            if not login_mt5(int(login), password, server):
                return jsonify({
                    'success': False,
                    'error': 'Login failed',
                    'retcode': -1
                }), 400
        
        # Prepare order request
        if action == 'BUY':
            order_type = mt5.ORDER_TYPE_BUY
            price = mt5.symbol_info_tick(symbol).ask if price == 0 else price
        else:
            order_type = mt5.ORDER_TYPE_SELL
            price = mt5.symbol_info_tick(symbol).bid if price == 0 else price
        
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
        
        # Send order
        result = mt5.order_send(request_dict)
        
        if result is None:
            return jsonify({
                'success': False,
                'error': 'Order send failed',
                'retcode': -1
            }), 500
        
        result_dict = result._asdict()
        
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
        logger.error(f"Execute trade error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'retcode': -1
        }), 500

@app.route('/positions', methods=['GET'])
def get_positions():
    """Get open positions"""
    try:
        if not mt5_connected:
            return jsonify({'error': 'Not connected to MT5'}), 400
        
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
        logger.error(f"Get positions error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/close', methods=['POST'])
def close_position():
    """Close a position"""
    try:
        if not mt5_connected:
            return jsonify({
                'success': False,
                'error': 'Not connected to MT5'
            }), 400
        
        data = request.json
        ticket = int(data.get('ticket'))
        deviation = int(data.get('deviation', 20))
        
        # Get position info
        position = mt5.positions_get(ticket=ticket)
        if not position:
            return jsonify({
                'success': False,
                'error': 'Position not found'
            }), 404
        
        position = position[0]
        
        # Prepare close request
        if position.type == mt5.POSITION_TYPE_BUY:
            order_type = mt5.ORDER_TYPE_SELL
            price = mt5.symbol_info_tick(position.symbol).bid
        else:
            order_type = mt5.ORDER_TYPE_BUY
            price = mt5.symbol_info_tick(position.symbol).ask
        
        request_dict = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": position.symbol,
            "volume": position.volume,
            "type": order_type,
            "position": ticket,
            "price": price,
            "deviation": deviation,
            "magic": position.magic,
            "comment": "Close by AI Trading Bot",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }
        
        # Send close order
        result = mt5.order_send(request_dict)
        
        if result is None:
            return jsonify({
                'success': False,
                'error': 'Close order failed'
            }), 500
        
        return jsonify({
            'success': result.retcode == mt5.TRADE_RETCODE_DONE,
            'retcode': result.retcode,
            'order': result.order,
            'deal': result.deal,
            'price': result.price,
            'error': result.comment if result.retcode != mt5.TRADE_RETCODE_DONE else None
        })
        
    except Exception as e:
        logger.error(f"Close position error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/symbol_info', methods=['POST'])
def get_symbol_info():
    """Get symbol information"""
    try:
        if not mt5_connected:
            return jsonify({'error': 'Not connected to MT5'}), 400
        
        data = request.json
        symbol = data.get('symbol')
        
        symbol_info = mt5.symbol_info(symbol)
        if symbol_info is None:
            return jsonify({'error': f'Symbol {symbol} not found'}), 404
        
        return jsonify({
            'symbol_info': {
                'name': symbol_info.name,
                'bid': symbol_info.bid,
                'ask': symbol_info.ask,
                'spread': symbol_info.spread,
                'digits': symbol_info.digits,
                'point': symbol_info.point,
                'trade_contract_size': symbol_info.trade_contract_size,
                'trade_tick_value': symbol_info.trade_tick_value,
                'trade_tick_size': symbol_info.trade_tick_size,
                'volume_min': symbol_info.volume_min,
                'volume_max': symbol_info.volume_max,
                'volume_step': symbol_info.volume_step,
                'margin_initial': symbol_info.margin_initial,
                'currency_base': symbol_info.currency_base,
                'currency_profit': symbol_info.currency_profit,
                'currency_margin': symbol_info.currency_margin
            }
        })
        
    except Exception as e:
        logger.error(f"Symbol info error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/tick', methods=['POST'])
def get_tick():
    """Get current tick for symbol"""
    try:
        if not mt5_connected:
            return jsonify({'error': 'Not connected to MT5'}), 400
        
        data = request.json
        symbol = data.get('symbol')
        
        tick = mt5.symbol_info_tick(symbol)
        if tick is None:
            return jsonify({'error': f'No tick data for {symbol}'}), 404
        
        return jsonify({
            'tick': {
                'symbol': symbol,
                'time': tick.time,
                'bid': tick.bid,
                'ask': tick.ask,
                'last': tick.last,
                'volume': tick.volume,
                'spread': tick.ask - tick.bid
            }
        })
        
    except Exception as e:
        logger.error(f"Get tick error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/calc_margin', methods=['POST'])
def calculate_margin():
    """Calculate required margin for a trade"""
    try:
        if not mt5_connected:
            return jsonify({'error': 'Not connected to MT5'}), 400
        
        data = request.json
        symbol = data.get('symbol')
        volume = float(data.get('volume'))
        action = data.get('action', 'BUY')
        
        order_type = mt5.ORDER_TYPE_BUY if action == 'BUY' else mt5.ORDER_TYPE_SELL
        
        margin = mt5.order_calc_margin(order_type, symbol, volume, 0.0)
        
        if margin is None:
            return jsonify({'error': 'Failed to calculate margin'}), 500
        
        return jsonify({'margin': margin})
        
    except Exception as e:
        logger.error(f"Calculate margin error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Initialize MT5 on startup
    if initialize_mt5():
        logger.info("Starting MT5 Python Server on port 8080")
        app.run(host='0.0.0.0', port=8080, debug=False)
    else:
        logger.error("Failed to initialize MT5. Please ensure MetaTrader 5 is installed and running.")
