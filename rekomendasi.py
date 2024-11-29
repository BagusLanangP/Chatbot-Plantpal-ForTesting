import streamlit as st
from conversation_manager import ConversationManager

class GeneralButton:
    @staticmethod
    def create(label, key=None, help=None, use_container_width=False):
        return st.button(
            label, 
            key=key, 
            help=help, 
            use_container_width=use_container_width,
            type="primary"
        )

def Rekomendasi():
    if 'chat_manager' not in st.session_state:
        st.session_state['chat_manager'] = ConversationManager()

    chat_manager = st.session_state['chat_manager']
    st.title("Rekomendasi Tanaman 🪴")
    
    st.markdown("""
    <style>
        /* Mengubah warna teks di dalam text_area */
        div[data-testid="stTextArea"] textarea {
            color: #006400; /* Dark green text */
            background-color: white; /* White background */
        }
        
        /* Mengubah warna label untuk text_area */
        div[data-testid="stTextArea"] label {
            color: #006400; /* Dark green label */
        }
    </style>
""", unsafe_allow_html=True)
            
    col1, col2 = st.columns(2)
    
    with col1:
        lokasi = st.text_area("Masukkan lokasi Anda (misalnya: kota, iklim, dsb.)")

    with col2:
        kriteria = st.text_area("Masukan Jenis / Kriteria Tanaman yang diinginkan")

    status_info = st.empty()

    st.markdown("<div style='margin-top: 20px;'></div>", unsafe_allow_html=True)
    
    if GeneralButton.create("Dapatkan Rekomendasi"):
        if not lokasi or not kriteria:
            status_info.markdown(
                "<div style='background-color: #f4e041; padding: 10px; border-radius: 5px;'>"
                "<b>⚠️ Mohon masukkan lokasi dan kriteria tanaman.</b>"
                "</div>",
                unsafe_allow_html=True
            )
        else:
            status_info.markdown(
                "<div style='background-color: #41b8f4; color: white; padding: 10px; border-radius: 5px;'>"
                "<b>⏳ Sedang Menunggu Response ... 🤖</b>"
                "</div>",
                unsafe_allow_html=True
            )
            
            try:
                col3, col4 = st.columns(2)

                with col3:
                    prompt_lokasi = (
                        f"Jelaskan kondisi lingkungan berdasarkan lokasi {lokasi}. "
                        f"Berikan detail seperti iklim, jenis tanah, kelembaban, atau kondisi relevan lainnya yang memengaruhi tanaman."
                    )
                    response_lokasi = chat_manager.chat_completion(prompt_lokasi)
                    
                    st.text_area(
                        "Analisis Lokasi", 
                        value=response_lokasi if response_lokasi else "Tidak ada respons dari sistem.", 
                        height=500
                    )
                
                with col4:
                    prompt_kriteria = (
                        f"Berikan rekomendasi tanaman yang sesuai dengan kriteria {kriteria}. "
                        f"Sebutkan tanaman yang relevan, penjelasan singkat manfaatnya, dan perawatan dasar yang diperlukan."
                    )
                    response_kriteria = chat_manager.chat_completion(prompt_kriteria)
                    
                    st.text_area(
                        "Rekomendasi Tanaman", 
                        value=response_kriteria if response_kriteria else "Tidak ada respons dari sistem.", 
                        height=500
                    )
                
                status_info.markdown(
                    "<div style='background-color: #4caf50; color: white; padding: 10px; border-radius: 5px;'>"
                    "<b>✅ Analisis selesai. Lihat hasil di bawah.</b>"
                    "</div>",
                    unsafe_allow_html=True
                )
            
            except Exception as e:
                status_info.markdown(
                    f"<div style='background-color: #ff4c4c; color: white; padding: 10px; border-radius: 5px;'>"
                    f"<b>❌ Terjadi kesalahan: {str(e)}</b>"
                    "</div>",
                    unsafe_allow_html=True
                )
    else:
        status_info.markdown(
            "<div style='background-color: #f4e041; padding: 10px; border-radius: 5px;'>"
            "<b>⚠️ Silakan masukkan lokasi dan kriteria tanaman, lalu klik 'Dapatkan Rekomendasi'.</b>"
            "</div>",
            unsafe_allow_html=True
        )
        