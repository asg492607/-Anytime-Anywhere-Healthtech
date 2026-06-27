import os
from flask import Flask,render_template,request,jsonify
from flask_sqlalchemy import SQLAlchemy
app=Flask(__name__,static_folder='.',static_url_path='',template_folder='.')
app.config['SQLALCHEMY_DATABASE_URI']=os.environ.get('DATABASE_URL','sqlite:///investments.db')
if app.config['SQLALCHEMY_DATABASE_URI'].startswith("postgres://"):app.config['SQLALCHEMY_DATABASE_URI']=app.config['SQLALCHEMY_DATABASE_URI'].replace("postgres://","postgresql://",1)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS']=False
db=SQLAlchemy(app)
class InvestmentStrategy(db.Model):
 id=db.Column(db.Integer,primary_key=True);strategy_name=db.Column(db.String(100),nullable=False);strategy_description=db.Column(db.Text,nullable=True);portfolio_allocation=db.Column(db.String(255),nullable=True)
 def to_dict(self):return {"id":self.id,"name":self.strategy_name,"description":self.strategy_description,"allocation":self.portfolio_allocation}
class UserWish(db.Model):
 id=db.Column(db.Integer,primary_key=True);company_ticker=db.Column(db.String(10),nullable=False);target_entry_price=db.Column(db.Float,nullable=False);additional_notes=db.Column(db.Text,nullable=True)
 def to_dict(self):return {"id":self.id,"ticker":self.company_ticker,"target_price":self.target_entry_price,"notes":self.additional_notes}
with app.app_context():
 db.create_all()
 if not InvestmentStrategy.query.first():db.session.add(InvestmentStrategy(strategy_name="Safe & Steady",strategy_description="Low risk dummy strategy",portfolio_allocation="60% GLB, 40% VDE"));db.session.add(InvestmentStrategy(strategy_name="Aggressive Growth",strategy_description="High risk dummy strategy",portfolio_allocation="80% SSP, 20% WAY"));db.session.commit()
 if not UserWish.query.first():db.session.add(UserWish(company_ticker="ACM",target_entry_price=120.50,additional_notes="Buy when it dips"));db.session.add(UserWish(company_ticker="INI",target_entry_price=60.00,additional_notes="Sell if it hits 60"));db.session.commit()
MOCK_STOCK_MARKET_DATA=[{"ticker":"ACM","name":"Acme Corp","price":150.25,"change":"+1.5%"},{"ticker":"INI","name":"Initech","price":45.10,"change":"-2.3%"},{"ticker":"GLB","name":"Globex","price":305.50,"change":"+0.4%"},{"ticker":"VDE","name":"Vandelay Ind.","price":12.75,"change":"+5.1%"},{"ticker":"SSP","name":"Stark Ind.","price":890.00,"change":"-1.2%"},{"ticker":"WAY","name":"Wayne Ent.","price":450.20,"change":"+2.8%"}]
@app.route('/')
def load_index_page():return render_template('index.html')
@app.route('/api/stocks',methods=['GET'])
def get_market_stocks():return jsonify(MOCK_STOCK_MARKET_DATA)
@app.route('/api/strategies',methods=['GET','POST'])
def manage_investment_strategies():
 if request.method=='POST':
  incoming_request_data=request.json;new_investment_strategy=InvestmentStrategy(strategy_name=incoming_request_data.get('name'),strategy_description=incoming_request_data.get('description',''),portfolio_allocation=incoming_request_data.get('allocation',''));db.session.add(new_investment_strategy);db.session.commit();return jsonify(new_investment_strategy.to_dict()),201
 return jsonify([existing_strategy.to_dict() for existing_strategy in InvestmentStrategy.query.all()])
@app.route('/api/strategies/<int:strategy_id>',methods=['DELETE'])
def delete_investment_strategy(strategy_id):strategy_record=InvestmentStrategy.query.get_or_404(strategy_id);db.session.delete(strategy_record);db.session.commit();return jsonify({"message":"Strategy deleted"}),200
@app.route('/api/wishes',methods=['GET','POST'])
def manage_user_wishes():
 if request.method=='POST':
  incoming_request_data=request.json;new_user_wish=UserWish(company_ticker=incoming_request_data.get('ticker'),target_entry_price=incoming_request_data.get('target_price'),additional_notes=incoming_request_data.get('notes',''));db.session.add(new_user_wish);db.session.commit();return jsonify(new_user_wish.to_dict()),201
 return jsonify([existing_wish.to_dict() for existing_wish in UserWish.query.all()])
@app.route('/api/wishes/<int:wish_id>',methods=['DELETE'])
def delete_user_wish(wish_id):wish_record=UserWish.query.get_or_404(wish_id);db.session.delete(wish_record);db.session.commit();return jsonify({"message":"Wish deleted"}),200
if __name__=='__main__':app.run(debug=True,host='0.0.0.0',port=5000)
