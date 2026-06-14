import streamlit as st

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
        