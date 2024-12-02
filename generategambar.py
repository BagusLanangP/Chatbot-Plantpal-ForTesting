from conversation_manager import ConversationManager
import streamlit as st
from komponent import GeneralButton
import requests
from PIL import Image
import io
import base64
from conversation_manager import (
    DEFAULT_API_KEY, 
    DEFAULT_BASE_URL, 
    DEFAULT_MODEL, 
    DEFAULT_TEMPERATURE, 
    DEFAULT_MAX_TOKENS
)

def HasilkanGambar():
    st.title("Generate Tanaman 🪴")
    
    deskripsi_tanaman = st.text_input(
        "Masukkan deskripsi tanaman", 
        placeholder="Contoh: Bunga matahari segar di kebun musim semi"
    )
    
    col1, col2 = st.columns(2)
    
    with col1:
        jumlah_gambar = st.selectbox(
            "Jumlah Gambar",
            [1, 2, 3, 4],
            index=0
        )
    
    with col2:
        resolusi = st.selectbox(
            "Resolusi Gambar",
            ["512x512", "768x768", "1024x1024"]
        )
    
    if GeneralButton.create("Generate Gambar Tanaman"):
        if not deskripsi_tanaman:
            st.warning("Silakan masukkan deskripsi tanaman")
            return
        
        with st.spinner('Generating gambar...'):
            try:
                lebar, tinggi = map(int, resolusi.split('x'))
                
                payload = {
                    "model": "black-forest-labs/FLUX.1-schnell-Free",
                    "prompt": f"Ilustrasikan sebuah gambar dari {deskripsi_tanaman} yang merupakan tanaman, yang dimana jika dari {deskripsi_tanaman} bukan gambar tanaman tampilkan hitam",
                    "max_tokens": 1024,
                    "num_images": jumlah_gambar,
                    "width": lebar,
                    "height": tinggi
                }
                
                response = requests.post(
                    "https://api.together.xyz/v1/images/generations", 
                    json=payload, 
                    headers={
                        "Authorization": f"Bearer {DEFAULT_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    
                    for idx, img_data in enumerate(result.get('data', []), 1):
                        try:
                            img_url = img_data.get('url')
                            
                            if img_url:
                                img_response = requests.get(img_url)
                                img = Image.open(io.BytesIO(img_response.content))
                                
                                st.image(
                                    img, 
                                    caption=f'Gambar Tanaman #{idx}', 
                                    use_column_width=True
                                )
                                
                                buffered = io.BytesIO()
                                img.save(buffered, format="PNG")
                                img_str = base64.b64encode(buffered.getvalue()).decode()
                                st.download_button(
                                    label=f"Download Gambar #{idx}",
                                    data=base64.b64decode(img_str),
                                    file_name=f"tanaman_{idx}.png",
                                    mime="image/png",
                                    help="Klik untuk mengunduh gambar",
                                    type="primary"
                                )
                            else:
                                st.warning(f"Tidak ada URL gambar untuk gambar #{idx}")
                        
                        except Exception as img_error:
                            st.error(f"Gagal memproses gambar #{idx}: {str(img_error)}")
                
                else:
                    st.error(f"Gagal generate gambar (Kode status: {response.status_code})")
                    st.error(f"Detail error: {response.text}")
                
            except requests.RequestException as req_error:
                st.error(f"Kesalahan koneksi: {str(req_error)}")
            except Exception as e:
                st.error(f"Terjadi kesalahan tidak terduga: {str(e)}")
                import traceback
                st.error(traceback.format_exc())
        