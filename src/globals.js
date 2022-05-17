////////////////////////////////// GLOBALS VARAIBLES ////////////////////////////////

var scale = 1;
var scene;
var rayset = false;
var renderer;
var canvas;
var camera;
var controls;
var pointer;
var raycaster;

var templateChair = null;
var templateTable = null;

// JIHOON: Additional variables
const ifcFilePath = './output.json';

// JIHOON: Predefined color, opacity, cost of object types
var colorInpObj = {
    "data": [
        {
            "type": "Door",
            "color": "#fa9301",
            "opacity": 0.5,
            "cost": 100
        },
        {
            "type": "Column",
            "color": "#f9a8c3",
            "opacity": 0.5,
            "cost": 1000
        },
        {
            "type": "Wall",
            "color": "#000eff",
            "opacity": 0.3,
            "cost": 2000
        },
        {
            "type": "Window",
            "color": "#f100e4",
            "opacity": 0.5,
            "cost": 500
        },
        {
            "type": "Furniture",
            "color": "#00f1e4",
            "opacity": 0.5,
            "cost": 300
        },
        {
            "type": "BuildingElementProxy",
            "color": "#0084a2",
            "opacity": 0.8,
            "cost": 150
        },
        {
            "type": "ElectricAppliance",
            "color": "#dd1232",
            "opacity": 0.8,
            "cost": 50
        }
    ]
}

// JIHOON : To visualize object types on the web
const showElements = ["Wall", "Column", "Window", "Door", "Furniture", "ElectricAppliance", "BuildingElementProxy"];
var typesInFile = [];
var selectedType = [];
var backupElements = [];

var controlX;
var controlHeat;
var meshHeat;
var prevFurniture;
var prevMaterial;
var lock = false;
var lastObjectName = "";
var jsonData;
var templateJSON = null;
var type_dict = {}

var gui = new dat.GUI();
var cameraFolder;
var cubeFolder; 
var heatFolder; 
var selElement;
var sensorDictPath = 'exportDict.json';
var lenSensorDict;
var timeStart;
var blinkInterval = 1;
var blinkTime;
var blinkOn = false;
var numTime = 'numTimestamp';
var strTime = 'strTimestamp';
var sensorDict = {'strTimestamp': [], 'numTimestamp': [], "Sensor7": [], "Sensor10": [], "Sensor2": []};
var sensorDictKeys = ['strTimestamp', 'numTimestamp', "Sensor7", "Sensor10", "Sensor2"];
var varVizualize = "sensorDataViz";
var varText = 'sensorDataText';
var varLine = 'sensorLine';
var sensorTypeName = "ElectricAppliance";
var updateInterval = 3;
var sensorValueMax = 7;
var currentHeightRatio = 10;
var heatmapOn = false;
var realtimeOn = true;
var sensorRealtime;
var vizIndex;
var varConnection = "disconnected";
var numThreshold = 5;
var strMetric = ' ppm';

const distinct = (value, index, self) => {
    return self.indexOf(value) === index;
}

var _max_temperature=50;
var _max_humidity=100;
var _max_light=1024;
var _max_TVOC=150;
var _max_eCO2=1000;
var maxCO2 = 15;

// JIHOON: To draw line charts on the web
var _line_component = {
    type: 'line',
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      datasets: [{
        label: "Earnings",
        lineTension: 0.3,
        backgroundColor: "rgba(78, 115, 223, 0.05)",
        borderColor: "rgba(78, 115, 223, 1)",
        pointRadius: 3,
        pointBackgroundColor: "rgba(78, 115, 223, 1)",
        pointBorderColor: "rgba(78, 115, 223, 1)",
        pointHoverRadius: 3,
        pointHoverBackgroundColor: "rgba(78, 115, 223, 1)",
        pointHoverBorderColor: "rgba(78, 115, 223, 1)",
        pointHitRadius: 10,
        pointBorderWidth: 2,
        data: [0, 10000, 5000, 15000, 10000, 20000, 15000, 25000, 20000, 30000, 25000, 40000],
      }],
    },
    options: {
      maintainAspectRatio: true,
      layout: {
        padding: {
          left: 10,
          right: 25,
          top: 25,
          bottom: 0
        }
      },
      scales: {
        xAxes: [{
          time: {
            unit: 'date'
          },
          gridLines: {
            display: false,
            drawBorder: false
          },
          ticks: {
            maxTicksLimit: 7
          }
        }],
        yAxes: [{
          ticks: {
            maxTicksLimit: 5,
            padding: 10,
            // Include a dollar sign in the ticks
            callback: function(value, index, values) {
              return '$' + number_format(value,2);
            }
          },
          gridLines: {
            color: "rgb(234, 236, 244)",
            zeroLineColor: "rgb(234, 236, 244)",
            drawBorder: false,
            borderDash: [2],
            zeroLineBorderDash: [2]
          }
        }],
      },
      legend: {
        display: false
      },
      tooltips: {
        backgroundColor: "rgb(255,255,255)",
        bodyFontColor: "#858796",
        titleMarginBottom: 10,
        titleFontColor: '#6e707e',
        titleFontSize: 14,
        borderColor: '#dddfeb',
        borderWidth: 1,
        xPadding: 15,
        yPadding: 15,
        displayColors: false,
        intersect: false,
        mode: 'index',
        caretPadding: 10,
        callbacks: {
          label: function(tooltipItem, chart) {
            var datasetLabel = chart.datasets[tooltipItem.datasetIndex].label || '';
            return datasetLabel + ': $' + number_format(tooltipItem.yLabel,2);
          }
        }
      }
    }
  };