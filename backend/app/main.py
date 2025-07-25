from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from training.router import router as training_router
from prediction.router import router as prediction_router
from db.router import router as db_router
from train_prediciton_save.router import router as train_prediction_save_router
from train_predict_for_n8n.router import router as train_predict_n8n_router
from excel_parsing.router import router as parse_excel_router 
from logs.router import router as logs_router
from instruction.router import router as instruction_router
from contextlib import asynccontextmanager
import logging
from logging.handlers import TimedRotatingFileHandler
import os
import asyncio
from utils.cleanup import cleanup_old_training_sessions
from dotenv import load_dotenv
from pathlib import Path


async def periodic_cleanup():
    while True:
        cleanup_old_training_sessions(training_sessions_dir)
        await asyncio.sleep(60 * 60 * 24)  # запускать раз в сутки


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(periodic_cleanup())
    try:
        yield
    finally:
        task.cancel()

app = FastAPI(
    title="Time Series Analysis API",
    description="Backend API for Time Series Analysis Application",
    version="1.0.0",
    lifespan=lifespan
)

# Путь к файлу .env
ENV_PATH = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=ENV_PATH, override=True)

# Получаем список origins из переменной окружения FRONTEND_URL
frontend_urls = os.getenv("FRONTEND_URL", "http://localhost:5173").split(",")
frontend_urls = [url.strip() for url in frontend_urls if url.strip()]

# Настройка CORS для работы с фронтендом
app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_urls,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

log_dir = 'logs'
os.makedirs(log_dir, exist_ok=True)
log_path = os.path.join(log_dir, 'app.log')
handler = TimedRotatingFileHandler(log_path, when='midnight', interval=1, backupCount=7, encoding='utf-8')
formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(name)s: %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
handler.setFormatter(formatter)
logging.basicConfig(level=logging.INFO, handlers=[handler])

training_sessions_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'training_sessions')
os.makedirs(training_sessions_dir, exist_ok=True)

cleanup_old_training_sessions(training_sessions_dir)

@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "Time Series Analysis API is running"
    }

app.include_router(training_router)
app.include_router(train_prediction_save_router)
app.include_router(train_predict_n8n_router)
app.include_router(prediction_router)
app.include_router(db_router)
app.include_router(logs_router)
app.include_router(instruction_router)
app.include_router(parse_excel_router)