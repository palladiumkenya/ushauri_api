# import system library
import sys

# take passed variable values 
question = sys.argv[1];
#question = 'How do i reschedule appointment?';
#token = sys.argv[2];


# calcluate the total using variable values and print the output
def chat_nishauri(question):
    from gradio_client import Client;
    client = Client("http://172.17.0.1:7861", verbose=False);
    result = client.predict(
		question,	# str  in 'question' Textbox component
		api_name="/predict"
    )
    print(result);
    #print('re');

# call the function and pass variables to it
chat_nishauri(question);
