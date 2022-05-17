//////////////  Setup    /////////////
function setup() {
    timeStart = Date.now();
    blinkTime = Date.now();

    setupProgram(); 
    loadTypesInFile();
    loadAssets();
    setupScene();   
    setupGeometry();      
    requestAnimationFrame(render); 
    setupSliderInterval();
}

function setupProgram() {  
    console.log("setupProgram");
    const canvas = document.getElementById("c");
    renderer = new THREE.WebGLRenderer({ canvas });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; 

    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();
    window.addEventListener('pointerdown', onPointerMove);

    scene = new THREE.Scene();
}

// JIHOON: Update a object type list 'typesInFile' from the imported IFC file
function loadTypesInFile(){

    var fileLoader = new THREE.FileLoader();
    fileLoader.load(ifcFilePath, function ( object ) { 

        // JIHOON: Import data in a IFCJSON file
        if(JSON.parse(object)["data"]){                
            jsonData = JSON.parse(object)["data"];
        } else if (JSON.parse(object)["Data"]) {
            jsonData = JSON.parse(object)["Data"];
        } else {
            console.log("This is not a valid file!");
        }
        
        for (let i = 0; i < jsonData.length; i++){
            if (showElements.includes(jsonData[i].type) && jsonData[i].representations){
                typesInFile.push(jsonData[i].type);
        }}
        typesInFile = typesInFile.filter(distinct);

        loadSelectTypeDiv();
    });
}

function loadAssets() {
    //////////////////// Load the instantiate the chair model - its MTL and OBJ files //////////////////// 
    console.log("loadAssets");

    loadIFCFiles();
}

function loadIFCFiles(){
        //JIHOON CHUNG: Create geometries from IFC.JSON files
        var fileLoader = new THREE.FileLoader();
        fileLoader.load(ifcFilePath, function ( object ) {            
    
            console.log("fileLoader");
            // JIHOON: Import data in a IFCJSON file
            if(JSON.parse(object)["data"]){                
                jsonData = JSON.parse(object)["data"];
            } else if (JSON.parse(object)["Data"]) {
                jsonData = JSON.parse(object)["Data"];
            } else {
                console.log("This is not a valid file!");
            }
            
            for (let i = 0; i < jsonData.length; i++){
                if (selectedType.includes(jsonData[i].type) && jsonData[i].representations){
                    var objId = jsonData[i].representations[0].ref;
                    let verts = [], faces = [];
                    
                    // JIHOON CHUNG: for indexing object names
                    if (!type_dict[jsonData[i].type]) {        
                        type_dict[jsonData[i].type] = 1;                       
                    } else {
                        type_dict[jsonData[i].type] += 1;
                    }
    
                    for (let j = 0; j < jsonData.length; j++){
                        if (jsonData[j].type == "shapeRepresentation" && jsonData[j].globalId == objId)
                        {                             
                            // JIHOON: Import mesh data into verts & faces list     
                            jsonOBJ = jsonData[j].items[0];
                            jsonOBJ.split('\n').forEach((e) => {
                                if (e.split(' ')[0] === 'v'){
                                    verts.push({
                                        x: parseFloat(e.split(' ')[1]),
                                        y: parseFloat(e.split(' ')[2]),
                                        z: parseFloat(e.split(' ')[3]),
                                    });}
                                else if (e.split(' ')[0] === 'f'){
                                    faces.push({
                                        a: parseInt(e.split(' ')[1]),
                                        b: parseInt(e.split(' ')[2]),
                                        c: parseInt(e.split(' ')[3]),
                                    });}                                        
                            });
    
                            templateJSON = new THREE.OBJLoader().parse(jsonOBJ);                            
                            templateJSON.castShadow = true;
                            templateJSON.receiveShadow = false;
                            
                            for (k = 0; k < colorInpObj.data.length; k++){
                                if (jsonData[i].type == colorInpObj.data[k].type) {                        
                                    var material = new THREE.MeshPhongMaterial({
                                        color: colorInpObj.data[k].color ? colorInpObj.data[k].color : "#ffffff",
                                        opacity: colorInpObj.data[k].opacity ? colorInpObj.data[k].opacity : 0.2,
                                        transparent: true                 
                                    });       
                               
                                    let geometry = new THREE.BufferGeometry();
                                    let points = [];
                                    faces.forEach((f) => {
                                        points.push(verts[f.a], verts[f.b], verts[f.c]);
                                    });
                                    geometry.setFromPoints(points);
                                    geometry.computeVertexNormals();

                                    templateJSON.position.x -= 20;
                                    templateJSON.position.z += 15;
                                    templateJSON.children[0].geometry = geometry;
                                    templateJSON.children[0].material = material;
                                    templateJSON.children[0].castShadow = true;
                                    templateJSON.name = jsonData[i].name + "_" + type_dict[jsonData[i].type];                                
                                    templateJSON.userData.type = jsonData[i].type;                                
                                    templateJSON.userData.volume = jsonData[i].Volume;
                                    templateJSON.userData.area = jsonData[i].Area; 
                                    templateJSON.userData.centroid = getCenterPoint(templateJSON.children[0]);
                                    templateJSON.userData.cost = "$"+colorInpObj.data[k].cost;
                                    
                                    if (jsonData[i].ThermalTransmittance) {
                                        templateJSON.userData.ThermalTransmittance = jsonData[i].ThermalTransmittance;
                                    }                                       
                                    if (jsonData[i].Length) {
                                        templateJSON.userData.length = jsonData[i].Length;
                                    }                                        
                                    if (jsonData[i].Mark && jsonData[i].type=="ElectricAppliance") {
                                        templateJSON.userData.sensorId = jsonData[i].Mark;
                                    }
                                
                                    templateJSON.rotation.x = -Math.PI / 2;
                                    templateJSON.scale.set(scale, scale, scale);
                                    

                                    scene.add(templateJSON);
                                    scene.updateMatrixWorld(true);
                                    var pos = new THREE.Vector3();
                                    pos.setFromMatrixPosition(templateJSON.matrixWorld);
                                }
                            }                            
                            backupElements.push(templateJSON);
                        }
                    }
                }                
            }                         
        } );
}

