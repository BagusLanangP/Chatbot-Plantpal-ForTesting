import urllib.parse

async def generate_plant_image(plant_name: str) -> str:
    prompt = f"detailed botanical illustration of {plant_name}, scientific accuracy, vivid colors, white background, high quality"
    encoded = urllib.parse.quote(prompt)
    image_url = f"https://image.pollinations.ai/prompt/{encoded}?width=512&height=512&nologo=true"
    return image_url
