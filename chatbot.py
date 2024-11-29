from conversation_manager import ConversationManager
import streamlit as st

def Chatbot():
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