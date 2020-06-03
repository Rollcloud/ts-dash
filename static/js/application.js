google.charts.load("current", { packages: ["gauge"] });
google.charts.setOnLoadCallback(main);

var chart, data, options;

function createGauges() {
    data = google.visualization.arrayToDataTable([
        ["Label", "Value"],
        ["Speed", 80],
        ["Boiler", 55],
        ["Water", 68],
    ]);

    options = {
        width: 400,
        height: 120,
        redFrom: 90,
        redTo: 100,
        yellowFrom: 75,
        yellowTo: 90,
        minorTicks: 5,
    };

    chart = new google.visualization.Gauge(
        document.getElementById("chart_div")
    );
}

function main() {
    createGauges();

    //connect to the socket server.
    var socket = io.connect(
        "http://" + document.domain + ":" + location.port + "/test"
    );

    //receive details from server
    socket.on("newnumber", function (msg) {
        console.log("Received: " + msg.number);

        // update gauge
        data.setValue(0, 1, (msg.number + 120) % 120);

        chart.draw(data, options);
    });
}
