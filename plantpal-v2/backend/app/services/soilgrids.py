import httpx

async def get_soil_data(lat: float, lon: float) -> dict:
    url = "https://rest.isric.org/soilgrids/v2.0/properties/query"
    params = {
        "lon": lon,
        "lat": lat,
        "property": ["phh2o", "clay", "sand", "soc"],
        "depth": "0-5cm",
        "value": "mean"
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(url, params=params)
            if response.status_code != 200:
                return {"error": "SoilGrids data not available"}
            data = response.json()
        
        properties = {}
        for layer in data.get("properties", {}).get("layers", []):
            name = layer.get("name")
            depths = layer.get("depths", [])
            if depths:
                mean_val = depths[0].get("values", {}).get("mean")
                if mean_val is not None:
                    if name == "phh2o":
                        properties["ph"] = mean_val / 10
                    elif name == "clay":
                        properties["clay_percent"] = mean_val / 10
                    elif name == "sand":
                        properties["sand_percent"] = mean_val / 10
                    elif name == "soc":
                        properties["organic_carbon"] = mean_val / 10
        return properties
    except Exception:
        return {"error": "SoilGrids data not available"}