function setupScene() {
    console.log("setupScene");
    scene.background = new THREE.Color(0x6688ff);

    // 2. Create the Camera
    const fov = 75;
    const aspect = 2;  
    const near = 0.1;
    const far = 5000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 20;
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.update();

    //! 4. Add a light
    //Create a DirectionalLight and turn on shadows for the light
    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(-50, 100, -100); //default; light shining from top
    light.target.position.set(0, 0, 0);
    light.castShadow = true; // default false
    scene.add(light);

    //Set up shadow properties for the light
    light.shadow.mapSize.width = 512; // default
    light.shadow.mapSize.height = 512; // default
    light.shadow.camera.near = 0.5; // default
    light.shadow.camera.far = 200; // default
    light.shadow.camera.left = -20;
    light.shadow.camera.right = 20;
    light.shadow.camera.top = 20;
    light.shadow.camera.bottom = -20;
    //Create a helper for the shadow camera (optional)
    const helper = new THREE.CameraHelper(light.shadow.camera);
    scene.add(helper);


    const ambientLight = new THREE.AmbientLight(0x808080);
    scene.add(ambientLight);
    scene.add(camera);


    // JIHOON: GUI for camera controller
    function updateCamera() {
        camera.updateProjectionMatrix();
    }     
    
    gui.domElement.id = 'gui';
    
    cameraFolder = gui.addFolder('Camera');
    cameraFolder.add(camera.position, 'z', 10, 100);
    cameraFolder.add(camera, 'fov', 10, 100).onChange(updateCamera);
    cameraFolder.add(camera, 'aspect', 1, 5).onChange(updateCamera);
    cameraFolder.add(camera, 'near', 0, 1).onChange(updateCamera);
    cameraFolder.add(camera, 'far', 0, 5000).onChange(updateCamera);
    cameraFolder.open();

    heatFolder = gui.addFolder('Heatmap');
    cubeFolder = gui.addFolder('Geometry');
}

function setupGeometry() {
    console.log("setupGeometry")

    // 3a. Create the Geometry
    //Create a plane that receives shadows (but does not cast them)
    const planeSize = 50;
    const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xa0a0a0 })
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);
}

////////    onLoadedAssets - run after the assets have been loaded /////////////
function onLoadedAssets() {
    if (!templateChair || !templateTable) return;   // one of the assets isn't loaded yet, wait until it is
    // create the chairs
    for (var i = 0; i < 5; i++) {
        for (var j = 0; j < 5; j++) {

            var amodel = templateChair.clone();
            amodel.castShadow = true;
            amodel.receiveShadow = false;
            amodel.position.x = i * 2;
            amodel.position.z = j * 2;
            amodel.userData.type = "Chair"; //!HW add a type
            amodel.userData.cost = "$"+50;      //!HW add some data
            amodel.name = "Chair_" + i + "_" + j; //!HW add a name

            // 3c. Add the clone to the scene
            scene.add(amodel);
            backupElements.push(amodel);
        }
    }

    // Create the tables
    for (var i = 0; i < 3; i++) { // make the individual instances
        var amodel = templateTable.clone();
        amodel.castShadow = true;
        amodel.receiveShadow = false;
        amodel.position.z = i * 5;
        amodel.position.x = 10;
        amodel.userData.type = "Table"; //!HW add a type
        amodel.userData.cost = "$"+200;     //!HW add some data
        amodel.name = "Table_" + i;     //!HW add a name
        // 3c. Add the clone to the scene
        scene.add(amodel);
        backupElements.push(amodel);
    }
}

// JIHOON: Add cubeFolder
function addCubeFolder(){
    controlX = cubeFolder.add(selElement.position, 'x', -50, 50);
    controlY = cubeFolder.add(selElement.position, 'y', -50, 50);
    controlZ = cubeFolder.add(selElement.position, 'z', -50, 50);
    if (selElement.userData.type == "Chair" || selElement.userData.type == "Table") {
        controlR = cubeFolder.add(selElement.rotation, 'y', -Math.PI, Math.PI);
    } else {
        controlR = cubeFolder.add(selElement.rotation, 'z', -Math.PI, Math.PI);
    }
    cubeFolder.open();  
}

