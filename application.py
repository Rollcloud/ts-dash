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

from rwx_interface import RailDriverExtended

__author__ = "rollcloud"

app = Flask(__name__)
app.config["SECRET_KEY"] = "An actually secret key! Nah, who am I kidding :P"
app.config["DEBUG"] = True

# turn the flask app into a socketio app
socketio = SocketIO(app, async_mode=None, logger=False, engineio_logger=True)

# empty dict for storing data over the lifetime of the program
app_data = {'loco_name': None}

# create threads
param_thread = Thread()
param_thread_stop_event = Event()

loco_thread = Thread()
loco_thread_stop_event = Event()


def get_rde():
    global app_data

    if 'rde' not in app_data:
        print("Starting RDE...")
        app_data['rde'] = RailDriverExtended()
        app_data['rde'].set_rail_driver_connected(True)  # start data exchange
        print(app_data['rde'])

    return app_data['rde']


def check_loco():
    """
    Query RailDriverExtended for the latest locomotive.
    """
    while not loco_thread_stop_event.isSet():
        rde = get_rde()

        loco_name = rde.get_loco_name()

        if loco_name != app_data['loco_name']:
            # save new name
            app_data['loco_name'] = loco_name
            # retrieve new controllers
            rde.load_controllers()

        # send locomotive name
        socketio.emit(
            "loco",
            {'loco_name': loco_name, 'loco_type': rde.get_loco_type()},
            namespace="/test",
        )

        socketio.sleep(5)


def retrieve_parameters():
    """
    Query RailDriverExtended for the latest locomotive values.
    Returns a dictionary
    """
    while not param_thread_stop_event.isSet():

        if app_data['loco_name'] is not None:
            rde = get_rde()
            params = rde.get_parameters()
            socketio.emit("controls", params, namespace="/test")

        socketio.sleep(0.05)


@app.route("/")
def index():
    # only by sending this page first will the client be connected to the socketio instance
    return render_template("index.html")


@socketio.on("connect", namespace="/test")
def test_connect():
    # need visibility of the global thread object
    global loco_thread, param_thread
    print("Client connected")

    # Start the threads thread only if the thread has not been started before.
    if not loco_thread.isAlive():
        print("Starting Loco Thread")
        loco_thread = socketio.start_background_task(check_loco)

    if not param_thread.isAlive():
        print("Starting Param Thread")
        param_thread = socketio.start_background_task(retrieve_parameters)


@socketio.on("command", namespace='/test')
def handle_command(msg):
    # print('received msg:', msg)
    rde = get_rde()
    for controller, value in msg.items():
        rde.set_parameter(controller, value)


@socketio.on("disconnect", namespace="/test")
def test_disconnect():
    print("Client disconnected")


if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port="5000")
