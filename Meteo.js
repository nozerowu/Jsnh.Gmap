
//  Write by Wuling
//  最后更新： 2014-05-22

//  所有与气象相关的数据都将在MeteoInfo中获取
//  需要在外部定义map    google.maps
//  注意js文件的引用顺序，先是google key,然后是infobox.js,之后才是meteo.js，顺序不对会有问题
//  默认有一个颜色数组   Colors

//  目前功能： 01. 获取站点信息 MeteoInfo.load(查询参数)            此处返回站点列表数组
//  目前功能： 02. 设置颜色数组 MeteoInfo.loadColors(colors)        传入一个颜色数组
//  目前功能： 03. 设置左侧列表 MeteoInfo.leftList(min,length)      此处传回的是一段html代码，可使用 $("#DataTable").html(MeteoInfo.leftList(23,18))载入到页面中
//  目前功能： 04. 添加圈圈展示 MeteoInfo.Circle()             
//  目前功能： 05. 外部调用小窗 MeteoInfo.InforWindow(i)
//  目前功能： 06. 删除圈圈展示 MeteoInfo.delCircle()
//  目前功能： 07. 设置图例     MeteoInfo.ColorEx()                 此处传回的是一段html代码，可使用 $("#DataTable").html()载入到页面中
//  可使用链式引用


