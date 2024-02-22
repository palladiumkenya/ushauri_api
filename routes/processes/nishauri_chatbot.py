# import system library
import sys

# take passed variable values 
question = sys.argv[1];
#token = sys.argv[2];


# calcluate the total using variable values and print the output
def chat_nishauri(question):
    from gradio_client import Client;
    client = Client("Nishauri/ChatBot", verbose=False);
    result = client.predict(
		question,	# str  in 'question' Textbox component
		api_name="/predict"
    )
    print(result);
    #print('re');

# call the function and pass variables to it
chat_nishauri(question);