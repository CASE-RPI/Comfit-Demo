# Web-based Microservice for monitoring indoor air quality based on BIM & IoT

Visit the Live Demo: [https://jchung-rpi.github.io/Comfit-Demo/](https://jchung-rpi.github.io/Comfit-Demo/)

## Project Background
- In smart home IoT sensors, one of the difficulties for users is to connect the sensor data with building information and analyze the real-time data. This project aims to develop a web-based building system platform for non-experts to easily monitor indoor thermal comfort and air quality using BIM & IoT sensors

## Concept Diagram
- If the users generate building elements using Rhino Grasshopper plugin or Revit software, the data that include geometries, positioning, object types, and sensor ID can be exported into IFC.JSON or IFC format file.
- The exported file can be imported by a web platform, and the IFC file can be automatically converted into IFC.JSON format. The imported data can be visualized on the platform using THREE.js and the user can simply manipulate the objects using dat.gui controls. Also, the objects can be viewed or colored by object type.
- IoT sensors and the web-based system can be connected through MQTT protocol using MQTT.js library. If the user writes the pre-specified MQTT topic on the platform, the sensor data will be shown on the web.
- Using google sheet API, the collected data with time series can be automatically stored in the google sheet, and the historical data can be visualized as line charts. The users need to provide API Key, and Client ID in advance.

<p align="center">
  <img src="/assets/Workflow.jpg" alt="Workflow of the Project" style="width:80%;"/>
  <img src="/assets/Data_exchange.jpg" alt="Data Exchange" style="width:80%;"/>
</p>
  
## User Interface of Web Platform
<p align="center">
  <img src="/assets/UI.jpg" alt="UI" style="width:80%;"/>
</p>
  
## Data Exchange between Sensor, Web, and Database
<p align="center">
  <img src="/assets/Data_exchange2.jpg" alt="Data Exchange" style="width:80%;"/>
</p>
  
## Demo Video
<p align="center">
  <a href="https://www.youtube.com/watch?v=gqgwoeNuSBU" target="_blank"><img src="https://img.youtube.com/vi/gqgwoeNuSBU/0.jpg" alt="Demo Video" style="width:60%;"/></a>
</p>

## Requirements
- ifcopenshell
- IFCJSON converter
- MQTT.js
- THREE.js
- Bootstrap


  
## References
- https://github.com/IFCJSON-Team/IFC2JSON_python/tree/master/file_converters
- https://github.com/IfcOpenBot/IfcOpenShell
- https://github.com/mqttjs/MQTT.js
- https://developers.google.com/sheets/api/guides/concepts
