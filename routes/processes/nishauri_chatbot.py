import sys
import json
import requests

# Take passed variable values
question_ = sys.argv[1]

# Construct patient data JSON
patient_data = {
    "CONSENT": "NO",
    "PERSON_INFO": {
        "GENDER": "MALE",
        "AGE": 24,  # Ensure this is an integer, not a string
        "REGIMEN": "TDF/3TC/DTG",
        "APPOINTMENT_DATETIME": "20240729",
        "VIRAL_LOAD": "< LDL copies/ml",
        "VIRAL_LOAD_DATETIME": "20240130"
    },
    "QUESTION": question_
}

# Ensure Gradio receives TWO inputs
data_payload = [
    json.dumps(patient_data),  # First input (Question + Patient Info as JSON)
    ""  # Second input (State or session, send an empty string if not used)
]

# API Endpoint
API_URL = "http://172.17.0.1:7862/run/predict"  # Update this URL if needed

# Send POST request
def chat_nishauri(data):
    headers = {"Content-Type": "application/json"}  # Set correct headers
    response = requests.post(API_URL, json={"data": data}, headers=headers)  # Send JSON request

    # Print response
    if response.status_code == 200:
       # print(response.json())  # Print JSON response
        json_response = response.json()  # Convert response to JSON
        text_response = "\n".join([str(item) for item in json_response.get('data', []) if item is not None])

        print(text_response)        
    else:
        print(f"Error {response.status_code}: {response.text}")  # Debugging

# Call function
chat_nishauri(data_payload)
