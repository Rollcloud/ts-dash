#! .venv/bin/python3

"""
Demo Flask application to test the operation of Flask with socket.io

Aim is to create a webpage that is constantly updated with random numbers from a background python process.

30th May 2014

===================

Updated 13th April 2018

+ Upgraded code to Python 3
+ Used Python3 SocketIO implementation
+ Updated CDN Javascript and CSS sources

"""

from flask_socketio import SocketIO
from flask import Flask, render_template

from random import random
from threading import Event, Thread

from rwx_interface import rde

__author__ = "rollcloud"

app = Flask(__name__)
app.config["SECRET_KEY"] = "An actually secret key! Nah, who am I kidding :P"
app.config["DEBUG"] = True

# turn the flask app into a socketio app
socketio = SocketIO(app, async_mode=None, logger=True, engineio_logger=True)

# random number Generator Thread
thread = Thread()
thread_stop_event = Event()

number = 42


def generate_numbers():
    """
    Generate a random number every 1 second and emit to a socketio instance (broadcast)
    Ideally to be run in a separate thread?
    """
    global number

    # infinite loop of magical random numbers
    print("Making random numbers")
    while not thread_stop_event.isSet():
        number += round(random() * 5 - 2.5, 0)
        socketio.emit("newnumber", {"number": number}, namespace="/test")
        socketio.sleep(0.3)


def retrieve_parameters():
    """
    Query RailDriver.dll for the latest locomotive values.
    Returns a dictionary
    """

    while not thread_stop_event.isSet():
        params = rde.get_parameters()
        socketio.emit("controls", params, namespace="/test")
        socketio.sleep(0.3)


@app.route("/")
def index():
    # only by sending this page first will the client be connected to the socketio instance
    return render_template("index.html")


@socketio.on("connect", namespace="/test")
def test_connect():
    # need visibility of the global thread object
    global thread
    print("Client connected")

    # Start the random number generator thread only if the thread has not been started before.
    if not thread.isAlive():
        print("Starting Thread")
        thread = socketio.start_background_task(retrieve_parameters)


@socketio.on("disconnect", namespace="/test")
def test_disconnect():
    print("Client disconnected")


if __name__ == "__main__":
    socketio.run(app)