// JIHOON: Add HTML table of the selected element
function addSelTable(){
    // Create a text string containing the HTML we will be generating and incrementally add to it.
    var textout = "<table class='table table-bordered'><thead><tr><th style='width: 30%'>Key</th><th>Value</th></tr></thead>"
    textout += "<tr><td>name</td><td>"
    textout += selElement.name;
    Object.keys(selElement.userData).forEach(e => {
        var value_ = selElement.userData[e]

        textout += "</td></tr><tr><td>"
        textout += e;
        if (e != "name") {
            textout += ' <input id="realdataTable" type="button" value="D" name=' + e + ' onclick = "onDisplayData(this.name)">';
        }
        textout += "</td><td>";

        // JIHOON: Write XYZ coordinate values
        if (e == "centroid") {
            Object.keys(value_).forEach(p => {
                textout += p + ": " + Math.round(value_[p]*1000)/1000;
                p == "z" ? textout += "" : textout += ", ";
            })
        } else if (typeof value_ == "number") {
            textout += Math.round(value_*1000)/1000; 
        } else {
            textout += value_;
        }
    });
    textout += "</td></tr></table>";

    document.getElementById("DataTableDIV").innerHTML = textout;
}

// JIHOON: Update position of GUI contorls
function updateGui(){
    var guiElement = document.getElementById("gui");
    var canvas = document.getElementById("c");
    guiElement.style.position = "absolute";
    guiElement.style.top = canvas.getBoundingClientRect().top + "px";
    guiElement.style.right = canvas.getBoundingClientRect().left + "px";
}

// JIHOON: Visualize MQTT Connection as a dot on the web
function updateConnection(){
    if (sensorRealtime && varConnection != sensorRealtime["connection"]) {
        if (sensorRealtime["connection"] == "disconnected"){
            document.getElementById("dot").style.background = "#d91818";
        } else if (sensorRealtime["connection"] == "reconnecting") {
            document.getElementById("dot").style.background = "#f2d22e";
        } else if (sensorRealtime["connection"] == "connected") {
            document.getElementById("dot").style.background = "#0c92f5";
        }
        varConnection = sensorRealtime["connection"]
    }
}

// JIHOON: Load 'Select Object Type' on HTML
function loadSelectTypeDiv(){
    console.log("loadSelectObjectType");
    var selectTypeEle = document.getElementById("selectType");
    var textout = "<table class='table table-bordered'><thead><tr><th style='width:13%'>Check</th><th>Object Type</th><th style='width:13%'>Color</th><th style='width:34%'>Opacity</th></tr></thead>";
    for (var i=0; i < showElements.length; i++){
        var myType = showElements[i];

        // JIHOON: Add checkbox input
        textout += '<tr><td class="table table-bordered"><input style="width:17px; height:17px" type="checkbox" value=';
        textout += myType;        
        if (typesInFile.includes(showElements[i]) || showElements[i] == "Chair"|| showElements[i] == "Table"){
            textout += ' checked';
            selectedType.push(showElements[i]);
        }        
        textout += ' onclick="updateViewObject(this)"></td><td>';
        textout += myType + "</td><td>";
        textout += '<input type="color" style="width:48px;height:32px" name="'
        textout += myType +'"'
        for (k = 0; k < colorInpObj.data.length; k++){
            if (myType == colorInpObj.data[k].type) {
                textout += ' value='+colorInpObj.data[k].color;
            }
        }

        // JIHOON: Add onChange function on the color input
        textout += ' onchange="onTypeColor(this.name, this.value, this.type)"></td><td>';
        textout += ' <input type="range" style="width:150px" min="0" max"100" name="'
        textout += myType +'"'
        for (k = 0; k < colorInpObj.data.length; k++){
            if (myType == colorInpObj.data[k].type) {
                textout += ' value='+colorInpObj.data[k].opacity*100;
                        // JIHOON: Add onChange function on the opacity input
                textout += ' onchange="onTypeColor(this.name, this.value, this.type)"><div id="valueOpacity_'+k+'">'
                textout += colorInpObj.data[k].opacity*100 + '%</div></td></tr>';
            }
        }
    }
    textout += "</table>";
    document.getElementById("selectType").innerHTML = textout;
    selectedType = selectedType.filter(distinct);
}

// JIHOON: Update object types whether they are shown or hidden
function updateViewObject(cb){
    if(cb.checked){
        selectedType.push(cb.value);

        for (i=0; i < backupElements.length ; i++) {
            if (backupElements[i].userData.type == cb.value){
                scene.children.push(backupElements[i]);
            }
        }

    } else if (!cb.checked){
        for (i=0; i < backupElements.length ; i++) {
            if (backupElements[i].userData.type == cb.value){
                scene.children.splice(scene.children.indexOf(backupElements[i]),1);
            }
        }
    }
}

