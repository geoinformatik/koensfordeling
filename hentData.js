const displayText = {
    "xlable":"Antal mænd pr kvinde",
    "yHistLable":"Antal kommuner",
    "yAccumLable":"Akkumulered frekvens",
    "pageTitle" : "Kønsfordeling",
    "pageIntro" :"Kønsfordeling er en særlig afdelingen inden dor demografien hvor man studere skævheder i kønsfordeling og årsager her til.\n" +
    "\tDanmarks statistik offentligøre hver kvartal befolkningsdata opgjoprt op kommuine plan. du kan se hele tabellen her\n" +
    "    <a target=\"_blank\" href=\"http://www.statistikbanken.dk/statbank5a/SelectVarVal/Define.asp?MainTable=FOLK1A&PLanguage=0&PXSId=0&wsid=cftree\">Tabellen FOLK1A fra statistik namken</a>\n" +
    "\tData i denne tabel tilbage den seneste struktur reform i 2007 hvor 271 kommuner blev reduceret til 98 (plus chrestians ø) Det er derfor svært at sammenligne data\n" +
    "    fra før og efter 1/1 2008. Det første du skal gøre er at vælge det kvatal du er intreseret i.",
    "fetchMetaData": "Henter tabel information...",
    "reddyForSelection":"Vælg hvilke data du vel se neden for",
    "selectPeriod" : "Vælg periode : ",
    "fetchingPeriodData" : "Henter data for perioden : ",
    "filterOptionsTitle": "Filtrereings muligherder",
    "ageFilterPrompt": "Du kan ændre filtreringen af allersgrupper neden for, lige nu ser du :",
    "ageFilterForm": {"begin":"Aldre fra :","end":" til : " },
    "ageFilterFormSubmit":"Filtrer",
    "chartOptionsTitle":"Grafens udsende",
    "chamgeBins":"opdater grupper",
    "mapOptionsTitle":"Kortets udsende",
    "updateMap":"Opdater kortet",
    "mapClassifierLable":"Metode til katagoisering af kortet : ",
    "numberOfMapClasses": "Antal kalagorier på kortet : ",
    "mapClassifierOptions":["Lige store intervaller","fractiler"],
    "dispalyAreaTitle" : "Befolknings kønsfordeling  opdelt på kommuner for perioden : ",
    "ageFilterOptions" : ["Alle aldre", "Selvdifinereiode gruppe"],
    "statisticsTitle" :"Statistisk oversigt",
    "statistics":[["Minimun : ","minRow"],["Maximum : ","maxRow"],["Midelværdig : ","meanRow"],["Varians : ","varRow"]]
};

const projection = d3
    .geoMercator()
    .scale(7000)
    .rotate([-0.25, 0.25, 0]) //[x,y,z]
    .center([11.5, 57.5]);

let nonFilteredData =[];
let filteredData = [];
let kommuneData = [];
const svgWidth = 960, svgHeight = 500;
const margin = {top: 10, right: 30, bottom: 50, left: 40};

var x = d3.scaleLinear().range([margin.left, svgWidth - margin.right]);

var xlable = displayText.xlable;


var yHist = d3.scaleLinear()
    .range([svgHeight, 0]);
var yHistLable = displayText.yHistLable;

var yAccum = d3.scaleLinear()
    .range([svgHeight, 0])
    .domain([0,1]);

var yAccumLable = displayText.yAccumLable;

const FOLK1A_MetaRequest =
    {
        "table": "FOLK1A",
        "format": "JSON"
    };

let FOLK1Arequest =
    {
        "table": "FOLK1A",
        "format": "JSONSTAT",
        "variables": [
            {
                "code": "OMRÅDE",
                "values": [
                    "*"
                ]
            },
            {
                "code": "KØN",
                "values": [
                    "1",
                    "2"
                ]
            },
            {
                "code": "ALDER",
                "values": [
                    "*"
                ]
            }
        ]
    };


//This is nessersary since the build in find function brakes on seconf call
function rangeLoockUp(testArray,testValue){

    const maxI = testArray.length;
    let i = 0;
    while ((i < maxI) && (testArray[i].lowerClassBound < testValue)) i++;
    return testArray[i-1];
}



