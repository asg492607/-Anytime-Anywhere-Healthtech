import os
import json
import random
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__, static_folder='.', static_url_path='', template_folder='.')

database_url = os.environ.get('DATABASE_URL', 'sqlite:///investments.db')
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class Stock(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ticker = db.Column(db.String(10), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    change_percent = db.Column(db.Float, nullable=False, default=0.0)

    def to_dict(self):
        change_str = f"+{self.change_percent:.2f}%" if self.change_percent >= 0 else f"{self.change_percent:.2f}%"
        return {
            "id": self.id,
            "ticker": self.ticker,
            "name": self.name,
            "price": self.price,
            "change": change_str
        }

class InvestmentStrategy(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    allocations = db.Column(db.Text, nullable=False, default="{}")
    start_value = db.Column(db.Float, nullable=False, default=10000.0)
    current_value = db.Column(db.Float, nullable=False, default=10000.0)

    def to_dict(self):
        profit = self.current_value - self.start_value
        profit_percent = (profit / self.start_value) * 100 if self.start_value else 0
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "allocations": json.loads(self.allocations),
            "start_value": self.start_value,
            "current_value": self.current_value,
            "profit": profit,
            "profit_percent": profit_percent
        }

class UserWish(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ticker = db.Column(db.String(10), nullable=False)
    target_price = db.Column(db.Float, nullable=False)
    notes = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "ticker": self.ticker,
            "target_price": self.target_price,
            "notes": self.notes
        }

with app.app_context():
    db.create_all()
    
    if not Stock.query.first():
        initial_stocks = [
            {"ticker": "ACM", "name": "Acme Corp", "price": 150.25},
            {"ticker": "INI", "name": "Initech", "price": 45.10},
            {"ticker": "GLB", "name": "Globex", "price": 305.50},
            {"ticker": "VDE", "name": "Vandelay Ind.", "price": 12.75},
            {"ticker": "SSP", "name": "Stark Ind.", "price": 890.00},
            {"ticker": "WAY", "name": "Wayne Ent.", "price": 450.20},
            {"ticker": "OCP", "name": "Omni Consumer", "price": 85.00},
            {"ticker": "SOY", "name": "Soylent Corp", "price": 12.50},
            {"ticker": "TYR", "name": "Tyrell Corp", "price": 1500.00},
            {"ticker": "DUM", "name": "Dunder Mifflin", "price": 42.00}
        ]
        for s in initial_stocks:
            db.session.add(Stock(ticker=s['ticker'], name=s['name'], price=s['price']))
        db.session.commit()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/stocks', methods=['GET'])
def get_stocks():
    stocks = Stock.query.all()
    return jsonify([s.to_dict() for s in stocks])

@app.route('/api/strategies', methods=['GET', 'POST'])
def manage_strategies():
    if request.method == 'POST':
        data = request.json
        name = data.get('name')
        if not name:
            return jsonify({"error": "Name is required"}), 400
            
        allocs = data.get('allocations', {})
        total_weight = sum(float(w) for w in allocs.values())
        if total_weight != 100:
            return jsonify({"error": "Total allocation must equal 100%"}), 400

        new_strat = InvestmentStrategy(
            name=name,
            description=data.get('description', ''),
            allocations=json.dumps(allocs)
        )
        db.session.add(new_strat)
        db.session.commit()
        return jsonify(new_strat.to_dict()), 201
        
    strats = InvestmentStrategy.query.all()
    return jsonify([s.to_dict() for s in strats])

@app.route('/api/strategies/<int:id>', methods=['DELETE'])
def delete_strategy(id):
    s = InvestmentStrategy.query.get_or_404(id)
    db.session.delete(s)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200

@app.route('/api/wishes', methods=['GET', 'POST'])
def manage_wishes():
    if request.method == 'POST':
        data = request.json
        w = UserWish(
            ticker=data.get('ticker'),
            target_price=data.get('target_price'),
            notes=data.get('notes', '')
        )
        db.session.add(w)
        db.session.commit()
        return jsonify(w.to_dict()), 201
        
    return jsonify([w.to_dict() for w in UserWish.query.all()])

@app.route('/api/wishes/<int:id>', methods=['DELETE'])
def delete_wish(id):
    w = UserWish.query.get_or_404(id)
    db.session.delete(w)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200

@app.route('/api/simulate', methods=['POST'])
def simulate_market():
    stocks = Stock.query.all()
    stock_changes = {}
    
    for stock in stocks:
        change_pct = random.uniform(-5.0, 5.0)
        stock.change_percent = change_pct
        multiplier = 1 + (change_pct / 100.0)
        stock.price = stock.price * multiplier
        stock_changes[stock.ticker] = multiplier
        
    db.session.commit()
    
    strategies = InvestmentStrategy.query.all()
    for strat in strategies:
        allocs = json.loads(strat.allocations)
        new_value = 0
        
        for ticker, percent in allocs.items():
            weight = float(percent) / 100.0
            portion_value = strat.current_value * weight
            mult = stock_changes.get(ticker, 1.0)
            new_value += (portion_value * mult)
            
        if new_value > 0:
            strat.current_value = new_value
            
    db.session.commit()
    
    return jsonify({"message": "Simulation advanced one day"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
