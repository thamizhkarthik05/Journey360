@echo off
TITLE Journey360 One-Click Setup

echo ===================================================
echo      Journey360 - One-Click Setup & Run
echo ===================================================

:: 1. Generate Backend Environment
echo [+] Configuring Backend...
(
echo MONGO_URI=mongodb+srv://admin:password%%40123@cluster1.j1rm7ox.mongodb.net/journey360?retryWrites=true^&w=majority^&appName=Cluster1
echo OPENROUTE_API_KEY=eyJvcmciOiI1YjNjZTM1OTc1MTExMTAwMDFjZjYyNDgiLCJpZCI6IjI2YmZiOGE0MzYwYzRmN2NhZGFlYzljZjFmMDU0MWYzIiwiaCI6Im11cm11cjY0In0=
echo OPENWEATHER_API_KEY=5bc3705c60a3b76511a322297ee9a4fe
echo OPENROUTER_API_KEY=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
echo GEMINI_API_KEY=AIzaSyDDLDgych7M_GWViVwEh06tqfiOF6jg-xY
echo MOCK_AI=false
echo OFFLINE_MODE=false
echo SERPAPI_API_KEY=67930a68d795c4977b423c6d956e2fe1bc9f67d2eb7a0d897dc5b837d91f0e56
echo SMTP_EMAIL=codes.burners@gmail.com
echo SMTP_PASSWORD="ehba xhtw vldo kjbk"
echo NEWS_API_KEY=5c05a3e7fc904f60a0b5cfbcbfb2e246
) > backend\.env

:: 2. Generate Frontend Environment
echo [+] Configuring Frontend...
(
echo VITE_FIREBASE_API_KEY=AIzaSyBwJkJUFXrCW_FuK48YVo3ds0hC_yU1KYc
echo VITE_FIREBASE_AUTH_DOMAIN=journey360.firebaseapp.com
echo VITE_FIREBASE_PROJECT_ID=journey360
echo VITE_FIREBASE_STORAGE_BUCKET=journey360.firebasestorage.app
echo VITE_FIREBASE_MESSAGING_SENDER_ID=1061186243288
echo VITE_FIREBASE_APP_ID=1:1061186243288:web:d0a71c10dddb87fbd265ad
echo VITE_FIREBASE_MEASUREMENT_ID=G-063Y715FQZ
echo VITE_BACKEND_URL=http://localhost:8001
) > frontend\.env

:: 3. Launch Services
echo [+] Launching Backend Server...
start "Journey360 Backend" cmd /k "cd backend && echo Installing Python Dependencies... && pip install -r requirements.txt && echo Starting Server... && uvicorn main:app --reload --host 0.0.0.0 --port 8001"

echo [+] Launching Frontend Server...
start "Journey360 Frontend" cmd /k "cd frontend && echo Installing Node Dependencies... && npm install && echo Starting Client... && npm run dev"

echo.
echo ===================================================
echo    App is starting! Check the new windows.
echo    Once ready, open: http://localhost:5173
echo ===================================================
pause