function drawSvg(){
    let numberOfBins = document.forms["numberOfBins"]["bins"].value
    let numberOfMapClasses = document.forms["mapProperties"]["mapClasses"].value
    classifyerMethod = document.forms["mapProperties"]["mapClassifier"].selectedIndex

    const min=  Number(d3.select("#minRow").node().lastChild.innerHTML);
    const max = Number(d3.select("#maxRow").node().lastChild.innerHTML);
    const mean = Number(d3.select("#meanRow").node().lastChild.innerHTML);
    const std = Math.sqrt(d3.select("#varRow").node().lastChild.innerHTML);
    const step = (max-min)/100;
    const mapSvg= d3.select("#mapSvg");
    let mapLegendClassWidth = (max - min) / numberOfMapClasses
    let legendClass = [];
    let svgMuni = {};


    //OPdate the colour values
    const colours = d3.schemeRdYlBu[numberOfMapClasses];

    //Because it is easyer the equal size classification is alwayes calculatet, but updatet if nessersary
     colours.forEach(function(e,i){
        legendClass.push({
            "id": i, "lowerClassBound": min + (i * mapLegendClassWidth),
            "upperClassBound": min + ((i + 1) * mapLegendClassWidth), "colour": e
        })
    });
    console.log(kommuneData);

     //Update the map colours and if in procenttile mode  update the legendClass


    if (classifyerMethod != 1) {   //in equal intera´wall mode
         kommuneData.forEach(function(muni){
            svgMuni = mapSvg.select("#muni_0"+ muni[0]);
            muniColour = rangeLoockUp(legendClass,muni[1]).colour;
            //  muniColour = legendClass.find(function (x){ return (x.upperClassBound > muni[1]) && (x.lowerClassBound <= muni[1]);}).colour;
            svgMuni.attr("fill", muniColour);
        })
    } else { //This is in procenttile mode
        let mapLegendClassWidth = 1 / numberOfMapClasses
        let j = 0, i = 0;
        let lowerClassBound = min;
        while (i <numberOfMapClasses ) { // loop through the legendClass array
            legendClass[i].lowerClassBound = lowerClassBound;
            while (j < kommuneData.length && kommuneData[j][2]<= (mapLegendClassWidth + (i *mapLegendClassWidth))){ //loop through the municipality data array
                svgMuni = mapSvg.select("#muni_0"+ kommuneData[j][0]);
                svgMuni.attr("fill", legendClass[i].colour);
                j++;
            }
            console.log(j);
            console.log(kommuneData[j-1]);
            console.log((mapLegendClassWidth + (i *mapLegendClassWidth)));
            lowerClassBound = kommuneData[j-1][1]
            legendClass[i].upperClassBound = kommuneData[j-1][1] //The absolut valut of the j observationn
            i++ ;
        }
     }

    // Update the chart
    let svgtest = d3.select("#graphDiv").select("svg");
    if (!svgtest.empty()){
        svgtest.remove();
        console.log("Remove");
    }

    var svg = d3.select("#graphDiv").append("svg")
        .attr("width", svgWidth + margin.left + margin.right)
        .attr("height", svgHeight + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    if (numberOfBins == 0){
        numberOfBins = Math.ceil(Math.sqrt(kommuneData.length))
    }

    const thresholds = d3.range(min, max, (max - min) / (numberOfBins));
    //when we use ticks for bins we get nice intervales .
    var histogram = d3.histogram()
        .value(d => d)
        .domain([min,max])
        .thresholds(thresholds);


//domain(x.domain())

    var bins = histogram(kommuneData.map(d => d[1]));

    yHist.domain([0, d3.max(bins, function(d) { return d.length; })]);

    var rects = svg.selectAll("rect.bar")
        .data(bins);

    rects.exit().remove();

    rectsEnter = rects.enter().append("rect")
        .attr("class", "bar").attr("x", 1)
        .attr("transform", function(d) {
            return "translate(" + x(d.x0) + "," + yHist(d.length) + ")"; })
        .attr("width", function(d) { return x(d.x1) - x(d.x0) -1 ; })
        .attr("height", function(d) { return svgHeight - yHist(d.length); });

    let legendRects = svg.selectAll("rect.legendBox")
        .data(legendClass);

    legendRectsEnter = legendRects.enter().append("rect")
        .attr("class", "legendBox")
        .attr("y","0")
        .attr("x", function(d) {return x(d.lowerClassBound);})
        .attr("transform", function(d) { return "translate( 0 ," + svgHeight + ")"})
        .attr("width", function(d) { return (x(d.upperClassBound) - x(d.lowerClassBound)); })
        .attr("height","25")
        .attr("fill",function(d){
            return d.colour;
        });

    let acumLine = d3.line()
        .x((d) => x(d[1]))
        .y((d) => yAccum(d[2]))
        .curve(d3.curveLinear);


    let line = svg.append('path')
        .attr('d', acumLine(kommuneData))
        .attr('class', 'AccumLine');


    // add the x Axis
    svg.append("g")
        .attr("transform", "translate(0," + svgHeight + ")")
        .call(d3.axisBottom(x));

    // add the y Axis

    svg.append("g")
        .attr("transform", "translate("+(svgWidth - (margin.right))+", 0 )")
        .call(d3.axisRight(yHist));

    svg.append("g")
        .attr("transform", "translate("+margin.left+", 0 )")
        .attr("class", "y axis")
        .call(d3.axisLeft(yAccum));

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 10 - margin.left)
        .attr("x",0 - (svgHeight / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(yAccumLable);

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", svgWidth )
        .attr("x",0 - (svgHeight / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(yHistLable);

    svg.append("text")
        .attr("transform",
            "translate(" + (svgWidth/2) + " ," +
            (svgHeight + (margin.bottom -margin.top)) + ")")
        .style("text-anchor", "middle")
        .text(xlable);
    // Caalculate normal distibution curve

    // It is not possible to use the bins array sinch the line graph neads one more coordinat
    var normalData = []; //erase current data
    //populate the data

    bins.forEach(function (e) {
        normalData.push({
            "x": e.x0,
            "y": ((jStat.normal.cdf(e.x1, mean, std) - jStat.normal.cdf(e.x0, mean, std)) * kommuneData.length)
        })
    });
    console.log(bins);
    normalData.push({
        "x": bins[bins.length-1].x1,
        "y":((jStat.normal.cdf( bins[bins.length-1].x1, mean, std) - jStat.normal.cdf( bins[bins.length-1].x0, mean, std)) * kommuneData.length)
    });

    acumLine = d3.line()
        .x((d) => x(d.x))
        .y((d) => yHist(d.y))
        .curve(d3.curveStepAfter);

    line = svg.append('path')
        .attr('d', acumLine(normalData))
        .attr('class', 'NormaLine');


}

function processFilteredData(){

    console.log("Data table :");
    console.log(filteredData );
    const nestData = d3.nest()
        .key(d => d.OMRÅDE)
        .key(d => d.KØN)
        .rollup(function(v) { return d3.sum(v, function(d) { return d.value; }); })
        .entries(filteredData);

    console.log("Nest table :");
    console.log(nestData);


    kommuneData = nestData.map(function(d){
        if(d.values[0].key ==1)
        {return [d.key, d.values[0].value/ d.values[1].value];}
        else
        {return [d.key, d.values[1].value/ d.values[1].value];}
    });

    console.log(kommuneData);

    //Sorter kommunerne efter sex ratio
    kommuneData.sort(function(a, b) {
        return a[1] - b[1];
    });

    //Løb kommuneren i gennem og generer allumulered vørdig.
    muniCount = kommuneData.length;
    var last = 0;

    //Muni array 0 = mini code 1 = sex ration 2 =sccumulated
    for(var i=0; i < kommuneData.length; i++){
        kommuneData[i][2] = last + 1/muniCount;
        last = kommuneData[i][2];
    }
    kommuneData[muniCount- 1][2] = 1.00; //This is nessersary to wvoid accumulated rounding error

    x.domain(d3.extent(kommuneData.map(d => d[1]))).nice();

    //The strange thing with floor and celi is to ensure that the extreme calues always fall inside the ranges
    let format = d3.format(".4f");
    d3.select("#minRow").node().lastChild.innerHTML =  format(Math.floor(d3.min(kommuneData,d => d[1])*1000)/1000);
    d3.select("#maxRow").node().lastChild.innerHTML  = format(Math.ceil(d3.max(kommuneData,d => d[1])*1000)/1000);

    d3.select("#meanRow").node().lastChild.innerHTML  = format(d3.mean(kommuneData,d => d[1]))
    d3.select("#varRow").node().lastChild.innerHTML  = format(d3.variance(kommuneData,d => d[1]))


}
function applyAgeFilter(){
    console.log("select index :");

    console.log( d3.select("#ageFilterType") );
    if (d3.select("#ageFilterType").node().selectedIndex <= 0) {
        filteredData = nonFilteredData.filter(d => (d.ALDER == 'IALT'));
    } else {
        const ageBegin = Number(document.forms["ageFilter"]["ageBegin"].value);
        const ageEnd = Number(document.forms["ageFilter"]["ageEnd"].value);
        filteredData = nonFilteredData.filter(d => (d.ALDER != 'IALT') && (d.ALDER >= ageBegin && d.ALDER < ageEnd));
    }
}

function changeAgeFilter() {
    applyAgeFilter();
    processFilteredData();
    drawSvg();
    return false;
}

//Function that hides,shows the age group filter boxes depending of the choice in the filter dropdown
function showHideAgeFilterOptions(index) {
    const filterOptionsDiv = d3.select("#filterOotions");
    if (index == 0) {
        filterOptionsDiv.node().innerHTML = "";
        filteredData = nonFilteredData.filter(d => (d = 'IALT') );
        processFilteredData();
        drawSvg();
    } else {
        let form = filterOptionsDiv.append("form").attr("name","ageFilter").attr("onSubmit","return changeAgeFilter()");
        form.append("lable").text(displayText.ageFilterForm.begin);
        form.append("input").attr("name","ageBegin").attr("type","number")
            .attr("min","0").attr("max","125").attr("step","1").attr("value","16");
        form.append("lable").text(displayText.ageFilterForm.end);
        form.append("input").attr("name","ageEnd").attr("type","number")
            .attr("min","0").attr("max","125").attr("step","1").attr("value","75");
        form.append("button").attr('type', 'submit').text(displayText.ageFilterFormSubmit)
    }
}

function changeNoOfBinns(bins) {
    drawSvg();
    return false;
}
function changeMapProperties(){

    drawSvg();
    return false;
}

function initialiseDataDisplay () {
    const  dataArea = d3.select("#tabelData");
    dataArea.append('h2').attr("id","chartTitle")
    const DisplayRow = dataArea.append('table').append('tbody').append('tr');
    let svgCell = DisplayRow.append('td').attr("id","svgCell");
    svgCell.append('div').attr("id","graphDiv")
        .append('svg')
        .attr("id", "graphSvg")
        .attr("width", svgWidth + margin.left + margin.right)
        .attr("height", svgHeight + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");
    svgCell.append('div').attr("id","mapDiv")
        .append('svg')
        .attr("id", "mapSvg")
        .attr("width", svgWidth + margin.left + margin.right)
        .attr("height", svgWidth + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    const InfoCell = DisplayRow.append('td')
        .attr("id", "infoText")
        .attr("valign", "top")
    InfoCell.append('div').attr("id","statusInfo");
    InfoCell.append('h3').text(displayText.filterOptionsTitle);
    InfoCell.append('div').attr("id","periodSelectionArea")
    InfoCell.append('div').text(displayText.ageFilterPrompt);


    //Create filter type selecter
   let ageSelect = InfoCell.append('div').attr("id", "ageGruppingSelecter").append('select')
        .attr("id", 'ageFilterType')
        .attr("onchange", "showHideAgeFilterOptions(this.selectedIndex)");
    ageSelect.append('option').text(displayText.ageFilterOptions[0]);
    ageSelect.append('option').text(displayText.ageFilterOptions[1]);
    InfoCell.append('div').attr("id", "filterOotions");
    InfoCell.append('h3').text(displayText.statisticsTitle);
    const statTable = InfoCell.append('table')
        .attr("id", "StatTable")
    let rows = statTable.selectAll('tr').data(displayText.statistics).enter().append('tr').attr("id",d=>d[1]);
    let cells = rows.selectAll('td')
        .data(d => [d[0], "0.000"])
        .enter().append('td')
        .text(d=>d);


    //Insert chat options
    InfoCell.append('h3').text(displayText.chartOptionsTitle);
    let binsForm = InfoCell.append("form").attr("name","numberOfBins").attr("onSubmit","return changeNoOfBinns()");
    binsForm.append("button").attr('type', 'submit').text(displayText.chamgeBins)
    binsForm.append("input").attr("name","bins").attr("type","number")
        .attr("min","0").attr("max","100").attr("step","1").attr("value","15");

    //Insert map options
    InfoCell.append('h3').text(displayText.mapOptionsTitle);
    let mapPropertiesForm = InfoCell.append("form").attr("name","mapProperties").attr("onSubmit","return changeMapProperties()");
      mapPropertiesForm.append("lable").text(displayText.numberOfMapClasses);
    mapPropertiesForm.append("input").attr("name","mapClasses").attr("type","number")
        .attr("min","3").attr("max","11").attr("step","1").attr("value","5");
    mapPropertiesForm.append("br")
    mapPropertiesForm.append("lable").text(displayText.mapClassifierLable);
    let mapClassifierSelect = mapPropertiesForm.append('select')
        .attr("id", 'mapClassifier')
    mapClassifierSelect.append('option').text(displayText.mapClassifierOptions[0]);
    mapClassifierSelect.append('option').text(displayText.mapClassifierOptions[1]);
    mapPropertiesForm.append("br")
    mapPropertiesForm.append("button").attr('type', 'submit').text(displayText.updateMap)
}

function drawMaps(geojson) {
    const mapPath = d3.geoPath().projection(projection);
    const mapSvg = d3.select("#mapSvg")
    mapSvg.selectAll("path")
        .data(geojson.features)
        .enter()
        .append("path")
        .attr("id",(d => "muni_" + d.properties.KOMKODE))
        .attr("munikode",function(d){
            return d.properties.KOMKODE;
        })
        .attr("d", mapPath)
        .attr("fill", "#CCFFB1")
        .attr("stroke", "#222");
}

async function loadMap(){
    try {
        const topoJson = await d3.json("kommunerwgs.topojson");
        const geojson = topojson.feature(topoJson, topoJson.objects.kommunerwgs);
        drawMaps(geojson);

    } catch(e) {
        console.log(e); // 30
    }

}

//Fetch data for the sepecifyed period and apply the all ages filter by default
//finaly the functions calles drawsvg to display the char
async function fetchPeriodData(period){
    d3.select("#statusInfo").text(displayText.fetchingPeriodData + period);
    const periodArray = [period];
    FOLK1Arequest.variables.push({"code": "Tid","values": [period]});
    try {
        const responc = await fetch('https://api.statbank.dk/v1/data', {
            method: "post",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(FOLK1Arequest)
        });

        const dataSet = await responc.json();
        nonFilteredData = JSONstat(dataSet).Dataset(0).toTable({ type : "arrobj", content: "id" } );

        // remove all but the municipalityes
        nonFilteredData = nonFilteredData.filter(d=> (d.OMRÅDE>=100 && d.OMRÅDE !=411));
        // Defalt filter alle ages and only municipalityes
        applyAgeFilter();
        d3.select("#statusInfo").text(displayText.reddyForSelection);
        d3.select("#chartTitle").text(displayText.dispalyAreaTitle + period )
        processFilteredData();
        drawSvg();

    } catch(e) {
        console.log(e); // 30
    }

}

//This dunctions fetches the availabul time periods and adds them to a droopdown select box
async function hentMata() {
    d3.select("#statusInfo").text(displayText.fetchMetaData)
    try {
        const responc = await fetch('https://api.statbank.dk/v1/tableinfo', {
            method: "post",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(FOLK1A_MetaRequest)
        });

        const MetaData = await responc.json();
        let perioder = MetaData.variables.filter(e =>e.id=="Tid")[0].values;
        perioder.sort(function(a, b){return b-a});
        perioder.unshift({id:-1,text:"---"})
        const alder = MetaData.variables.filter(e =>e.id=="ALDER")[0].values;
        const selectorArea = d3.select("#periodSelectionArea");
        selectorArea.append('lable').text( displayText.selectPeriod);
        selectorArea.append("select")
            .attr("id","periodeSelecter")
            .attr("onchange","fetchPeriodData(this.options[this.selectedIndex].value)")
            .selectAll("option")
            .data(perioder)
            .enter().append("option")
            .text((d)=>d.text)
            .attr("value",(d)=>d.id)
    } catch(e) {
        console.log(e);
    }
    d3.select("#statusInfo").text(displayText.reddyForSelection);

}

d3.select("#pageTitle").node().innerHTML=displayText.pageTitle;
d3.select("#intro").node().innerHTML=displayText.pageIntro;
d3.select("#tabelFilter").node().innerHTML=displayText.fetchMetaData;
initialiseDataDisplay();
loadMap()
hentMata();