// JIHOON: Change color/opacity of an object type
function onTypeColor(aname, avalue, atype){
    var acolor;
    var anopacity;
    for (k = 0; k < colorInpObj.data.length; k++){
        if (aname == colorInpObj.data[k].type) {
            if (atype == "color"){
                colorInpObj.data[k].color = avalue;
                acolor = avalue
                anopacity = colorInpObj.data[k].opacity
            }
            else if (atype == "range"){
                colorInpObj.data[k].opacity = avalue;
                anopacity = avalue/100;
                document.getElementById("valueOpacity_"+k).innerHTML = avalue + "%";
                acolor = colorInpObj.data[k].color;
            }
        }
    }

    for (var i = 0; i < scene.children.length; i++) {  
        if (aname == scene.children[i].userData.type) {
            scene.children[i].children[0].material = new THREE.MeshPhongMaterial({
                color: acolor,
                opacity: anopacity,
                transparent: true
            });
        }
    }
}

// JIHOON: Read sensor data from the google sheet
 function readData() {
    console.log("listMajors");
    alert("This function is not provided in this live-demo version");
}

// JIHOON: Write sensor data on the google sheet
function writeData() {
    console.log("writeData");
    alert("This function is not provided in this live-demo version");
}

// JIHOON: Setup the timeSlider on the web
function setupSliderInterval(){
    document.getElementById("inputTimeSlider").step = updateInterval*1000;
}

// JIHOON: Import sensor data from MQTT broker
function importSensorData(filePath){
    var timeNow = Date.now();

    if (Math.floor((timeNow-timeStart)/1000) >= updateInterval) {
        fetch(filePath).then(function(response){
        response.text().then(function(text){
            document.getElementById("lenData").innerHTML = sensorDict[numTime].length;
            sensorRealtime = JSON.parse(text);
            var inputText = "";
            var strTime_ = rewriteTimestamp_save(timeNow);        
            var showDict = "<br>";
            
            sensorDictKeys.forEach(e => {
                if (e == strTime){                    
                    sensorDict[strTime].push(strTime_);                    
                } else if (e == numTime) {
                    sensorDict[numTime].push(timeNow);
                } else {
                    var inputValue = Math.floor(Math.random() * 800)/100;
                    sensorRealtime[e] = parseFloat(inputValue);

                    sensorDict[e].push(parseFloat(inputValue));
                    inputText += '<br>' + e + ': ' + inputValue.toString();
                }  
                showDict += e + ": ";
                showDict += "["+sensorDict[e].toString() + "]<br>";
            });

            document.getElementById('getObject').innerHTML = inputText;          
            //document.getElementById('showDict').innerHTML = showDict;
            });
        });
        timeStart = Date.now();
        updateTimeline();

        if (selElement && sensorDictKeys.includes(selElement.userData.sensorId)) {
            lineChart = new GraphTable("GraphTableDIV", selElement, sensorDict);
            lineChart.refresh();

            gaugeChart = new RealTable("RealTableDIV", selElement, sensorRealtime);
            gaugeChart.refresh();
        } else if (selElement){
            document.getElementById("GraphTableDIV").innerHTML = "";
            document.getElementById("RealTableDIV").innerHTML = "";
        }

        if (heatmapOn) {
            currentHeightRatio = meshHeat.material.uniforms.heightRatio.value;       
            scene.remove(scene.getObjectByName(varVizualize));
            var idx = 0;
            for (var i = 0; i < scene.children.length+1; i++) {
                if (sensorDictKeys.slice(2).length * 2 == idx){
                    i += idx;
                } else if (scene.children[i].name == varText || scene.children[i].name == varLine) {
                    scene.remove(scene.children[i]);
                    i -= 1;
                    idx += 1;
                }
            }

            drawHeatmap(sensorRealtime);
            realtimeDataDisplay(sensorRealtime);  
        } 
       } 


       if (Math.floor((timeNow-blinkTime)/1000) >= blinkInterval) {    
        for (var i = 0; i < scene.children.length; i++) {
            if (sensorDictKeys.slice(2).includes(scene.children[i].userData.sensorId)) {
                var sensorClr_;
                if (blinkOn){
                    sensorClr_ = "#ffff00";
                    blinkOn = false;
                } else {
                    sensorClr_ = colorInpObj.data[6].color;
                    blinkOn = true;
                }    

                scene.children[i].children[0].material = new THREE.MeshPhongMaterial({
                    color: sensorClr_,
                    opacity: colorInpObj.data[6].opacity,
                    transparent: true  
                });
            }
        }
        blinkTime = Date.now();
       }
  }

// JIHOON: Rewrite timestamp into human-readable string
function rewriteTimestamp_save(timeNow){
    var timeDate = new Date(timeNow);
    return (timeDate.getMonth()+1)+
    "/"+timeDate.getDate()+
    "/"+timeDate.getFullYear()+
    " "+timeDate.getHours()+
    ":"+timeDate.getMinutes()+
    ":"+timeDate.getSeconds();
}

// JIHOON: Rewrite timestamp into human-readable string
function rewriteTimestamp_show(timeNow){
    var timeDate = new Date(timeNow);
    var hours = timeDate.getHours();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return hours+
    ":"+timeDate.getMinutes()+
    ":"+timeDate.getSeconds()+
    " "+ampm+
    " ("+(timeDate.toLocaleString('default', {month:'short'}))+
    " "+timeDate.getDate()+")";
}

