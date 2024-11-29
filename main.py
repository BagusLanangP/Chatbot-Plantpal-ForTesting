import requests
import streamlit as st
from streamlit_option_menu import option_menu
from chatbot import Chatbot
from rekomendasi import Rekomendasi
from conversation_manager import ConversationManager


class SidebarButton:
    @staticmethod
    def create(label, key=None, help=None, use_container_width=False):
        return st.sidebar.button(
            label, 
            key=key, 
            help=help, 
            use_container_width=use_container_width,
            type="secondary"
        )

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
        

def local_css(file_name):
    with open(file_name, "r") as f:
        st.markdown(f'<style>{f.read()}</style>', unsafe_allow_html=True)
# Call the function to load the CSS
local_css("plant-styles.css")

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


if 'settings_visible' not in st.session_state:
    st.session_state['settings_visible'] = False

with st.sidebar:
    selected = option_menu(
        "Menu Utama",
        ["Chatbot", "Rekomendasi", "Deteksi"],
        icons=['chat', 'lightbulb', 'search'],
        menu_icon="cast",
        default_index=0,
    )

    if not st.session_state.settings_visible:
        if SidebarButton.create("Tampilkan Pengaturan"):
            st.session_state.settings_visible = True
            st.experimental_rerun()

if 'chat_manager' not in st.session_state:
    st.session_state['chat_manager'] = ConversationManager()

chat_manager = st.session_state['chat_manager']

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
        

if selected == "Chatbot":
        Chatbot()
elif selected == "Rekomendasi":
        Rekomendasi()