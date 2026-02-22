# Setup Guide

Complete setup instructions for the Supermarket Sales Analysis System.

## Quick Start (Windows)

1. **Install Prerequisites** (see below)
2. **Install PostgreSQL** and create database `supermarket_db`
3. **Backend Setup:**
   ```cmd
   cd backend
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   ```
4. **Create `.env` file** in `backend/` folder with database credentials
5. **Run migrations:**
   ```cmd
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py runserver
   ```
6. **Frontend Setup:**
   ```cmd
   cd ..\frontend
   npm install
   npm run dev
   ```

---

## Prerequisites

- Python 3.9 or higher
- PostgreSQL 12 or higher
- Node.js 16 or higher (for frontend)
- Git

### Windows-Specific Prerequisites

- **PostgreSQL**: Download and install from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
- **Python**: Download from [Python Downloads](https://www.python.org/downloads/) (make sure to check "Add Python to PATH" during installation)
- **Node.js**: Download from [Node.js Downloads](https://nodejs.org/)
- **Git**: Download from [Git for Windows](https://git-scm.com/download/win)

---

## Backend Setup (Django)

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/sales-analysis.git
cd sales-analysis
```

### 2. Create Virtual Environment

```bash
cd backend
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

If `requirements.txt` doesn't exist, install these:

```bash
pip install django djangorestframework django-cors-headers psycopg2-binary python-dotenv
```

### 4. Setup PostgreSQL Database

**On Windows:**
1. Open **pgAdmin** (installed with PostgreSQL) or use **psql** from Command Prompt
2. Connect to PostgreSQL server (default password is what you set during installation)
3. Run the following SQL commands:

**On Linux/Mac:**
Open terminal and run:
```bash
sudo -u postgres psql
```

**Create database (run in psql or pgAdmin SQL query tool):**

```sql
CREATE DATABASE supermarket_db;
CREATE USER postgres WITH PASSWORD 'your_password';
ALTER USER postgres WITH SUPERUSER;
```

**Note:** If you're using the default `postgres` user, you can skip creating a new user and just create the database. Make sure to use the same username and password in your `.env` file.

### 5. Configure Environment Variables

Create `.env` file in `backend/` directory:

**On Windows:**
- Open Notepad or any text editor
- Create a new file and save it as `.env` in the `backend` folder
- Make sure the file extension is `.env` (not `.env.txt`)

**On Linux/Mac:**
```bash
cd backend
touch .env
```

Add the following content to the `.env` file:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=supermarket_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

**Note:** Replace `your_password` with the password you set when installing PostgreSQL.

### 6. Run Migrations

```bash
python manage.py migrate
```

### 7. Create Superuser

```bash
python manage.py createsuperuser
```

### 8. Run Development Server

```bash
python manage.py runserver
```

Backend will be available at: `http://localhost:8000`

---

## Frontend Setup (React)

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure API URL (Optional)

If you need to change the API URL, create `.env` file in `frontend/`:

**On Windows:**
- Open Notepad and create a new file
- Save it as `.env` in the `frontend` folder

**On Linux/Mac:**
```bash
touch .env
```

Add the following content:

```env
VITE_API_URL=http://localhost:8000/api
```

**Note:** The default API URL is `http://localhost:8000/api`, so you only need to create this file if you're using a different backend URL.

### 4. Run Development Server

```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173` (Vite default port)

---

## ML Module Setup

### 1. Navigate to ML Module

```bash
cd backend/ml_module
```

### 2. Install ML Dependencies

Add to `backend/requirements.txt`:

```
pandas
numpy
scikit-learn
```

Then install:

```bash
pip install pandas numpy scikit-learn
```

### 3. Test ML Module

Create test file `test_predict.py`:

```python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'supermarket_analysis.settings')
django.setup()

from predict import predict_demand

# Test prediction
result = predict_demand(product_id=1, shop_id=1, days=7)
print(result)
```

Run:

```bash
python test_predict.py
```

---

---

## Database Setup

### Load Sample Data (Optional)

```bash
python manage.py loaddata fixtures/sample_data.json
```

Or create data via Django admin:
1. Go to `http://localhost:8000/admin`
2. Login with superuser
3. Create shops, products, categories, etc.

---

## Project Structure

```
sales-analysis/
├── backend/
│   ├── apps/
│   │   ├── accounts/
│   │   ├── shops/
│   │   ├── products/
│   │   ├── sales/
│   │   ├── inventory/
│   │   ├── transfers/
│   │   └── analytics/
│   ├── ml_module/          # ML person works here
│   │   ├── __init__.py
│   │   └── predict.py
│   ├── manage.py
│   └── requirements.txt
└── frontend/
    ├── src/
    └── package.json
```

---

## Troubleshooting

### Database Connection Error

- Check PostgreSQL is running
- Verify database credentials in `.env`
- Ensure database exists

### Port Already in Use

**On Windows:**
```cmd
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with the number from above)
taskkill /PID <PID> /F

# Or use different port
python manage.py runserver 8001
```

**On Linux/Mac:**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use different port
python manage.py runserver 8001
```

### Module Not Found

- Ensure virtual environment is activated
- Install missing dependencies: `pip install <package>`

### Migration Errors

```bash
# Reset migrations (careful - deletes data!)
python manage.py migrate --run-syncdb
```

---

## Next Steps

1. Read [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for database structure
2. Read [ML_INTERFACE.md](ML_INTERFACE.md) for ML function specs
3. Read [API_ENDPOINTS.md](API_ENDPOINTS.md) for API documentation
4. Read [COLLABORATION.md](COLLABORATION.md) for workflow

---

## Questions?

Contact the full-stack developer or create an issue on GitHub.