// JIHOON: Create heatmap mesh
function createHeightMap(sensorRealtime){
    var prev_max = 50;
    var canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;

    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 256, 256);

    var radius = 50;

    for (var i = 0; i < scene.children.length; i++) {
        if (sensorDictKeys.slice(2).includes(scene.children[i].userData.sensorId)) {            
            var x = (scene.children[i].userData.centroid.x-20 + prev_max/2)/prev_max * canvas.width; //  
            var y = (-scene.children[i].userData.centroid.y+15+prev_max/2)/prev_max * canvas.width;// ;
            
            if (realtimeOn){
                var h8 = sensorRealtime[scene.children[i].userData.sensorId] / sensorValueMax * 255;
            } else {
                if (!vizIndex) {vizIndex = sensorDict[scene.children[i].userData.sensorId].length -1;}
                var h8 = parseInt(sensorDict[scene.children[i].userData.sensorId][vizIndex]) / sensorValueMax * 255;
                console.log(sensorDict[scene.children[i].userData.sensorId][vizIndex]);
                console.log(h8);
            }
            var grd = ctx.createRadialGradient(x, y, 1, x, y, radius);

            grd.addColorStop(0, "rgb("+ h8 + "," + h8 + "," + h8 +",1)");
            grd.addColorStop(1, "transparent");
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, 256, 256);

        } else if (scene.children[i].userData.type == "Wall"){
            var x = scene.children[i].userData.centroid.x;
            var y = scene.children[i].userData.centroid.y;
            var h8 = 0;     
            var grd = ctx.createRadialGradient(x, y, 1, x, y, radius);

            grd.addColorStop(0, "rgb("+ h8 + "," + h8 + "," + h8 +")");
            grd.addColorStop(1, "transparent");
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, 256, 256);
        }
    }
    return new THREE.CanvasTexture(canvas);
  }

// JIHOON: Get center point of every object
function getCenterPoint(mesh) {
    var middle = new THREE.Vector3();
    var geometry = mesh.geometry;

    geometry.computeBoundingBox();

    middle.x = (geometry.boundingBox.max.x + geometry.boundingBox.min.x) / 2;
    middle.y = (geometry.boundingBox.max.y + geometry.boundingBox.min.y) / 2;
    middle.z = (geometry.boundingBox.max.z + geometry.boundingBox.min.z) / 2;

    mesh.localToWorld( middle );
    return middle;
}

// JIHOON: Draw heatmap mesh
function drawHeatmap(sensorRealtime){
    const planeHeatmap = new THREE.PlaneGeometry(50, 50, 100, 100);
    planeHeatmap.rotateX(-Math.PI * 0.5);
    
    // JIHOON: Update height value of the heatmap
    if (controlHeat){
        currentHeightRatio = meshHeat.material.uniforms.heightRatio.value;
        heatFolder.remove(controlHeat);
    }

    var heatVertex = `
        uniform sampler2D heightMap;
        uniform float heightRatio;
        varying vec2 vUv;
        varying float hValue;
        void main() {
        vUv = uv;
        vec3 pos = position;
        hValue = texture2D(heightMap, vUv).r;
        pos.y = hValue * heightRatio;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
        }
        `;

        var heatFragment = `
        varying float hValue;

        // honestly stolen from https://www.shadertoy.com/view/4dsSzr
        vec3 heatmapGradient(float t) {
        return clamp((pow(t, 1.5) * 0.8 + 0.2) * vec3(smoothstep(0.0, 0.35, t) + t * 0.5, smoothstep(0.5, 1.0, t), max(1.0 - t * 1.7, t * 7.0 - 6.0)), 0.0, 1.0);
        }

        void main() {
        float v = abs(hValue - 1.);
        gl_FragColor = vec4(heatmapGradient(hValue), 1. - v * v) ;
        }
        `;

    var heightMap = createHeightMap(sensorRealtime);
    meshHeat = new THREE.Mesh(planeHeatmap, new THREE.ShaderMaterial({
        uniforms: {
          heightMap: {value: heightMap},
          heightRatio: {value: currentHeightRatio}
        },
        vertexShader: heatVertex,
        fragmentShader: heatFragment,
        transparent: true
      }));
    meshHeat.name = varVizualize;

    // JIHOON: Update meshHeatmap
    if (heatmapOn){
        scene.add(meshHeat);
        controlHeat = heatFolder.add(meshHeat.material.uniforms.heightRatio, "value", 1, 15).name("heightRatio");
        heatFolder.open(); 
    }

}

// JIHOON: Get location data of active sensors
function activeSensorLocation() {
    for (var i = 0; i < scene.children.length; i++) {
        if (sensorDictKeys.slice(2).includes(scene.children[i].userData.sensorId)) {
            var x = scene.children[i].userData.centroid.x;// - 20;
            var y = scene.children[i].userData.centroid.y;// + 15;
            var z = scene.children[i].userData.centroid.z;
            var radius = 1;

            const geometry = new THREE.SphereGeometry( radius, 16, 16 );                    
            const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
            const sphere = new THREE.Mesh( geometry, material );
            sphere.position.x = x -20;
            sphere.position.y = z;
            sphere.position.z = -y +15;
            //sphere.rotation.x = -Math.PI / 2;
            scene.add( sphere );

        }
    }
}

