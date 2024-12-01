import requests
import streamlit as st
from streamlit_option_menu import option_menu
from chatbot import Chatbot
from rekomendasi import Rekomendasi
from deteksi import Deteksi
from conversation_manager import ConversationManager
from komponent import SidebarButton

def local_css(file_name):
    with open(file_name, "r") as f:
        st.markdown(f'<style>{f.read()}</style>', unsafe_allow_html=True)

# Call the function to load the CSS
local_css("plant-styless.css")

def get_instance_id():
    """Retrieve the EC2 instance ID from AWS metadata using IMDSv2."""
    try:
        token = requests.put(
            "http://169.254.169.254/latest/api/token",
            headers={"X-aws-ec2-metadata-token-ttl-seconds": "21600"},
            timeout=1
        ).text

        instance_id = requests.get(
            "http://169.254.169.254/latest/meta-data/instance-id",
            headers={"X-aws-ec2-metadata-token": token},
            timeout=1
        ).text
        return instance_id
    except requests.exceptions.RequestException:
        return "Instance ID not available (running locally or error in retrieval)"

# State initialization
if 'settings_visible' not in st.session_state:
    st.session_state['settings_visible'] = False

if 'default_page' not in st.session_state:
    st.session_state['default_page'] = True  # Ensure main page is shown first

# Sidebar menu
with st.sidebar:
    selected = option_menu(
        "Menu Utama",
        ["Chatbot", "Rekomendasi", "Deteksi"],
        icons=['chat', 'lightbulb', 'search'],
        menu_icon="cast",
        default_index=1,
        styles={
            "container": {"padding": "5px", "background-color": "white"},
            "icons": {
                "color": "#00491e",
                "font-size": "30px",
            },
            "nav-link": {
                "font-size": "16px",
                "color": "#00491e",
                "text-align": "left",
                "margin": "0px",
                "--hover-color": "#f0f0f0",
            },
            "nav-link-selected": {
                "background-color": "#00491e",
                "color": "white",
                "border-radius": "5px",
                "box-shadow": "0 0 10px rgba(0, 0, 0, 0.1)",
            },
            "nav-link-selected-icons": {
                "background-color": "#00491e",
                "color": "white",
                "border-radius": "5px",
                "box-shadow": "0 0 10px rgba(0, 0, 0, 0.1)",
            },
            "menu-title": {
                "font-size": "25px",
                "color": "#00491e",
                "font-weight": "bold",
                "border-bottom": "2px solid #e0e0e0",
            },
        },
    )

    if not st.session_state.settings_visible:
        if SidebarButton.create("Tampilkan Pengaturan"):
            st.session_state.settings_visible = True
            st.experimental_rerun()



if 'chat_manager' not in st.session_state:
    st.session_state['chat_manager'] = ConversationManager()

chat_manager = st.session_state['chat_manager']

# Pengaturan tambahan di sidebar
if st.session_state.settings_visible:
    chat_manager.max_tokens = st.sidebar.slider(
        "Max Tokens Per Message", 10, 500, int(chat_manager.max_tokens), 10
    )
    chat_manager.temperature = st.sidebar.slider(
        "Temperature", 0.0, 1.0, float(chat_manager.temperature), 0.01
    )

    if selected == "Chatbot":
        system_message_option = st.sidebar.selectbox(
            "System Message", ["Default", "Custom"]
        )

        if system_message_option == "Custom":
            custom_system_message = st.sidebar.text_area(
                "Custom System Message", value=chat_manager.system_message
            )
            if st.sidebar.button("Set Custom System Message"):
                chat_manager.system_message = custom_system_message
                st.success("Custom System Message set successfully!")
                chat_manager.reset_conversation_history()

    if SidebarButton.create("Reset Conversation History"):
        chat_manager.reset_conversation_history()
        st.success("Conversation history reset!")

    if SidebarButton.create("Tutup Pengaturan"):
        st.session_state.settings_visible = False
        st.experimental_rerun()

# Halaman utama sebagai default
if st.session_state['default_page'] or not selected:
    st.title("Selamat Datang!")
    st.write("Aplikasi ini memiliki tiga fitur utama:")
    st.markdown("- **Chatbot** untuk interaksi berbasis AI")
    st.markdown("- **Rekomendasi** untuk saran personal")
    st.markdown("- **Deteksi** untuk analisis berbasis data")
    st.write("Pilih salah satu dari menu di sebelah kiri untuk memulai.")
    st.session_state['default_page'] = False  # Disable default page after first view
else:
    # Menampilkan halaman sesuai pilihan
    if selected == "Chatbot":
        Chatbot()
    elif selected == "Rekomendasi":
        Rekomendasi()
    elif selected == "Deteksi":
        Deteksi()
