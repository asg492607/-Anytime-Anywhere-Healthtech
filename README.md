# QuantumInvest

QuantumInvest is a lightweight web application designed to help users simulate stock market investments, create portfolio strategies, and track their financial wishes.

## Features

- **Live Market Overview**: Track simulated, fictional companies and their current market performance.
- **Investment Strategies**: Design and manage custom portfolio allocations based on your risk tolerance.
- **Wishes & Goals**: Set target entry prices and keep a watchlist of companies you're interested in.
- **Premium UI**: Built with a sleek, vibrant dark-mode interface featuring glassmorphism elements.

## Tech Stack

- **Backend**: Python, Flask, Flask-SQLAlchemy (SQLite for local, easily swappable to PostgreSQL)
- **Frontend**: Vanilla HTML, CSS (Custom Variables, Flexbox/Grid), and Vanilla JavaScript
- **Deployment**: Ready for Render deployment with included `Procfile` and `requirements.txt`.

## How to Run Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/asg492607/-Anytime-Anywhere-Healthtech.git
   cd -Anytime-Anywhere-Healthtech
   ```

2. **Create a virtual environment** (Optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**:
   ```bash
   python app.py
   ```

5. **View the app**:
   Open your browser and navigate to `http://127.0.0.1:5000`

## Deployment

This application is ready to be deployed as a **Web Service** on Render. 
- It uses `gunicorn` as the web server, defined in the `Procfile`.
- It will automatically detect Python and install the required dependencies.