// JIHOON: Display real-time data
function realtimeDataDisplay(sensorRealtime) {
    var textHeight = 15;
    for (var i = 0; i < scene.children.length; i++) {
        if (sensorDictKeys.slice(2).includes(scene.children[i].userData.sensorId)) {
            var x = scene.children[i].userData.centroid.x - 20;
            var y = scene.children[i].userData.centroid.z-0.3;
            var z = - scene.children[i].userData.centroid.y + textHeight;
            //y *= currentHeightRatio;

            var value_;
            var textClr_;
            var lineClr_;
            var text = scene.children[i].userData.sensorId + " (";
            if (realtimeOn){
                value_ = sensorRealtime[scene.children[i].userData.sensorId];
                console.log(sensorRealtime[scene.children[i].userData.sensorId]);
                text += value_;                
            } else {
                value_ = sensorDict[scene.children[i].userData.sensorId][vizIndex];
                text += value_;
            }
            text += strMetric + ")";

            if (blinkOn && numThreshold<value_) {
                lineClr_= 0xff0000;
                textClr_ = {r:255, g:0, b:0, a:1.0};
            } else {
                lineClr_= 0xffffff;
                textClr_ = {r:255, g:255, b:255, a:1.0};
            } 

            var measurement = makeTextSprite(text.toString(), 
            { fontsize: 18, textColor: textClr_});
            measurement.position.set(x,y* currentHeightRatio,z);
            measurement.name = varText;
            //idx += 1;
            
            scene.add(measurement);

            const materialLine = new THREE.LineBasicMaterial( { color: lineClr_ } );
            const ptsLine = [];
            ptsLine.push( new THREE.Vector3( x, y, z) );
            ptsLine.push( new THREE.Vector3( x, y * currentHeightRatio + 1, z ) );

            const geoLine = new THREE.BufferGeometry().setFromPoints( ptsLine );
            const sensorLine = new THREE.Line( geoLine, materialLine );
            sensorLine.name = varLine;

            scene.add(sensorLine);         
        }
    }
}

// JIHOON: Add a button to visualize sensor data as heatmap
function toggleViz(){
    if (heatmapOn){
        heatmapOn = false;

        currentHeightRatio = meshHeat.material.uniforms.heightRatio.value;
        heatFolder.remove(controlHeat);
        scene.remove(scene.getObjectByName(varVizualize));
        var idx = 0;
        for (var i = 0; i < scene.children.length+1; i++) {
            if (sensorDictKeys.slice(2).length * 2 == idx){
                i += idx;
            } else if (scene.children[i].name == varText || scene.children[i].name == varLine) {
                scene.remove(scene.children[i]);
                i -= 1;
                idx += 1;
            } 
        }     

        controlHeat = NaN;
    } else {
        heatmapOn = true;

        drawHeatmap(sensorRealtime);
        realtimeDataDisplay(sensorRealtime);        
    }
}

// JIHOON: Add a button to decide whether to visualize real-time data or historical data
function realtimeViz(){
    if (realtimeOn) {
        realtimeOn = false;
    } else {
        realtimeOn = true;
    }
}

// JIHOON: Write a text of real-time data
function makeTextSprite( message, parameters )
{
    if ( parameters === undefined ) parameters = {};
    var fontface = parameters.hasOwnProperty("fontface") ? parameters["fontface"] : "Arial";
    var fontsize = parameters.hasOwnProperty("fontsize") ? parameters["fontsize"] : 18;
    var borderThickness = parameters.hasOwnProperty("borderThickness") ? parameters["borderThickness"] : 4;
    var borderColor = parameters.hasOwnProperty("borderColor") ?parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };
    var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?parameters["backgroundColor"] : { r:0, g:0, b:255, a:1.0 };
    var textColor = parameters.hasOwnProperty("textColor") ?parameters["textColor"] : { r:0, g:0, b:0, a:1.0 };

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    context.font = "Normal " + fontsize + "px " + fontface;
    var metrics = context.measureText( message );
    var textWidth = metrics.width;

    context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + "," + backgroundColor.b + "," + backgroundColor.a + ")";
    context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + "," + borderColor.b + "," + borderColor.a + ")";
    context.fillStyle = "rgba("+textColor.r+", "+textColor.g+", "+textColor.b+", 1.0)";
    context.fillText( message, borderThickness, fontsize + borderThickness);

    var texture = new THREE.Texture(canvas) 
    texture.needsUpdate = true;
    var spriteMaterial = new THREE.SpriteMaterial( { map: texture } );
    var sprite = new THREE.Sprite( spriteMaterial );
    sprite.scale.set(0.5 * fontsize, 0.25 * fontsize, 0.75 * fontsize);

    return sprite;  
}

