//Script for Sancar Lab database project, written by Yashar Asgari
$(document).ready(function(){
    
        //first, create list of gene names for autocomplete
        queryResultsAuto([{}])
    
        //setting up dropdown for chromosomes. changes depending on organism selected
        buildChrDropdown(21);
    
        //query db for sample sheet in order to get columns/data for each experiment for plotting purposes
        getSampleSheet();
    
        //prep server connection
        const clientPromise = stitch.StitchClientFactory.create('dataretrieval-vwdtg');
    
    
        //Global Variables
        var selectedOrganism = 'mouse';
        var orgDict = {}; //dictionary for organism type; to be used in query function
         //list of query conditions from user input
        var chrSelected = false; //keeps track if a chromosome from the dropdown is selected
        var startSelected = false;
        var endSelected = false;
        var inputStartChr;
        var inputEndChr;
        var client;
        var db;
        var returned;
        var geneInputName;
        var queryArray = [];
        var queryArray2 = [];
        var sampleSheet = []; //seeing which columns/data go to which experiment for plotting purposes
        
        //page loads this by default, can change later
        orgDict.organism = 'mouse'
    
    
        //sets up server connection and chromosome placement query method
        function queryResultsChr(arg1, prev){
            clientPromise.then(stitchClient =>{
                client = stitchClient;
                db = client.service('mongodb', 'mongodb-atlas').db('data');
              
                return client.login().then(queryChr(arg1, prev))
            });
        }
        var last_id1 = null;
        function queryChr(arg1, prev){
            
            arg1 = arg1.length > 0 ? { $and: arg1 } : {};
            
    
            if(last_id1 === null){
                db.collection('gene').find(arg1).limit(10).execute().then(docs => {
                    var html;
                    
                    if(docs.length == 0){
                        //$('#results').html("<h1><span class='label label-warning'>No results left</span></h1>")
                        $('#results').html("<div class = 'alert alert-warning' role = 'alert'> <strong> No results left</strong></div>")
                        
                    }else{
                        html = createDynamicTable(docs)                      
                        document.getElementById("results").innerHTML = html; 
                        last_id1 = docs[docs.length-1]['_id']
                    }
                });
            }else if(!prev){
                db.collection('gene').find({"$and":[{'_id':{"$gt":last_id1}},arg1]}).limit(10).execute().then(docs => {
                    var html;
                     
                    if(docs.length == 0){
                        //$('#results').html("<h1><span class='label label-warning'>No results left</span></h1>")
                        $('#results').html("<div class = 'alert alert-warning' role = 'alert'> <strong> No results left</strong></div>")
                        
                    }else{
                        html = createDynamicTable(docs) 
                        document.getElementById("results").innerHTML = html; 
                        last_id1 = docs[docs.length-1]['_id']
                    }
                     
                    
                });
            }else if(prev){
                db.collection('gene').find({"$and":[{'_id':{"$lt":last_id1}},arg1]}).limit(10).execute().then(docs => {
                    var html;
                    if(docs.length == 0){
                        //$('#results').html("<h1><span class='label label-warning'>No results left</span></h1>")
                        $('#results').html("<div class = 'alert alert-warning' role = 'alert'> <strong> No results left</strong></div>")
                    }else{
                    html = createDynamicTable(docs) 
                    document.getElementById("results").innerHTML = html; 
                    last_id1 = docs[docs.length-1]['_id']
                    }
                });
            }
        }
    
    
        //helper functions for name query TODO--- do we need pagination for name query?
        function queryResultsName(arg2){
            clientPromise.then(stitchClient =>{
                client = stitchClient;
                db = client.service('mongodb', 'mongodb-atlas').db('data');
              
                return client.login().then(queryName(arg2))
            });
        }
        var nameInput;
        var last_id2 = null;
        function queryName(arg2){
            
            nameInput = geneInputName;       
            arg2 = arg2.length > 0 ? { $and: arg2 } : {};
            
    
            if(last_id2 === null){
                db.collection('gene').find(arg2).limit(1).execute().then(docs2 => {
                    var html;
                    analyzeData(docs2) 
                    //html = createDynamicTable(docs2)  
                    //document.getElementById("results").innerHTML = html; 
                    //call function to see if columns match which experiment, then call the experiment
                    last_id2 = docs2[docs2.length-1]['_id'] 
                    
                    
                });
            }else{
                db.collection('gene').find({"$and":[{'_id':{"$gt":last_id2}},arg2]}).limit(1).execute().then(docs2 => {
                    var html;
                    
                    analyzeData(docs2) 
                    //html = createDynamicTable(docs2)  
                    //document.getElementById("results").innerHTML = html; 
                    last_id2 = docs2[docs2.length-1]['_id'] 
    
                });
            }
    
        }
    
        var appended = false;
        //pagination event handlers (next&prev buttons)
        $('#next').click(function(){
            if(queryArray2.length === 0){
                queryResultsChr(queryArray, false)
            }else if(queryArray.length === 0){
                if(appended){
                    return;
                }
                //queryResultsName(queryArray2, false)
                //pagination not necessary for Gene name search
                $('#results').append('<b> Only one gene for each name')
                appended = true;
            }
            
        })
    
    
        $('#prev').click(function(){
            if(queryArray2.length === 0){
                queryResultsChr(queryArray, true)
            }else if (queryArray.length === 0){
                if(appended){
                    return;
                }
                //queryResultsName(queryArray2, true)
                //pagination not necessary for Gene name search
                $('#results').append('<b> Only one gene for each name')
                appended = true;
            }
        })
    
    
        //autocomplete
        var names = [];
        var namesList = [];
        function queryResultsAuto(arg4){
            const clientPromise = stitch.StitchClientFactory.create('dataretrieval-vwdtg');
            clientPromise.then(stitchClient =>{
                client = stitchClient;
                db = client.service('mongodb', 'mongodb-atlas').db('data');
              
                return client.login().then(queryAuto(arg4))
            });
        }
        function queryAuto(arg4){
            
            arg4.push(orgDict)
            arg4 = arg4.length > 0 ? { $and: arg4 } : {};
            
            db.collection('gene').find(arg4, {"name":1, "_id" : 0}).execute().then(docs => {    
                names = docs;
                
                for(var i in names){
                    
                    namesList.push(names[i]["name"])
                }
                console.log('names list for autocomplete ready.')
                return namesList;
            });
        }
    
        $("#gene").autocomplete({ //pause auto for first 2 chars, implement scroll bar for list
            source: function(request, response) {
                var results = $.ui.autocomplete.filter(namesList, request.term);
        
                response(results.slice(0, 20)); //show only 20 in the list at a time
                autoFocus:true;
                delay: 600; //600 milliseconds
                minLength: 3; //min length of inputted chars before search begins
            }
        });
       
      
        /**
         * Sets up dropdown for chromosome numbers. 
         * @param {int} numChr Number of chromosomes for the given organism
         */
        function buildChrDropdown(numChr){
            console.log('building dropdown' + numChr)
            var select = "* <b>Chromosome: </b><select id = 'chrDropdown' >";
            for (i=0;i<=numChr-2;i++){
                if(i == 0){
                    select += "<option val = 'chr'>-</option>";
                }else{
                    select += '<option val=' + i + '>' + i + '</option>';
                }
            }
            select += "<option val = 'x'> X </option>"
            select += "<option val = 'y'> Y </option>"
            select+='</select>'
            $('#chrDropDiv').html(select);
        }
    
    
        //adjusts query for user changes in organism dropdown, need to add other organisms
        $('#chooseOrg').change(function(){
            console.log($('#chooseOrg').val() + ' was selected')
            switch($('#chooseOrg').val()){
                case 'mouse':
                    orgDict.organism = 'mouse'
                    buildChrDropdown(21)
                case 'human':
                    orgDict.organism = 'human'
                    buildChrDropdown(24)
            }
            last_id1 = null;
            last_id2 = null;
        })
    
    
        //CHANGE handlers for input fields
        $('#startChr').change(function(){
            if($('#startChr').val() != ''){
                inputStartChr = $('#startChr').val();
                console.log('inputStartChr changed')
                //$('#startChr').css("background-color", "")
                $('#startChr').removeClass('ui-state-error ui-corner-all');
            }
            last_id1 = null
        })
    
        $('#endChr').change(function(){
            if($('#endChr').val() != ''){
                inputEndChr = $('#endChr').val();
                console.log('inputEndChr changed')
                //$('#endChr').css("background-color", "")
                $('#endChr').removeClass('ui-state-error ui-corner-all');
            }
            last_id1 = null;
        })
    
        $('#chrDropdown').change(function(){
            if($('#chrDropdown').val() != '-'){
                //$('#chrDropDiv').css("color", "")
                $('#chrDropdown').removeClass('ui-state-error ui-corner-all');
            }
            last_id1 = null;
        })
    
        $('#gene').change(function(){
            if($('#gene').val().length != 0){
                //$('#gene').css("background-color", "")
                $('#gene').removeClass('ui-state-error ui-corner-all');
            }
            last_id2 = null;
        })
    
    
        //submit button event handler for chromosome placement query
        $('#submitChr').click(function(){
            queryArray = [];
    
            $('#results').html("<img src = 'loading.gif' alt = 'Loading...'>")
            
            if($('#chrDropdown').val() === '-'){
                //change div color to show where to select
                //$("#chrDropDiv").css("color","#DF0E0E");
                $('#chrDropdown').addClass('ui-state-error ui-corner-all');
                console.log('enter chromsome');
            }else{
    
                var val = 'chr'+ $('#chrDropdown').val();
                queryArray.push({'chr': val})
                
            }
    
            if($('#startChr').val().length != 0 && $('#endChr').val().length != 0){
                if($('#chrDropdown').val() != '-'){
                    queryArray.push({"$and":[{"start":{"$gte": inputStartChr}},{"end":{"$lte": inputEndChr}}]})
                    queryArray.push(orgDict)
                    queryResultsChr(queryArray);
                }
            }else{
                //change div color to show to select both start and end
                console.log('input start and end')
                if($('#startChr').val().length== 0){
                    $('#startChr').addClass('ui-state-error ui-corner-all');
                }
                if($('#endChr').val().length == 0){
                    $('#endChr').addClass('ui-state-error ui-corner-all');
                }
            }
           queryArray2 = [];
            
        })
    
        //submit event handler for gene name query
        $('#submitName').click(function(){
            queryArray2 = [];
            console.log($("#gene").val())
            if($('#gene').val().length != 0){
                console.log('gene field has input')
                geneInputName = document.getElementById('gene').value;
                queryArray2.push({'name':document.getElementById('gene').value})
                queryArray2.push(orgDict)
    
                queryResultsName(queryArray2);
            }else{
                console.log('enter gene name') //add div color change here
                
                $('#gene').addClass('ui-state-error ui-corner-all');
            } 
            queryArray = [];
         
        })
    
        /**
         * Given the results from a query, the method will build a table with embedded click 
         * event handlers for each row (to enable plots to be shown)
         * @param {*} objArray Query results stored here
         */
        function createDynamicTable(objArray) {
            var array = objArray;
     
            var str = '<table class="table-striped"> <thead class = "thead-dark">';
            str += '<tr>';
            for (var index in array[0]) {
                str += '<th scope="col">' + index + '</th>';
            }
            
            str += '</tr></thead>';
            //str += "<tbody id = 'plot'> </tbody>"
            str += "<tbody>";
            for (var i = 0; i < array.length; i++) {
                str += "<tr id = 'dataRow_" + i +"'> ";
            
                for (var index in array[i]) {
                    //ERROR HERE FOR NAME, cant parse float from string
                    str += '<td>' + array[i][index] + '</td>';
                    
                }
                $(document).on("click", "#dataRow_"  + i, function(){
                    console.log('row clicked')
                    $('#plots').html("<b>Choose Graph Type:</b> <br><div class = 'btn-group' data-toggle='buttons' <label class='btn btn-primary'><label class='btn btn-primary'>Bar<input class = 'graphSelect' name = 'graphSelect' type='radio' value = 'Bar'></label><label class='btn btn-primary'>Line<input class = 'graphSelect' name = 'graphSelect' type='radio' value = 'Line'></label></div> <br><br>");
                    $(document).on('change', '.graphSelect', function(){
                        if($('.graphSelect:checked').val() === 'Bar'){
                            //plotExpX(columnNames, data); 
                            //TODO pass in single data row to plot
                            graphData = [{x:columnNames, y:data, type:'bar'}];
                            Plotly.newPlot('plots', graphData,layout);                            
                            
                        }else if($('.graphSelect:checked').val() === 'Line'){
                            //plotExpY(columnNames, data);
                            //TODO pass in single data row to plot
                            graphData = [{x:columnNames, y:data, type:'scatter'}];
                            Plotly.newPlot('plots', graphData,layout); 
                        }
                    })
                    var columnNames = [];
                    var data = [];
                    var arrayIndex = this.id.slice(-1)
                    var tsColor = [];
                    var ntsColor = [];
                    
                    //get column names, skip first 8 columns
                    var count = 0;
                    for (var index in array[0]) {
                        if(count < 8){
                            count += 1;
                        }else{
                            columnNames.push(index)
                            //get columns organized for alternating bar colors b/w TS and NTS
                            if(index.substr(index.length-3) === 'NTS'){
                                ntsColor.push(index)
                            }else if(index.substr(index.length-3) === '_TS'){
                                tsColor.push(index)
                            }
                        }
                    } 
                    columnNames.splice(-1,1) //get rid of last column ('organism')
                    //get corresponding data, skip first 8 columns
                    for (var i = 0; i < array.length; i++) {
                        var count = 0;            
                        for (var index in array[i]) {
                            if(count < 8){
                                count +=1;
                            }else if(index === 'organism'){
                                //skip
                            }else{
                                data.push(array[i][index])//each data cell in row
                            }
                            
                        }
                    }
                    
                    var layout = {
                        autosize: false,
                        width: 500,
                        height: 500,
                        margin: {
                          l: 50,
                          r: 50,
                          b: 100,
                          t: 100,
                          pad: 4
                        },
                        title: "Experiment 1"
                      };
                    
                })
    
                str += '</tr>';
            }
            str += '</tbody>'
            str += '</table>';
            return str;
    
        }
        
    
    
        /**
         * Plots experiment X's data to 'plots' div
         * @param {[]} columnNames array of column names 
         * @param {[{}]} data Data to plot 
         */
        function plotExpX(columnNames, data){
            //column names should come from sample sheet
            graphData = [{x:columnNames, y:data, type:'bar'}];
            var layout = {
                autosize: false,
                width: 500,
                height: 500,
                margin: {
                  l: 50,
                  r: 50,
                  b: 100,
                  t: 100,
                  pad: 4
                },
                title: "Experiment X"
              };
            
            Plotly.newPlot('plotsX', graphData,layout)
        }
    
        /**
         * Plots experiment Y's data to plots div
         * @param {[]} columnNames array of column titles
         * @param {[{}]} data Data to plot
         */
        function plotExpY(columnNames, data){
            //column names should come from sample sheet
            graphData = [{x:columnNames, y:data, type:'scatter'}];
            var layout = {
                autosize: false,
                width: 500,
                height: 500,
                margin: {
                  l: 50,
                  r: 50,
                  b: 100,
                  t: 100,
                  pad: 4
                },
                title: "Experiment Y"
              };
            Plotly.newPlot('plotsY', graphData,layout)
        }
        /**
         * Get sample sheet to inform script of how to plot depending on experiment, stored in the 
         */
        
        function getSampleSheet(){
            const clientPromise = stitch.StitchClientFactory.create('dataretrieval-vwdtg');        
            clientPromise.then(stitchClient =>{
                client = stitchClient;
                db = client.service('mongodb', 'mongodb-atlas').db('data');
                client.login()
                db.collection('sample').find({}).execute().then(result => {
                    sampleSheet = result;
                    
                })
            });
        }
    
        /**
         * Function to compare the sampleSheet queried to data provided
         * in order to see where to call each experiment function
         * @param {[{}]} data to be analyzed
         */
        function analyzeData(data){
            var argColumnNames = []; 
            var argExpXNames = []; //x values for exp x
            var argExpXData = []; //y values for exp x
            var argExpYNames = []; //x values for exp y
            var argExpYData = []; //y values for exp y
            var oddColor = [];
            var evenColor = [];
    
            //organize columns for each experiment
            var count = 0;
            for (var index in data[0]) {
                //skip extra columns
                if(count < 8){
                    count += 1;
                }else{
                    for(var i = 0; i<sampleSheet.length; i++){
                        if(index === sampleSheet[i]['Sample']){
                            var experiment = sampleSheet[i]['Experiment']
                            if(experiment === 'X'){
                                argExpXNames.push(index)
                            }else if(experiment === 'Y'){
                                argExpYNames.push(index)
                            }
                        }
                    }
                    //get columns organized for alternating bar colors b/w TS and NTS, will be implemeneted later
                    if(index.substr(index.length-3) === 'NTS'){
                        oddColor.push(index)
                    }else if(index.substr(index.length-3) === '_TS'){
                        evenColor.push(index)
                    }
                }
            }
            
            //get corresponding data, skip first 8 columns
            for (var i = 0; i < data.length; i++) {
                var count = 0;            
                for (var index in data[i]) {
                    if(count < 8){
                        count +=1;
                    }else{ 
                        //index is each column name
                        for(var j = 0; j<sampleSheet.length; j++){
                            if(index === sampleSheet[j]['Sample'] ){
                                var experiment = sampleSheet[j]['Experiment']
                                if(experiment === "X"){
                                    argExpXData.push(data[i][index]);                            
                                }else if(experiment === "Y"){
                                    argExpYData.push(data[i][index]);
                                }
                            }
                        }
                    }
                    
                }
            }
            //TODO column names are correct, just need data 
            console.log('Exp X columns' + argExpXNames)
            console.log('Exp X data' + argExpXData)
            console.log('Exp Y columns' + argExpYNames)
            console.log('Exp Y data' + argExpYData)
            plotExpX(argExpXNames,argExpXData)
            plotExpY(argExpYNames,argExpYData)
        }
    
    })
    