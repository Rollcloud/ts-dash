google.charts.load("current", { packages: ["gauge"] });
google.charts.setOnLoadCallback(main);

var controls;
var socket;

class Gauge {
    constructor(element_id, label, options) {
        this.element_id = element_id;
        this.label = label;
        this.options = options;

        this.data = google.visualization.arrayToDataTable([
            ["Label", "Value"],
            [label, 0], // default value = 0
        ]);
        $(document.getElementById(element_id)).addClass("g-gauge");
        this.chart = new google.visualization.Gauge(
            document.getElementById(element_id)
        );
        this.chart.draw(this.data, this.options);
    }

    update(value, label) {
        if (value !== undefined) {
            if (label !== undefined) {
                this.label = label;
                this.data.setValue(0, 0, label);
            }

            this.data.setValue(0, 1, value);
            this.chart.draw(this.data, this.options);
        }
    }
}

function createControls() {
    return {
        speed: new Gauge("gauge-speed", "Mph", {
            width: 200,
            height: 200,
            min: 0,
            max: 80,
            majorTicks: [0, 10, 20, 30, 40, 50, 60, 70, 80],
            minorTicks: 2,
        }),
        boiler: new Gauge("gauge-boiler", "Boiler PSI", {
            width: 200,
            height: 200,
            min: 20,
            max: 260,
            redFrom: 225,
            redTo: 260,
            majorTicks: [20, 60, 100, 140, 180, 220, 260],
            minorTicks: 4,
        }),
        "steam-chest": new Gauge("gauge-steam-chest", "Steam Chest", {
            width: 150,
            height: 150,
            min: 20,
            max: 260,
            majorTicks: [20, 60, 100, 140, 180, 220, 260],
            minorTicks: 4,
        }),
        horn: new Handle(
            "#handle-horn",
            ["Horn"],
            "Horn",
            {
                zero: "bot",
            },
            function (value) {
                console.log("Send horn: ", value);
                socket.emit("command", { Horn: value });
            }
        ),
        regulator: new Handle(
            "#handle-regulator",
            ["Regulator", "VirtualThrottle"],
            "Throttle",
            {
                zero: "bot",
                colour: "#e45f54", // red
            },
            function (value) {
                console.log("Send throttle: ", value);
                socket.emit("command", { Regulator: value });
            }
        ),
        reverser: new Handle(
            "#handle-reverser",
            ["Reverser"],
            "Reverse",
            {
                zero: "mid",
                colour: "#4684ee", // blue
            },
            function (value) {
                console.log("Send reverse: ", value);
                socket.emit("command", { Reverser: value });
            }
        ),
        "train-brake": new Handle(
            "#handle-train-brake",
            ["TrainBrakeControl"],
            "Train Brake",
            {
                zero: "bot",
                colour: "#666", // black
            },
            function (value) {
                console.log("Send brake: ", value);
                socket.emit("command", { TrainBrakeControl: value });
            }
        ),
        "water-boiler": new Level("#level-boiler", "", "Boiler %", {
            contents: "water",
        }),
        "water-tank": new Level("#level-tank", "", "Tank %", {
            contents: "water",
        }),
        "coal-fire": new Level("#level-fire", "", "Fire %", {
            contents: "oil",
        }),
        "coal-bunker": new Level("#level-bunker", "", "Bunker %", {
            contents: "oil",
        }),
    };
}

function fireboxOpen(setOpen) {
    if (setOpen) {
        $(".firebox .doors").addClass("open");
    } else {
        $(".firebox .doors").removeClass("open");
    }
}

function main() {
    controls = createControls();

    //connect to the socket server.
    socket = io.connect(
        "http://" + document.domain + ":" + location.port + "/test"
    );

    //receive details from server
    socket.on("loco", function (msg) {
        // console.log(msg);

        if (msg.loco_name == null) $("#loco-name").text("No loco selected");
        else $("#loco-name").text(msg.loco_name);
    });

    //receive details from server
    socket.on("controls", function (msg) {
        // console.log(msg);

        // update gauges
        controls["speed"].update(msg.speedometerkph, "Kph");
        controls["speed"].update(msg.speedometermph, "Mph");
        controls["boiler"].update(msg.boilerpressuregaugepsi);
        controls["steam-chest"].update(msg.steamchestpressuregaugepsi);

        // update handles
        controls["horn"].update(msg.horn);

        controls["regulator"].update(msg.regulator);
        controls["reverser"].update(msg.reverser);
        controls["train-brake"].update(msg.trainbrakecontrol);

        // update levels
        controls["water-boiler"].update(msg.watergauge);
        controls["water-tank"].update(0);
        controls["coal-fire"].update(1);
        controls["coal-bunker"].update(msg.fuel);

        // firebox
        fireboxOpen(msg.fireboxdoor);
    });
}