// JIHOON: Update strings of timeSlider
function updateTimeline(){
    if (sensorDict[numTime] && lenSensorDict != sensorDict[numTime].length){
        lenSensorDict = sensorDict[numTime].length;
        document.getElementById("inputTimeSlider").min = parseInt(sensorDict[numTime][0]);
        document.getElementById("inputTimeSlider").max = parseInt(sensorDict[numTime][lenSensorDict-1]);
        document.getElementById("sliderMin").innerHTML = rewriteTimestamp_show(parseInt(sensorDict[numTime][0]));
        document.getElementById("sliderMax").innerHTML = rewriteTimestamp_show(parseInt(sensorDict[numTime][lenSensorDict-1]));

        if (realtimeOn) {
            var currentValue = sensorDict[numTime][lenSensorDict-1];
            document.getElementById("inputTimeSlider").value = currentValue;
            document.getElementById("sliderValue").innerHTML = "<br><span id='subtitles'>Selected Time: </span>" + rewriteTimestamp_show(currentValue);   
        }
    }
}

// JIHOON: Select time point to visualize historical data
function timeSlider(){
    var vizTime = parseInt(document.getElementById("inputTimeSlider").value);
    document.getElementById("sliderValue").innerHTML = "<br><span id='subtitles'>Selected Time: </span>" + rewriteTimestamp_show(vizTime);   
    var inList = sensorDict[numTime].map(function(x) { return parseInt(x / 1000); });
    var goal = parseInt(vizTime / 1000);
    var closest = inList.reduce(function(prev, curr) {
        return (Math.abs(curr-goal) < Math.abs(prev-goal) ? curr : prev);
    });
    vizIndex = inList.indexOf(closest);
}

// Create the renderer loop
function render(time) {
    time *= 0.001;  // convert time to seconds

    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // check if the size has been changed
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);   // set the renderer size to the canvas size
        camera.aspect = canvas.clientWidth / canvas.clientHeight; // set the renderer aspect ratio
        camera.updateProjectionMatrix();
    }

    controls.update();
    // update the picking ray with the camera and pointer position
    if (rayset) {
        raycaster.setFromCamera(pointer, camera);

        // calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(scene.children);

        for (let i = 0; i < intersects.length; i++) {
            // the objects are nested so we need to ask for the selected object's parent.
            //!HW filter for only selected objects that are model objects (not lights, cameras, etc.)
            
            // JIHOON: to show certain elements defined in 'showElements'
            if (showElements.includes(intersects[i].object.parent.userData.type)) {
                //console.log(intersects[0].object.parent.name);
                //!HW This is tricky. The selected mesh is likely to be a part of the object, not the object itself. Get its parent.
                //!HW if you are generating objects as simple THREE.Geometry objects this parent reference may not be needed 
                selElement = intersects[i].object.parent;

                // JIHOON: 
                if (prevFurniture && prevMaterial) {
                    prevFurniture.children[0].material = prevMaterial;                        
                }            
                prevFurniture = selElement;
                prevMaterial = selElement.children[0].material;  

                // JIHOON: Clicked element's color is chaged to Red
                selElement.children[0].material = new THREE.MeshPhongMaterial({
                    color: 0xff0000,
                    opacity: 0.8,
                    transparent: true  
                });
                
                if (lock == false || selElement.name != lastObjectName ) {                            
                    if(controlX){
                        cubeFolder.remove(controlX);
                        cubeFolder.remove(controlY);
                        cubeFolder.remove(controlZ);
                        cubeFolder.remove(controlR);
                    }
                    
                    addCubeFolder();
                    lastObjectName = selElement.name;
                    lock = true;
                }
                addSelTable();
            }
            //console.log("Name is: " + intersects[i].object.name);
        }
    }
    
    updateGui();
    updateConnection();
    importSensorData(sensorDictPath);
    
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}


function onPointerMove(event) {

    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components
    const canvas = document.getElementById("c");
    const width = canvas.clientWidth;
    const height = canvas.clientHeight
    var X = event.clientX - canvas.getBoundingClientRect().left;
    var Y = event.clientY - Math.round(canvas.getBoundingClientRect().top);

    // pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    // pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
    pointer.x = (X / width) * 2 - 1;
    pointer.y = - (Y / height) * 2 + 1;
    rayset = true;

}

////////////////  onDisplayData  This function gets called when the display data button //// 
function onDisplayData(key) {
    //!HW Make a text string of the HTML required to capture the data, incrementally add to this string.
    var textout = "";
    textout += "<table class='table table-bordered TableStyle'>"  // Table header
    textout += "<thead><tr><th>Object Name</th><th style='width:30%'>"+key+"</th></tr></thead>";

    for (var i = 0; i < scene.children.length; i++) {  // for each of the children in the scene
        var myObject = scene.children[i];   
        // filter somehow for only the model elements, not things like lights and cameras
        if ((myObject[key] || myObject.userData[key]) && myObject.name) {
                   
            if (true) {
                textout += "<tr><td>";
                textout += myObject.name;
                textout += "</td><td>"
                if (key == "centroid"){
                    Object.keys(myObject.userData[key]).forEach(p => {
                        textout += p + ": " + Math.round(myObject.userData[key][p]*1000)/1000;
                        p == "z" ? textout += "" : textout += ", ";
                    })
                } else {
                    myObject.userData[key] ? textout += myObject.userData[key] : textout += myObject[key];
                }                
                textout += "</td></tr>";
            }
        }
    }
    textout += "</table><br><input type='button' value='Close' onclick = 'closeDisplayData()'>";
    // Get the "data" div from the DOM and place the text in it
    document.getElementById("dataList").innerHTML = textout;
}

