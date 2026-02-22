# Windows Setup Guide

Quick setup guide for running the Sales Analysis System on Windows without Docker.

## Prerequisites Installation

1. **Python 3.9+**
   - Download from: https://www.python.org/downloads/
   - ⚠️ **Important**: Check "Add Python to PATH" during installation
   - Verify: Open Command Prompt and run `python --version`

2. **PostgreSQL 12+**
   - Download from: https://www.postgresql.org/download/windows/
   - Remember the password you set for the `postgres` user
   - Verify: Open pgAdmin or Command Prompt and run `psql --version`

3. **Node.js 16+**
   - Download from: https://nodejs.org/
   - Verify: Open Command Prompt and run `node --version`

4. **Git** (Optional, if cloning from repository)
   - Download from: https://git-scm.com/download/win

## Step-by-Step Setup

### 1. Database Setup

1. Open **pgAdmin** (installed with PostgreSQL)
2. Connect to your PostgreSQL server (use the password you set during installation)
3. Right-click on "Databases" → "Create" → "Database"
4. Name: `supermarket_db`
5. Click "Save"

Alternatively, use Command Prompt:
```cmd
psql -U postgres
```
Then run:
```sql
CREATE DATABASE supermarket_db;
\q
```

### 2. Backend Setup

1. Open Command Prompt and navigate to the project:
   ```cmd
   cd C:\path\to\sales-analysis\backend
   ```

2. Create virtual environment:
   ```cmd
   python -m venv venv
   ```

3. Activate virtual environment:
   ```cmd
   venv\Scripts\activate
   ```
   You should see `(venv)` in your prompt.

4. Install dependencies:
   ```cmd
   pip install -r requirements.txt
   ```

5. Create `.env` file:
   - Open Notepad
   - Copy and paste the following (replace `your_password` with your PostgreSQL password):
   ```
   SECRET_KEY=your-secret-key-here-change-this-in-production
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   DB_NAME=supermarket_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   ```
   - Save as `.env` in the `backend` folder
   - ⚠️ **Important**: When saving in Notepad, select "All Files" in the file type dropdown, or the file will be saved as `.env.txt`

6. Run migrations:
   ```cmd
   python manage.py migrate
   ```

7. Create superuser (admin account):
   ```cmd
   python manage.py createsuperuser
   ```
   Follow the prompts to create your admin account.

8. Start the backend server:
   ```cmd
   python manage.py runserver
   ```
   Backend will run at: http://localhost:8000

### 3. Frontend Setup

1. Open a **new** Command Prompt window (keep backend running)

2. Navigate to frontend:
   ```cmd
   cd C:\path\to\sales-analysis\frontend
   ```

3. Install dependencies:
   ```cmd
   npm install
   ```

4. (Optional) Create `.env` file if you need to change API URL:
   - Open Notepad
   - Add: `VITE_API_URL=http://localhost:8000/api`
   - Save as `.env` in the `frontend` folder

5. Start the frontend:
   ```cmd
   npm run dev
   ```
   Frontend will run at: http://localhost:5173

## Running the Application

1. **Backend**: Keep the first Command Prompt window open with `python manage.py runserver`
2. **Frontend**: Keep the second Command Prompt window open with `npm run dev`
3. **Browser**: Open http://localhost:5173

## Troubleshooting

### "python is not recognized"
- Python is not in PATH. Reinstall Python and check "Add Python to PATH"
- Or use full path: `C:\Python3x\python.exe`

### "psql is not recognized"
- PostgreSQL bin folder is not in PATH
- Add `C:\Program Files\PostgreSQL\15\bin` to your PATH environment variable
- Or use pgAdmin instead

### "Port 8000 already in use"
```cmd
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F
```

### "Cannot connect to database"
- Check PostgreSQL service is running: Services → PostgreSQL
- Verify database name, username, and password in `.env` file
- Check if PostgreSQL is listening on port 5432

### ".env file not working"
- Make sure the file is named exactly `.env` (not `.env.txt`)
- Make sure it's in the `backend` folder (not root folder)
- Restart the Django server after creating/modifying `.env`

### "Module not found" errors
- Make sure virtual environment is activated (you should see `(venv)` in prompt)
- Run `pip install -r requirements.txt` again

## Next Steps

- Access Django admin: http://localhost:8000/admin
- Login with your superuser credentials
- Create shops, products, and other data through the admin panel
- Or use the frontend application at http://localhost:5173

