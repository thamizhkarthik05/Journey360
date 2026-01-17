# How to Run Journey360

## Prerequisites
- MongoDB Compass (running locally on port 27017)
- Node.js
- Python

## 1. Start the Database
Open MongoDB Compass and connect to `mongodb://localhost:27017`.

## 2. Start the Backend
Open a terminal in the `Journey360` root:
```powershell
cd backend
venv\Scripts\activate
uvicorn main:app --reload
```
*Backend runs on: http://127.0.0.1:8000*

## 3. Start the Frontend
Open a **new** terminal in the `Journey360` root:
```powershell
cd frontend
npm run dev
```
*Frontend runs on: http://localhost:5173*

## 4. Test
Go to http://localhost:5173, log in, and click "Ping Backend".