// JIHOON: Show 'Closed' string if the user click the 'Close' button
function closeDisplayData(){
    document.getElementById("dataList").innerHTML = "<input type='button' value='Closed'>";
}

//////////////////////////////////      GraphTable class         //////////////

class GraphTable {
    constructor(divID, selElement_, sensorDict_) {
      this.selElement = selElement_;
      this.sensorDict = sensorDict_;
      this.divid = divID;
  };
  
    refresh() {
        var myDiv = document.getElementById(this.divid);
        var atext = "";
        atext += "<table class='GraphTableStyle'><tr><td>";
        atext += '<h4 class="titleChart">Historical Data</h4>';
        atext += '<div class="graph-wrapper">';
        atext += '<canvas id="myAreaChart"></canvas>';
        atext += "</div></td></tr></table>";

        myDiv.innerHTML = atext;

        var sensorType = this.selElement.userData.sensorId;
        var sensorData = this.sensorDict[sensorType];
        var timeData = this.sensorDict[strTime];
              
        var ctx = document.getElementById("myAreaChart");
        _line_component.data.labels = timeData;
        _line_component.data.datasets[0].data = sensorData;
        _line_component.data.datasets[0].label = sensorType;
        var chart = new Chart(ctx, _line_component);      
        }
    }   // end table class

  
  
//////////////////////////////////      RealTable class         ////////////////////////////////

class RealTable {
    constructor(divID, selElement_, sensorRealtime_) {
        this.selElement = selElement_;
        this.sensorRealtime = sensorRealtime_;
        this.divid = divID;
    };

    refresh() {
    var sensorType = this.selElement.userData.sensorId;
    var sensorData = this.sensorRealtime[sensorType];

    var myDiv = document.getElementById(this.divid);
    var atext = "";
    atext += "<table class='RealTableStyle'><tr><td>";
    atext += '<h4 class="titleChart">Realtime Data</h4>';
    atext += '<div class="gauge-wrapper">';
    atext += '<canvas id="myGaugeChart"></canvas>';
    atext += '<div class="textGauge">'+sensorData+'</div>';
    atext += "</div></td></tr></table>";

    myDiv.innerHTML = atext;        

    var ctx = document.getElementById("myGaugeChart");
    var chart = new Chart(ctx, _gauge_component);
    change_gauge(chart, "Gauge", [sensorData, maxCO2-sensorData]);
    }
}   // end table class
   
  
  // Set new default font family and font color to mimic Bootstrap's default styling
  Chart.defaults.global.defaultFontFamily = 'Nunito', '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
  Chart.defaults.global.defaultFontColor = '#858796';
  
   //JIHOON: drawing & updating charts 
  function change_gauge(chart, label, data){
    chart.data.datasets.forEach((dataset) => {
      if(dataset.label == label){
        dataset.data = data;
      }  
    });
    chart.update();
  }
  
  _gauge_component = {
    type:"doughnut",
    data: {
        labels : ["Red","Grey"],
        datasets: [{
            label: "Gauge",
            data : [10, 190],
            backgroundColor: [
                "rgb(78, 115, 223)",
                "rgb(120, 120, 120)",
                "rgb(255, 205, 86)"
            ]
        }]
    },
    options: {
      circumference: Math.PI + 1,
      rotation: -Math.PI - 0.5,
        cutoutPercentage : 60, // precent
        plugins: {
            datalabels: {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              borderColor: '#ffffff',
              color: function(context) {
                return context.dataset.backgroundColor;
              },
              font: function(context) {
                var w = context.chart.width;
                return {
                  size: w < 512 ? 18 : 20
                }
              },
              align: 'start',
              anchor: 'start',
              offset: 10,
              borderRadius: 4,
              borderWidth: 1,
              formatter: function(value, context) {
                var i = context.dataIndex;
                var len = context.dataset.data.length - 1;
                if(i == len){
                  return null;
                }
                return value+' mph';
              }
            }
        },
        legend: {
            display: false
        },
        tooltips: {
            enabled: false
        }
    }
  }
  
  function number_format(number, decimals, dec_point, thousands_sep) {
    // *     example: number_format(1234.56, 2, ',', ' ');
    // *     return: '1 234,56'
    number = (number + '').replace(',', '').replace(' ', '');
    var n = !isFinite(+number) ? 0 : +number,
      prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
      sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
      dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
      s = '',
      toFixedFix = function(n, prec) {
        var k = Math.pow(10, prec);
        return '' + Math.round(n * k) / k;
      };
    // Fix for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
    if (s[0].length > 3) {
      s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
    }
    if ((s[1] || '').length < prec) {
      s[1] = s[1] || '';
      s[1] += new Array(prec - s[1].length + 1).join('0');
    }
    return s.join(dec);
  }
  
// JIHOON: Basic components to show a line chart 
  _line_component = {
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
              return number_format(value,2) + strMetric;
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
        titleFontSize: 16,
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
            return datasetLabel + ': ' + number_format(tooltipItem.yLabel,2) + strMetric;
          }
        }
      }
    }
  }






