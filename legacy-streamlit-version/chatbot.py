from conversation_manager import ConversationManager
import streamlit as st
import base64

# Fungsi untuk mengonversi gambar lokal ke string base64
def get_base64_image(image_path):
    with open(image_path, "rb") as img_file:
        return base64.b64encode(img_file.read()).decode("utf-8")

# Konversi gambar lokal ke base64
image_base64 = get_base64_image("logo.png")  # Pastikan path ke logo.png benar

def Chatbot():
    # CSS untuk styling sambutan
    st.markdown(
        """
        <style>
        .welcome-div {
            background-color: #f4f4f4; /* Warna latar lembut */
            border: 2px solid #8f1f5f1; /* Warna tepi biru */
            border-radius: 10px; /* Sudut melengkung */
            padding: 20px;
            margin-bottom: 20px;
            font-family: 'Arial', sans-serif;
            color: black; /* Warna teks */
            box-shadow: 0px 6px 6px rgba(0, 0, 0, 0.1); /* Efek bayangan */
            text-align: center;
        }
        .welcome-div h2 {
            color: black;
            display: inline-flex; /* Membuat elemen dalam <h2> sejajar */
            align-items: center; /* Menyelaraskan vertikal gambar dan teks */
            gap: 10px; /* Jarak antara teks dan gambar */
        }
        .welcome-div img {
            width: 100px; /* Ukuran gambar */
            height: 100px; /* Ukuran gambar */
        }
        .welcome-div p {
            font-weight: bold; /* Membuat teks dalam <p> menjadi bold */
        }
        </style>
        """,
        unsafe_allow_html=True,
    )
    

    # HTML untuk sambutan dengan gambar
    st.markdown(
        f"""
        <div class="welcome-div">
            <h2> Welcome To PlantBot
            </h2>
            <img src="data:image/png;base64,{image_base64}"
        </div>
        """,
        unsafe_allow_html=True,
    )

    if 'chat_manager' not in st.session_state:
        st.session_state['chat_manager'] = ConversationManager()

    chat_manager = st.session_state['chat_manager']

    user_input = st.chat_input("Tanya aku tentang tanaman....")

    if user_input:
        response = chat_manager.chat_completion(user_input)
        if response:
            st.session_state['conversation_history'] = chat_manager.conversation_history

    for message in chat_manager.conversation_history:
        if message["role"] != "system":
            with st.chat_message(message["role"]):
                st.write(message["content"])
