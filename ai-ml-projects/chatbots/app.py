"""
Streamlit UI for the AI Chatbot
"""
import streamlit as st
from chatbot import Chatbot
from config import Config
import json


def init_session_state():
    """Initialize session state variables"""
    if "messages" not in st.session_state:
        st.session_state.messages = []
    if "chatbot" not in st.session_state:
        st.session_state.chatbot = None


def main():
    """Main Streamlit app"""
    st.set_page_config(
        page_title="AI Chatbot",
        page_icon="🤖",
        layout="wide"
    )

    init_session_state()

    # Sidebar configuration
    with st.sidebar:
        st.title("⚙️ Configuration")

        # Provider selection
        provider = st.selectbox(
            "Model Provider",
            ["openai", "ollama"],
            index=0 if Config.MODEL_PROVIDER == "openai" else 1
        )

        # Model selection
        if provider == "openai":
            model_options = [
                "gpt-3.5-turbo",
                "gpt-4",
                "gpt-4-turbo-preview"
            ]
        else:
            model_options = [
                "llama2",
                "mistral",
                "codellama",
                "phi"
            ]

        model = st.selectbox(
            "Model",
            model_options,
            index=0
        )

        # System prompt
        system_prompt = st.text_area(
            "System Prompt",
            value=Config.SYSTEM_PROMPT,
            height=100
        )

        # Advanced settings
        with st.expander("Advanced Settings"):
            temperature = st.slider(
                "Temperature",
                min_value=0.0,
                max_value=2.0,
                value=Config.TEMPERATURE,
                step=0.1
            )

            max_tokens = st.number_input(
                "Max Tokens",
                min_value=100,
                max_value=4000,
                value=Config.MAX_TOKENS,
                step=100
            )

        # Initialize/Reset chatbot
        if st.button("Initialize Chatbot", type="primary"):
            try:
                st.session_state.chatbot = Chatbot(
                    provider=provider,
                    model=model,
                    system_prompt=system_prompt,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                st.session_state.messages = []
                st.success("Chatbot initialized!")
            except Exception as e:
                st.error(f"Error: {e}")

        # Clear conversation
        if st.button("Clear Conversation"):
            if st.session_state.chatbot:
                st.session_state.chatbot.clear_history()
            st.session_state.messages = []
            st.rerun()

        # Save/Load conversation
        st.divider()
        st.subheader("💾 Conversation")

        col1, col2 = st.columns(2)

        with col1:
            if st.button("Save"):
                if st.session_state.chatbot:
                    filename = "streamlit_conversation.json"
                    st.session_state.chatbot.save_history(filename)
                    st.success(f"Saved to {filename}")

        with col2:
            if st.button("Load"):
                try:
                    filename = "streamlit_conversation.json"
                    with open(filename, 'r') as f:
                        data = json.load(f)

                    if st.session_state.chatbot:
                        st.session_state.chatbot.load_history(filename)
                        st.session_state.messages = [
                            {"role": msg["role"], "content": msg["content"]}
                            for msg in data["messages"]
                            if msg["role"] != "system"
                        ]
                        st.success(f"Loaded from {filename}")
                        st.rerun()
                except FileNotFoundError:
                    st.error("No saved conversation found")

    # Main chat interface
    st.title("🤖 AI Chatbot")

    # Check if chatbot is initialized
    if st.session_state.chatbot is None:
        st.info("👈 Please initialize the chatbot in the sidebar")
        return

    # Display chat messages
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    # Chat input
    if prompt := st.chat_input("Type your message here..."):
        # Display user message
        with st.chat_message("user"):
            st.markdown(prompt)

        st.session_state.messages.append({"role": "user", "content": prompt})

        # Get assistant response
        with st.chat_message("assistant"):
            message_placeholder = st.empty()
            full_response = ""

            # Stream response
            try:
                for chunk in st.session_state.chatbot.chat_stream(prompt):
                    full_response += chunk
                    message_placeholder.markdown(full_response + "▌")

                message_placeholder.markdown(full_response)
            except Exception as e:
                st.error(f"Error: {e}")
                full_response = f"Error: {e}"

        st.session_state.messages.append({"role": "assistant", "content": full_response})


if __name__ == "__main__":
    main()