var MeteoInfo = function () {
    var Stations = [], TrHtml = [], Ploygons = [];                                                                   //分别为站点信息数组，左侧列表数组，图形数组                                 
    var Colors = ["#1e530d", "#2f800d", "#73b114", "#b7d31b", "#ffff00", "#ff8800", "#ff0000", "#cc0000", ];         //内部的一个颜色数组
    var TrStart = 0, TrLength = 25, timeCount = 0, selectDays = 0, colorEx, selectYear = 0;                          //左侧表开始，左侧表默认长度，站点默认分组长度，查询总天数
    var day0 = 0;
    var inforWindow= new google.maps.InfoWindow({
        maxWidth: 300
    });



    //添加颜色属性
    function AddColor() {
        //此处是按照对比数量来生成对应颜色的代码段，默认使用stations的days属性
        //传入的数组需要从小到大排序
        //2014-04-25  依据需求修改为按照默认概率八等分
        var minCount, maxCount, c = 0;
        var len = Stations.length;
        if (Stations.length > 0) {
            if (selectDays > 0) {
                for (var i = 0; i < len; i++) {
                    while (Stations[i].days / selectDays * 8 > c) {
                        c++;
                    }
                    Stations[i].Color = Colors[Colors.length - c];
                    Stations[i].Probability = Math.ceil(Stations[i].days / selectDays * 100) + "%";
                }
            }
        }
    }

    //添加图例的html
    function ColorHtml() {
        var ColorsPersent = ['0.00～12.5%', '12.5～25.0%', '25.0～37.5%', '37.5～50.0%', '50.0～62.5%', '62.5～75.0%', '75.0～87.5%', '87.5～100%'];

        var tableHtml = "<table border='0' id='colorLegendTable' class='DataTable'> ";
        tableHtml += "<tr style='height:0; line-height:0;'><td style='width: 65%; height:0px;'>&nbsp;</td><td style='width: 35%; height:0px;'>&nbsp;</td></tr>";
        var strLegendTitle = "频率图例（" + selectYear + "年   " + selectDays + "天）";
        tableHtml += "<tr><th colspan='2'>" + strLegendTitle + "</th></tr>";

        for (var i = Colors.length - 1; i >= 0; i--) {
            tableHtml += "<tr><td style='width:65%' >" + ColorsPersent[i] + "</td>";
            tableHtml += "<td style='width: 35%; background-color:" + Colors[Colors.length - 1 - i] + ";'> &nbsp; </td></tr>";
        }
        tableHtml += "</table>";
        colorEx = tableHtml;
    }

    function queryDays(yearMin, yearMax, monthMin, monthMax) {
        //算查询的总天数，2月份就当28天好了,4年添加一天
        var monthDay = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        var leapYear = false;
        selectDays = 0;
        dayMin = Math.abs(monthMin.substring(6, 2));
        monthMin = Math.abs(monthMin.substring(0, 2));
        dayMax = Math.abs(monthMax.substring(6, 2));
        monthMax = Math.abs(monthMax.substring(0, 2));

        while (monthMin + 1 < monthMax) {
            selectDays += monthDay[monthMin - 1];
            monthMin++;
            if (monthMin == 2)
                leapYear = true;
        }

        if (monthMin == 2 || monthMax == 2)
            leapYear = true;
        selectDays = selectDays + monthDay[monthMin - 1] - dayMin + dayMax + 1;

        if (monthMax == monthMin)
            selectDays -= monthDay[monthMin - 1];

        selectYear = yearMax - yearMin + 1;
        selectDays *= selectYear;
        if (leapYear)
            selectDays += parseInt(((yearMax - yearMin + 1) / 4));
        ColorHtml();
    }

    //添加google圆形数组
    function AddCircles() {
        DelCricle();
        AddColor();
        inforWindow.close();
        var len = Stations.length;

        for (var i = 0; i < len; i++) {
            var StationOptions = {
                strokeColor: "#FF0000",
                strokeOpacity: 0.3,
                strokeWeight: 1,
                fillColor: Stations[i].Color,
                fillOpacity: 0.8,
                map: map,
                center: new google.maps.LatLng(Stations[i].latitude, Stations[i].longitude),
                radius: parseInt(Stations[i].radius)
            };
            var stationCircle = new google.maps.Circle(StationOptions);
            Ploygons.push(stationCircle);
            MeteoShowInfo(stationCircle, i);
        }
        map.setCenter(new google.maps.LatLng(30.61, 114.13));
        map.setZoom(5);
    }


    //画行政区域图
    //待完成   2014-04-19
    function getBoundary() {

    }

    //生产一个inforwindow小窗口
    function MeteoShowInfo(stationCircle, i) {
        google.maps.event.addListener(stationCircle, 'click', function () {
            MeteoInfoOne(i);
        });
    }


    //生成一个google.map.inforWindow小窗口
    //为了直接调用，所以只传入一个i参数
    function MeteoInfoOne(i) {
        var name = Stations[i].station;
        var len = 2;
        var cs = "<b>" + Stations[i].station + "</b></br></br>";
        cs += "站点编号:<span class='spantext'>" + Stations[i].stationid + "</span></br>";
        cs += "经度:<span class='spantext'>" + Stations[i].latitude + "</span></br>";
        cs += "纬度:<span class='spantext'>" + Stations[i].longitude + "</span></br>";
        cs += "海拔：<span class='spantext'>" + Stations[i].elevation + "米</span></br>";
        cs += "资料始于：<span class='spantext'>" + Stations[i].startyear + "年</span></br>";
        cs += "已有气象资料：<span class='spantext'>" + Stations[i].datayears + "年</span></br>";
        cs += "气象半径：<span class='spantext'>" + Stations[i].radius + "米</span></br>";
        cs += "符合天数：<span class='spantext'>" + Stations[i].days + "天</span></br>";
        cs += "符合频率：<span class='spantext'>" + Stations[i].Probability + "</span></br>";
        cs += "</br>";
        cs += "<img style='cursor:pointer;' src='/Images/zonghe.gif' title='气象趋势' alt='气象趋势'  onclick='LoadMeteoChart(&quot;" + Stations[i].station + "&quot;," + Stations[i].stationid + ");return false;'   />&nbsp;&nbsp;&nbsp;";
        if (name.substring(0, 1) == "黑" || name.substring(0, 1) == "内")
            len += 1;
        cs += "<img style='cursor:pointer;' src='/Images/downMap.gif' title='气象下载' alt='气象下载'  onclick='ShowMeteo(&quot;" + name.substring(len) + "&quot;,1);return false;'   />&nbsp;&nbsp;&nbsp;";
        cs += "<img style='cursor:pointer;' src='/Images/jt.png' title='实时天气' alt='实时天气'   onclick='ShowMeteo(&quot;" + name.substring(len) + "&quot;,2);return false;'    />&nbsp;&nbsp;&nbsp;";
        inforWindow.setContent(cs);
        inforWindow.setPosition(new google.maps.LatLng(Stations[i].latitude, Stations[i].longitude));
        inforWindow.open(map);
    }


    //函数功能：生成一个左侧列表数组，本身是一些html代码，后期可动态添加到左侧列表中
    function MeteoAllTree() {
        var len = Stations.length;
        if (MeteoAllTree.length == 0) {
            for (var i = 0; i < len; i++) {
                var textMaxLength = 20;
                var dataHtml = "<tr>";
                dataHtml += "<td style='white-space:nowrap'>";
                dataHtml = dataHtml + "&nbsp;&nbsp;<a style='line-height:20px;' href='' title='" + Stations[i].station + "' onclick='MeteoInfo.InforWindow(" + i + "); return false;'>";
                if (Stations[i].station.length > textMaxLength) {
                    dataHtml = dataHtml + Stations[i].station.substr(0, textMaxLength) + "...";
                }
                else {
                    dataHtml = dataHtml + Stations[i].station;
                }
                dataHtml = dataHtml + "</a>";
                dataHtml += "</td></tr>";
                TrHtml.push(dataHtml);
            }
        }
    }


    //函数功能：按需返回左边点击列表
    function AddTr(min, length) {
        var Html = "";
        for (var i = 0; i < length; i++) {
            Html += TrHtml[i + min];
        }
        return Html
    }

    //删除ploygons数组，注意信息小窗口仍然可用哦
    function DelCricle() {
        inforWindow.close();
        var len = Ploygons.length;
        for (var i = 0; i < len; i++) {
            Ploygons[i].setMap(null);
        }
        return this;
    }

    function DelInfo() {
        inforWindow.close();
        return this;
    }



    return {
        Load: function (msg, yearMin, yearMax, monthMin, monthMax) {
            Stations = msg;
            queryDays(yearMin, yearMax, monthMin, monthMax);
            return this;
        },
        LoadColors: function (color) {
            Colors = color.slice(0);
            return this
        },
        LeftList: function (min, length) {
            return AddTr(min, length);
        },
        InforWindow: function (i) {
            return MeteoInfoOne(i);
        },
        DelCircle: function () {
            DelCricle();
            return this
        },
        ColorEx: function (s) {
            s.html(colorEx);
            return this;
        },
        DelInfo: function () {
            return DelInfo();
        },
        Circle: function () {
            AddCircles();
            return this;
        }
    }
} ();    
 

     //2014-04-29
    //创建图表代码
        function LoadMeteoChart(stationName,id){
        MeteoInfo.DelInfo();
        Meteo.stationName=stationName.toString();

        if ($("#ty_msg_hd_close").attr("title").toString() == "隐藏")
            DoMoveLegend();

        $("#MeteoChartTabs").tabs({ active: 0 });
        $("#MeteoChart").dialog({
            autoOpen: false,
            modal: true,
            minWidth: 1140
        });
        $("#MeteoChart").dialog("open");
        $("#MeteoChartTabs>ul").css("background-color", "white");
                
        var start=Meteo.yearMin+"-"+Meteo.monthMin;
        var end=Meteo.yearMax+"-"+Meteo.monthMax;

        MeteoChart(id,start,end);
        AatChart(id);
        loadRainChart(id);
        loadOneChart(id,Meteo.meteoSelect,start,end);

        require(
        [
            'echarts',
            'echarts/chart/bar',
            'echarts/chart/line'
        ],
        DrawMECharts
        );

        }


        function DrawMECharts(ec)
        {
            DrawEChart(ec);
            DrawAacECharts(ec);
            DrawRainEChart(ec);
            DrawOneChartEchart(ec);
        }
        

        function DrawAacECharts(ec){
          var s=Meteo.stationName+"年度积温";
          myAacChart = ec.init(document.getElementById('MeteoChartTabs-4'));
          AacOption = {
                          color:[
                    "#32cd32","#ffa500","#7b68ee","#cd5c5c","#da70d6"
                ],
             title: {text:s,x:70},
             tooltip: {trigger: 'axis'},
             legend: {data: ['有效积温(>12°C)','有效积温(>10°C)','负积温(<0°C)'],selected: { '负积温(<0°C)': false}},
             toolbox: {show: true,feature: { mark: { show: true }, dataView: { show: true, readOnly: false }, magicType: { show: true, type: ['line', 'bar'] }, restore: { show: true }, saveAsImage: { show: true } }},
             calculable: true,
             xAxis: [{type: 'category', data: Meteo.Aac.years } ],
             yAxis: [{ type: 'value',  name: '有效积温',  axisLabel: { formatter: '{value} ' }, scale: true, splitLine: { show: false }  } ],
             series: [
                 {
                    name:'有效积温(>12°C)',
                    type:'bar',
                    data:Meteo.Aac.big
                 },
                 {
                    name:'有效积温(>10°C)',
                    type:'bar',
                    data:Meteo.Aac.mid
                 },
                 {
                    name:'负积温(<0°C)',
                    type:'bar',
                    data:Meteo.Aac.sml
                 }
                ]
            };
            myAacChart.setOption(AacOption,false);
        }

        //创建ECharts图表
        function DrawEChart(ec) {    
          myChart = ec.init(document.getElementById('MeteoChartTabs-2'));
          var s=Meteo.stationName+"天气状况"
          option = {
                          color:[
                    "#32cd32","#ffa500","#7b68ee","#cd5c5c","#da70d6"
                ],
                title: {
                    text:s,
                    x:70,        
                },
                tooltip: {
                    trigger: 'axis'
                },

                toolbox: {
                    show: true,
                    feature: {
                        mark: { show: true },
                        dataView: { show: true, readOnly: false },
                        magicType: { show: true, type: ['line', 'bar'] },
                        restore: { show: true },
                        saveAsImage: { show: true }
                    }
                },
                calculable: true,
                legend: {
                    data: ['最高温度', '平均温度', '最低温度', '降水量'],
                    selected: { '最高温度': false, '最低温度': false }
                },
                dataZoom : {
                    show : true,
                    realtime : true,
                    height: 20,
                    backgroundColor: 'rgba(221,160,221,0.5)',
                    dataBackgroundColor: 'rgba(138,43,226,0.5)',
                    fillerColor: 'rgba(38,143,26,0.6)',
                    handleColor: 'rgba(128,43,16,0.8)',
                    start : (function(){
                        if(Meteo.Chart.dates.length<32)
                        return 0;
                        else
                        return 100-3000/Meteo.Chart.dates.length;
                    })(),
                    end : 100,
                },
                xAxis: [
        {
            type: 'category',
            data: Meteo.Chart.dates
        }
    ],
                yAxis: [
        {
            type: 'value',
            name: '降雨量',
            axisLabel: {
                formatter: '{value} ml'
            },
            splitArea: { show: true }
        },
        {
            type: 'value',
            name: '温度',
            axisLabel: {
                formatter: '{value} °C'
            },
            scale: true,
            splitLine: { show: false }
        }
    ],
                series: [

        {
            name: '最高温度',
            type: 'line',
            yAxisIndex: 1,
            data: Meteo.Chart.highc
        },
        {
            name: '最低温度',
            type: 'line',
            yAxisIndex: 1,
            data: Meteo.Chart.lowerc
        },
        {
            name: '降水量',
            type: 'bar',
            data: Meteo.Chart.rain
        },
        {
            name: '平均温度',
            type: 'line',
            yAxisIndex: 1,
            data: Meteo.Chart.averc
        }
         ]
            };
            myChart.setOption(option,false);
        }

        function DrawRainEChart(ec) {    
          RainEChart = ec.init(document.getElementById('MeteoChartTabs-3'));
         var s=Meteo.stationName+"年度降雨"
          RainOption = {
                color:[
                    "#32cd32","#ffa500","#7b68ee","#cd5c5c","#da70d6"
                ],
                title: {
                    text:s,
                    x:70,        
                },
                tooltip: {
                    trigger: 'axis'
                },

                toolbox: {
                    show: true,
                    feature: {
                        mark: { show: true },
                        dataView: { show: true, readOnly: false },
                        magicType: { show: true, type: ['line', 'bar'] },
                        restore: { show: true },
                        saveAsImage: { show: true }
                    }
                },
                calculable: true,
                legend: {
                    data: ['2008', '2009', '2010', '2011','2012'],
                   selected: { '2008': false, '2009': false }
                },
                xAxis: [
        {
            type: 'category',
            data: Meteo.Rain.months
        }
    ],
                yAxis: [
        {
            type: 'value',
            name: '降雨量',
            axisLabel: {
                formatter: '{value} ml'
            },

        }

    ],
                series: [

        {
            name: '2008',
            type: 'bar',
            data: Meteo.Rain.a
        },
        {
            name: '2009',
            type: 'bar',
            data: Meteo.Rain.b
        },
        {
            name: '2010',
            type: 'bar',
            data: Meteo.Rain.c
        },
        {
            name: '2011',
            type: 'bar',
            data: Meteo.Rain.d
        } ,
        {
            name: '2012',
            type: 'bar',
            data: Meteo.Rain.e
        }
         ]
            };
            RainEChart.setOption(RainOption,false);
        }


      function DrawOneChartEchart(ec) {    
         OneChartEChart = ec.init(document.getElementById('MeteoChartTabs-1'));
         var s=Meteo.stationName+Meteo.type.text+"年度对比";
         var m=Meteo.type.called.toString();
         if(Meteo.One!="noData")
         {
         Meteo.Ones=[];
         for(var n in Meteo.One)
         {
            if (n!="dates")
            Meteo.Ones.push(n);
         }
         var lens=Meteo.Ones.length;
          OneOption = {
                color:[
                    "#32cd32","#ffa500","#7b68ee","#cd5c5c","#da70d6" ,"#87cefa","#6495ed","#ba55d3","#40e0d0","#1e90ff"
                ],
                title: {
                    text:s,
                    x:70,        
                },
                tooltip: {
                    trigger: 'axis'
                },
                toolbox: {
                    show: true,
                    feature: {
                        mark: { show: true },
                        dataView: { show: true, readOnly: false },
                        magicType: { show: true, type: ['line', 'bar'] },
                        restore: { show: true },
                        saveAsImage: { show: true }
                    }
                },
                calculable: true,
                legend: {
                      data:[]
                },
                                dataZoom : {
                    show : true,
                    realtime : true,
                    height: 20,
                    backgroundColor: 'rgba(221,160,221,0.5)',
                    dataBackgroundColor: 'rgba(138,43,226,0.5)',
                    fillerColor: 'rgba(38,143,26,0.6)',
                    handleColor: 'rgba(128,43,16,0.8)',
                    start : (function(){
                        if(Meteo.One.dates.length<32)
                        return 0;
                        else
                        return 100-3000/Meteo.One.dates.length;
                    })(),
                    end : 100,
                },
                xAxis: [
        {
            type: 'category',
            data: Meteo.One.dates
        }
    ],
                yAxis: [
        {
            type: 'value',
            name: m,
            axisLabel: {
                formatter: '{value} '+Meteo.type.type
            },
        }

    ],
      series: [
        ]

            };

            for(var i=0;i<Meteo.Ones.length;i++)
            {
                OneOption.legend.data.push(Meteo.Ones[i]);
                OneOption.series.push({
                    name: Meteo.Ones[i],                          
                    type: Meteo.type.sel,                          
                    data: Meteo.One[Meteo.Ones[i]]
                });
            }

            OneChartEChart.setOption(OneOption,false);
            }
            else
            {
                $("#MeteoChartTabs-1").html("<h5>没有查询到数据</h5>"); 
            }
        }

        function MeteoChart(id,start,end) {
            $.ajax({
                type: "POST",
                async: false,
                url: "/Meteo/ToChartNew",
                data: "{ \"id\":\"" + id + "\",\"start\": \"" + start +  "\",\"end\": \"" + end + "\" }",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (msg) {
                    Meteo.Chart=msg;

                },
                error: function (xhr, msg) { Meteo.Chart=[];$("#MeteoChartTabs-2").html("<h5>没有查询到数据</h5>"); }
            });
        }

       function AatChart(id) {
            $.ajax({
                type: "POST",
                async: false,
                url: "/Meteo/AacChart",
                data: "{ \"id\":\"" + id +  "\" }",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (msg) {
                    Meteo.Aac=msg;
                },
                error: function (xhr, msg) { Meteo.Aac=[];$("#MeteoChartTabs-4").html("<h5>没有查询到数据</h5>"); }
            });
        }

        function loadRainChart(id) {
            $.ajax({
                type: "POST",
                async: false,
                url: "/Meteo/RainChart",
                data: "{ \"id\":\"" + id +  "\" }",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (msg) {
                    Meteo.Rain=msg;                   
                },
                error: function (xhr, msg) { Meteo.Rain=[];$("#MeteoChartTabs-3").html("<h5>没有查询到数据</h5>"); }
            });
        }

        function loadOneChart(id,meteo,start,end) {
            $.ajax({
                type: "POST",
                async: false,
                url: "/Meteo/ToOneChart",
                data: "{ \"id\":\"" + id + "\",\"meteo\": \"" + meteo +  "\",\"start\": \"" + start +  "\",\"end\": \"" + end + "\" }",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (msg) {
                    Meteo.One=msg;                   
                },
                error: function (xhr, msg) { Meteo.One="noData";$("#MeteoChartTabs-1").html("<h5>没有查询到数据</h5>"); }
            });
        }

        function DownOneMeteo(){
           var station=$("#cityWeatherText").val();
           $.ajax({
               type: "POST",
               async: false,
               url: "/Meteo/DownOneStationMeteo",
               data: "{ \"station\":\"" + station + "\" }",
               contentType: "application/json; charset=utf-8",
               dataType: "json",
               success: function (msg) {
                   s = msg;
                   if(s.load=="noData")
                   {
                        $("#wz").html("很遗憾,没查到!");
                        $("#tem").html("县市错误或暂无此区域气象");
                   }
                   else
                   {
                        $("#wz").html(s.weatherinfo.weather);
                        $("#tem").html(s.weatherinfo.temp2+"~"+s.weatherinfo.temp1);
                   }
               },
               error: function (xhr, msg) { alert("数据读取失败!"); }
           });

        }

     function MeteoLoad(Meteo) {
        var yearMin = Meteo.yearMin.toString();
        var yearMax = Meteo.yearMax.toString();
        var monthMin = Meteo.monthMin.toString();
        var monthMax = Meteo.monthMax.toString();
        var selectMin = Meteo.selectMin.toString();
        var selectMax = Meteo.selectMax.toString();
        var meteoSelect = Meteo.meteoSelect.toString();
        $.ajax({
            type: "POST",
            url: "/Meteo/GetStation",
            data: "{ \"yearMin\":\"" + yearMin + "\",\"yearMax\": \"" + yearMax + "\",\"monthMin\": \"" + monthMin + "\",\"monthMax\": \"" + monthMax + "\",\"selectMin\": \"" + selectMin + "\",\"selectMax\": \"" + selectMax + "\",\"meteo\": \"" + meteoSelect + "\" }",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (msg) {
                  MeteoInfo.Load(msg,yearMin,yearMax,monthMin,monthMax).Circle().ColorEx($("#divColorLegendTable")); 
//                init(msg);
//                var option = { maps: map, info: PMeteoInfo, sort: "station", title: "station",longitude: "longitude",latitude: "latitude", msg: msg };
//                GmapHelp.Load(option).QueryDays(yearMin,yearMax,monthMin,monthMax).Circle().ShowList(0, PageSize);     
            },
            error: function (xhr, msg) { alert(msg); return Stations; }
        });
    }









 
