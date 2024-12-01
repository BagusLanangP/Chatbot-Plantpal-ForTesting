from openai import OpenAI
import tiktoken

DEFAULT_API_KEY = "ca794fa8d9705ac719ae1011e88393e788239889bbc8b193f32d3bca596ee378"
DEFAULT_BASE_URL = "https://api.together.xyz/v1"
DEFAULT_MODEL = "meta-llama/Llama-Vision-Free"
DEFAULT_TEMPERATURE = 0.7
DEFAULT_MAX_TOKENS = 500
DEFAULT_TOKEN_BUDGET = 4096

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
