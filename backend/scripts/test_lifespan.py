import asyncio
from app.main import lifespan, app


async def main():
    print("Entering lifespan...")
    async with lifespan(app):
        print("Inside lifespan!")
    print("Exited lifespan!")

if __name__ == "__main__":
    asyncio.run(main())
