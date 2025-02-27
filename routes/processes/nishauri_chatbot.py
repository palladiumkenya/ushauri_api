import sys
import json
from gradio_client import Client

def chat_nishauri(question):
    """Send JSON data to Gradio API and return response."""
    try:
        client = Client("http://172.17.0.1:7861", verbose=False)

        # JSON request structure
        payload = {
            "CONSENT": "NO",
            "PERSON_INFO": {
                "GENDER": "",
                "AGE": '',
                "REGIMEN": "",
                "APPOINTMENT_DATETIME": "",
                "VIRAL_LOAD": "",
                "VIRAL_LOAD_DATETIME": ""
            },
            "QUESTION": question
        }

        # Send JSON data to Gradio
        result = client.predict(json.dumps(payload), api_name="/predict")

        # Ensure response is valid JSON
        response_data = json.loads(result)
        print(json.dumps(response_data, indent=4))

    except Exception as e:
        print(json.dumps({"error": f"🚨 Error: {str(e)}"}))

# Ensure argument is passed
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": " Missing question argument"}))
        sys.exit(1)
    
    question = sys.argv[1]
    chat_nishauri(question)
