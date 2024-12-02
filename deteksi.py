from conversation_manager import ConversationManager
import streamlit as st
from openai import OpenAI
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

def Deteksi():
    st.title("Deteksi Tanaman 🪴")
    st.write("Upload gambar tanamanmu untuk mendapatkan klasifikasi jenis tanaman, manfaat, tips perawatan dan info menarik lainnya 😊 ")
    client = OpenAI(
        api_key=DEFAULT_API_KEY,
        base_url=DEFAULT_BASE_URL
    )
    
    # Tampilkan peringatan di atas komponen file uploader
    if 'uploaded_file_warning_shown' not in st.session_state:
        st.session_state.uploaded_file_warning_shown = False

    if not st.session_state.uploaded_file_warning_shown:
        st.markdown(
            """
            <div style='background-color: #f4e041; padding: 10px; border-radius: 5px; margin-bottom: 20px; margin-top: 20px;'>
            <b>⚠️ Silakan unggah gambar tanaman untuk memulai analisis</b>
            </div>
            """,
            unsafe_allow_html=True
        )

    # Komponen unggah file
    uploaded_file = st.file_uploader("Unggah gambar tanaman (format .jpg atau .png)", type=['png', 'jpg', 'jpeg'])

    # Periksa apakah file sudah diunggah
    if uploaded_file:
        st.session_state.uploaded_file_warning_shown = True  # Nonaktifkan peringatan
        try:
            # Tampilkan gambar yang diunggah
            image = Image.open(uploaded_file)
            st.image(image, caption='Gambar yang diunggah', use_column_width=True)

            # Encode gambar ke base64
            buffered = io.BytesIO()
            image.save(buffered, format="JPEG")
            img_str = base64.b64encode(buffered.getvalue()).decode()

            # Tombol analisis
            if st.button("Analisis Tanaman"):
                with st.spinner('Menganalisis gambar...'):
                    try:
                        response = client.chat.completions.create(
                            model=DEFAULT_MODEL,
                            messages=[
                                {
                                    "role": "user",
                                    "content": [
                                        {
                                            "type": "text", 
                                            "text": """Identifikasi jenis daun atau tanaman dalam gambar. 
                                            Berikan informasi detail dalam bahasa Indonesia:
                                            1. Nama tanaman (umum & ilmiah)
                                            2. Ciri-ciri khusus daun
                                            3. Manfaat dan kegunaan tanaman
                                            4. Habitat alami
                                            5. Tips perawatan"""
                                        },
                                        {
                                            "type": "image_url",
                                            "image_url": {
                                                "url": f"data:image/jpeg;base64,{img_str}"
                                            }
                                        }
                                    ]
                                }
                            ],
                            max_tokens=DEFAULT_MAX_TOKENS,
                            temperature=DEFAULT_TEMPERATURE
                        )
                        
                        result = response.choices[0].message.content
                        
                        # Tab hasil analisis
                        tab1, tab2, tab3 = st.tabs([
                            "Identifikasi Tanaman", 
                            "Manfaat", 
                            "Tips Perawatan"
                        ])

                        sections = result.split('\n\n')

                        with tab1:
                            st.write("### Identifikasi Tanaman")
                            st.write(sections[0] if sections else "Informasi tidak tersedia")
                        
                        with tab2:
                            st.write("### Manfaat Tanaman")
                            st.write(sections[1] if len(sections) > 1 else "Manfaat tidak teridentifikasi")
                        
                        with tab3:
                            st.write("### Tips Perawatan")
                            st.write(sections[2] if len(sections) > 2 else "Tips perawatan tidak tersedia")

                    except Exception as e:
                        st.error(f"Terjadi kesalahan dalam analisis: {str(e)}")
        except Exception as e:
            st.error(f"File yang diunggah tidak valid: {str(e)}")
