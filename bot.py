import asyncio
from aiogram import Bot, Dispatcher
from aiogram.filters import Command
from aiogram.types import Message, WebAppInfo
from aiogram.utils.keyboard import InlineKeyboardBuilder
 
BOT_TOKEN = "8850803836:AAEBxvZjnuskJGoXG5U89tXmOpOIgFe3i6U"
ADMIN_IDS = [1460372490]
 
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
 
# Сюда мы потом вставим ссылку из GitHub
WEB_APP_URL = "https://example.com" 
 
@dp.message(Command("start"))
async def cmd_start(message: Message):
    builder = InlineKeyboardBuilder()
    builder.button(
        text="🎮 Играть в Три в ряд", 
        web_app=WebAppInfo(url=WEB_APP_URL)
    )
    await message.answer(
        "Привет! Добро пожаловать в игру!\nНажми кнопку ниже, чтобы начать.",
        reply_markup=builder.as_markup()
    )
 
async def main():
    print("🚀 Бот для игры запущен")
    await dp.start_polling(bot)
 
if __name__ == "__main__":
    asyncio.run(main())
