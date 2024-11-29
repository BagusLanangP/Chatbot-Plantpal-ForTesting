from openai import OpenAI
import tiktoken
import requests
import os
import streamlit as st
from streamlit_option_menu import option_menu
from PIL import Image
import io
import base64

def local_css(file_name):
    with open(file_name, "r") as f:
        st.markdown(f'<style>{f.read()}</style>', unsafe_allow_html=True)

# Call the function to load the CSS
local_css("plant-styles.css")

DEFAULT_API_KEY = "ca794fa8d9705ac719ae1011e88393e788239889bbc8b193f32d3bca596ee378"
DEFAULT_BASE_URL = "https://api.together.xyz/v1"
DEFAULT_MODEL = "meta-llama/Llama-Vision-Free"
DEFAULT_TEMPERATURE = 0.7
DEFAULT_MAX_TOKENS = 500
DEFAULT_TOKEN_BUDGET = 4096


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
        
class ConversationManager:
    def __init__(self, api_key=None, base_url=None, model=None, temperature=None, max_tokens=None, token_budget=None):
        if not api_key:
            api_key = DEFAULT_API_KEY
        if not base_url:
            base_url = DEFAULT_BASE_URL
            
        self.client = OpenAI(api_key=api_key, base_url=base_url)

        self.model = model if model else DEFAULT_MODEL
        self.temperature = temperature if temperature else DEFAULT_TEMPERATURE
        self.max_tokens = max_tokens if max_tokens else DEFAULT_MAX_TOKENS
        self.token_budget = token_budget if token_budget else DEFAULT_TOKEN_BUDGET
        
        self.system_message = """You are a knowledgeable botanical expert and guide focused exclusively on plants and vegetation.
                                Your knowledge covers:
                                - Plant species and families
                                - Plant care and cultivation
                                - Plant biology and lifecycle
                                - Gardening techniques
                                - Plant identification
                                - Plant ecology and habitat
                                - Traditional plant uses for food and agriculture
                                - Sustainable farming practices
                                - Plant conservation
                                - Native and invasive species
                                - Plant genetics and breeding
                                - Soil science and management
                                - Plant nutrition and fertilization
                                - Irrigation and water management
                                - Greenhouse and nursery operations
                                - Landscape design with plants
                                - Urban gardening and agriculture
                                - Organic farming techniques
                                - Composting and soil improvement
                                - Plant propagation methods


                                Strict restrictions:
                                1. Only discuss plants and vegetation-related topics
                                2. Do not provide information about:
                                - Medicinal uses of plants
                                - Plants for skincare or cosmetics
                                - Illegal plants or substances
                                - Drug-related topics
                                - Harmful or toxic uses of plants
                                - Psychoactive properties of plants
                                - Traditional medicine or herbal remedies
                                - Beauty products derived from plants
                                - Plant-based pharmaceuticals
                                - Therapeutic applications of plants
                                - Poisonous or toxic effects
                                - Alternative medicine using plants
                                - Ethnobotanical drug use
                                - Plant-based supplements

                                If asked about restricted topics, politely redirect the conversation to safe, botanical aspects of plants. Always maintain a professional, educational focus on legitimate plant science and cultivation."""

        self.conversation_history = [{"role": "system", "content": self.system_message}]

    def count_tokens(self, text):
        try:
            encoding = tiktoken.encoding_for_model(self.model)
        except KeyError:
            encoding = tiktoken.get_encoding("cl100k_base")
        tokens = encoding.encode(text)
        return len(tokens)

    def total_tokens_used(self):
        try:
            return sum(self.count_tokens(message['content']) for message in self.conversation_history)
        except Exception as e:
            print(f"Error calculating total tokens used: {e}")
            return None
    
    def enforce_token_budget(self):
        try:
            while self.total_tokens_used() > self.token_budget:
                if len(self.conversation_history) <= 1:
                    break
                self.conversation_history.pop(1)
        except Exception as e:
            print(f"Error enforcing token budget: {e}")

    def is_plant_related(self, prompt):
        return (True, None)

    def chat_completion(self, prompt, temperature=None, max_tokens=None, model=None):
        is_allowed, message = self.is_plant_related(prompt)
        if not is_allowed:
            return message

        temperature = temperature if temperature is not None else self.temperature
        max_tokens = max_tokens if max_tokens is not None else self.max_tokens
        model = model if model is not None else self.model

        self.conversation_history.append({"role": "user", "content": prompt})
        self.enforce_token_budget()

        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=self.conversation_history,
                temperature=temperature,
                max_tokens=max_tokens,
            )
        except Exception as e:
            print(f"Error generating response: {e}")
            return None

        ai_response = response.choices[0].message.content
        self.conversation_history.append({"role": "assistant", "content": ai_response})

        return ai_response
    
    def reset_conversation_history(self):
        self.conversation_history = [{"role": "system", "content": self.system_message}]

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

instance_id = get_instance_id()
st.write(f"**EC2 Instance ID**: {instance_id}")

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
        
def Chatbot():
    st.title("PlantPal 🪴")
    st.markdown("""
    Welcome to the Botanical Assistant! I'm here to help you learn about plants and gardening.
    I can discuss:
    - Plant species and characteristics
    - Plant care and cultivation
    - Gardening techniques
    - Plant biology and ecology
""")

    user_input = st.chat_input("Tanya aku tentang tanaman....")

    if user_input:
        response = chat_manager.chat_completion(user_input)
        if response:
            st.session_state['conversation_history'] = chat_manager.conversation_history

    for message in chat_manager.conversation_history:
        if message["role"] != "system":
            with st.chat_message(message["role"]):
                st.write(message["content"])

def Rekomendasi():
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
        
if selected == "Chatbot":
    Chatbot()
elif selected == "Rekomendasi":
    Rekomendasi()
