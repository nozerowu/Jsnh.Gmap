
//  Write by Wuling
//  最后更新： 2014-07-17

var GmapHelp = function () {
    var InfoArr = [], legend, setInfo, Ploygons = [], colorLg = [];
    var TrHtml = [], Centers = [];
    var Colors = ["#1e530d", "#2f800d", "#73b114", "#b7d31b", "#ffff00", "#ff8800", "#ff0000", "#cc0000"];         //内部颜色数组
    var addr, latitude, longitude, radius, sort, bound, title;
    var inforWindow, closeUrl = "/Images/close.gif";
    var $legend, all = -1;
    var map;
    var dis = [];
    var hasBound = false;
    var infowindows = new google.maps.InfoWindow({
        maxWidth: 260
    });

    //从小到大排序
    function beSort() {
        InfoArr.sort(function (a, b) {
            if (a[sort] > b[sort])
                return 1;
            if (a[sort] < b[sort])
                return -1;
            return -1;
        })
    }


    //添加颜色属性
    function AddColor() {
        var pro = ['安徽', '北京', '福建', '甘肃', '广东', '广西', '贵州', '海南', '河北', '河南', '黑龙', '湖北', '湖南', '吉林', '江苏', '江西', '辽宁', '内蒙', '宁夏', '青海', '山东', '山西', '陕西', '上海', '四川', '天津', '西藏', '新疆', '云南', '浙江', '重庆'];
        var nub = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-"];
        var temp, temp1, slice, c = 0, c1 = 0;
        var len = InfoArr.length;


        //以省份或数字分组
        dis = [];
        colorLg = [];
        temp1 = String(InfoArr[0][sort]).substring(0, 2);
        if ($.inArray(temp1, pro) >= 0) {
            temp = String(temp).substring(0, 2);
            dis.push(temp);
            for (var i = 1; i < len; i++) {
                temp1 = String(InfoArr[i][sort]).substring(0, 2);
                if (temp1 != temp) {
                    temp = temp1;
                    dis.push(temp);
                }
            }
            //等分间隔=不同省份的数量除以颜色数组的大小
            slice = dis.length / Colors.length;
            temp = String(InfoArr[0][sort]).substring(0, 2);
            for (var i = 0; i < len; i++) {
                temp1 = String(InfoArr[i][sort]).substring(0, 2);
                var a = 0;
                var b = 0;
                //如果省份有变化，a作为标记，c1为不同省份排序数，与等分间隔相乘判断是否要换颜色
                if (temp1 != temp) {
                    temp = temp1;
                    c1++;
                    a = 1;
                }
                //c判断是否需要颜色数组位数增加，b作为标记
                while (c1 >= parseInt((c + 1) * slice)) {
                    c++;
                    b = 1;
                }
                //如果c有变化，则需要添加新的颜色图例数组
                if (b)
                    colorLg[c] = [];
                //如果a有变化，则需要在颜色图例数组中添加省份
                if (a)
                    colorLg[c].push(temp1);
                //在初始情况下，看b,和a的值看是否要推入数组或先建立数组后推入数据
                if (i == 0) {
                    if (b)
                        colorLg[c].push(temp1);
                    else {
                        colorLg[c] = [];
                        colorLg[c].push(temp1);
                    }
                }
                //给每个传入是对象添加对应的颜色属性
                InfoArr[i].Color = Colors[Colors.length - c - 1]
            }
        }
        else {
            //中间数排序||差值排序||百分比排序
            //1.目前使用差值排序
            //arrC是颜色数组中已经选定的一部分颜色
            var arrC = [];
            arrC.push(c);
            var first = InfoArr[0][sort];
            slice = (InfoArr[len - 1][sort] - InfoArr[0][sort]) / Colors.length;
            for (var i = 0; i < len; i++) {
                while (InfoArr[i][sort] - InfoArr[0][sort] > parseInt((c + 1) * slice)) {
                    c++;
                }
                if (arrC[arrC.length - 1] != c)
                    arrC.push(c);
                InfoArr[i].Color = Colors[Colors.length - c - 1];
                //生成颜色图例内容数组
                if (i > 1) {
                    if (InfoArr[i].Color != InfoArr[i - 1].Color) {
                        colorLg[arrC[arrC.length - 2]] = [];
                        if (first != InfoArr[i - 1][sort])
                            colorLg[arrC[arrC.length - 2]].push(first + " ~ " + InfoArr[i - 1][sort]);
                        else
                            colorLg[arrC[arrC.length - 2]].push(first);
                        first = InfoArr[i][sort];
                    }
                }
            }
            colorLg[c] = [];
            if (first != InfoArr[len - 1][sort])
                colorLg[c].push(first + " ~ " + InfoArr[len - 1][sort]);
            else
                colorLg[c].push(first);
        }
    }

    //添加图例的html
    function LegendHtml() {
        var ColorsPersent = [];
        var temp = "0.00";
        var len = Colors.length;
        for (var i = 1; i <= len; i++) {
            ColorsPersent.push(temp + "～" + (100 / len * i).toFixed(1));
            temp = (100 / len * i).toFixed(1);
        }

        var tableHtml = "<table border='0' id='colorLegendTable' class='DataTable'> ";
        tableHtml += "<tr style='height:0; line-height:0;'><td style='width: 65%; height:0px;'>&nbsp;</td><td style='width: 35%; height:0px;'>&nbsp;</td></tr>";
        var strLegendTitle
        if (sort == "Loc_Name")
            strLegendTitle = "区域  图例";
        else if (sort == "year")
            strLegendTitle = "年度  图例";
        else
            strLegendTitle = sort + " 图例";

        tableHtml += "<tr><th colspan='2'>" + strLegendTitle + "</th></tr>";

        for (var i = Colors.length - 1; i >= 0; i--) {
            //   tableHtml += "<tr><td style='width:65%' >" + ColorsPersent[i] + "</td>";
            if (colorLg[i]) {
                tableHtml += "<tr><td style='width:65%' >" + colorLg[i].toString() + "</td>";
                tableHtml += "<td style='width: 35%; background-color:" + Colors[Colors.length - 1 - i] + ";'> &nbsp; </td></tr>";
            }
        }
        tableHtml += "</table>";
        legend = tableHtml;
    }

    //画圆数组
    function AddCircles() {
        var len = InfoArr.length;
        for (var i = 0; i < len; i++) {
            if (InfoArr[i][latitude]) {
                var Options = {
                    strokeColor: "#FFF700",
                    strokeOpacity: 0.3,
                    strokeWeight: 1,
                    fillColor: InfoArr[i].Color,
                    fillOpacity: 0.8,
                    map: map,
                    center: new google.maps.LatLng(InfoArr[i][latitude], InfoArr[i][longitude]),
                    radius: parseInt(InfoArr[i][radius])
                };
                var Circle = new google.maps.Circle(Options);
                Ploygons[i] = Circle;
                Centers[i] = new google.maps.LatLng(InfoArr[i][latitude], InfoArr[i][longitude]);
                boungCircle(Circle, i);
            } else {
                LatLngBaidu(i);
            }

        }
        map.setCenter(new google.maps.LatLng(30.61, 114.13));
        map.setZoom(5);
    }

    //通过百度api查询未知区域地址
    function LatLngBaidu(v) {
        var point = new BMap.Point(116.331398, 39.897445);
        var myGeo = new BMap.Geocoder();
        myGeo.getPoint(InfoArr[v][addr], function (point) {
            if (point) {
                var Options = {
                    strokeColor: "#FFFF00",
                    strokeOpacity: 0.3,
                    strokeWeight: 1,
                    fillColor: InfoArr[v].Color,
                    fillOpacity: 0.8,
                    map: map,
                    center: new google.maps.LatLng(point.lat, point.lng),
                    radius: parseInt(InfoArr[v][radius])
                };
                InfoArr[v][latitude] = point.lat;
                InfoArr[v][longitude] = point.lng;
                var Circle = new google.maps.Circle(Options);
                Ploygons[v] = Circle;
                Centers[v] = new google.maps.LatLng(point.lat, point.lng);
                boungCircle(Circle, v);
            }
        }, "北京市");
    }

    function addLatLng() {
        var len = InfoArr.length;
        for (var i = 0; i < len; i++) {
            Centers[i] = new google.maps.LatLng(getLatLngByBaidu(InfoArr[i][addr]));
        }
    }



    function boungCircle(Circle, i) {
        google.maps.event.addListener(Circle, 'click', function () {
            InfoOne(i);
        })
    }

    function AddBoundary() {
        var len = InfoArr.length;
        for (var m = 0; m < len; m++) {
            if (hasBound)
                AddOneBound(m);
            else
                getOneBoundary(m);
        }
    }

    //通过baidu画区域图
    function getOneBoundary(m) {
        var bdary = new BMap.Boundary();
        bdary.get(InfoArr[m][addr], function (rs) {
            points = rs;
            var rslength = rs.boundaries.length;
            var top = 0;
            var bottom = 0;
            var left = 0;
            var right = 0;
            for (i = 0; i < rslength; i++) {
                var triangleCoords = [];
                var temp = rs.boundaries[i];
                var latLngs = temp.split(";");
                for (j = 1; j < latLngs.length - 1; j++) {
                    var postion = latLngs[j].indexOf(",");
                    var lat = parseFloat(latLngs[j].substr(0, postion));
                    var lng = parseFloat(latLngs[j].substr(postion + 1));
                    triangleCoords.push(new google.maps.LatLng(lng, lat));
                    if (j == 1 && top == 0 && bottom == 0 && left == 0 && right == 0) {
                        top = lng;
                        bottom = lng;
                        left = lat;
                        right = lat;
                    }
                    else {
                        if (lng > top) {
                            top = lng;
                        }
                        if (lng < bottom) {
                            bottom = lng;
                        }
                        if (lat > right) {
                            right = lat;
                        }
                        if (lat < left) {
                            left = lat;
                        }
                    }
                }

                var bermudaTriangle = new google.maps.Polygon({
                    paths: triangleCoords,
                    strokeColor: InfoArr[m].Color,
                    strokeOpacity: 0.6,
                    strokeWeight: 0,
                    fillColor: InfoArr[m].Color,
                    fillOpacity: 0.8
                });

                bermudaTriangle.setMap(map);
                //异步状态下推送时间可能不一致，不会按数组正常顺序推送
                //    Centers.push(new google.maps.LatLng(bottom + ((top - bottom) / 2), left + ((right - left) / 2)));
                //    Ploygons.push(bermudaTriangle);
                Centers[m] = new google.maps.LatLng(bottom + ((top - bottom) / 2), left + ((right - left) / 2));
                Ploygons[m] = bermudaTriangle;
                boundPloygon(bermudaTriangle, m);
            }
        });
    }

    function boundPloygon(bermudaTriangle, i) {
        google.maps.event.addListener(bermudaTriangle, "click", function () { InfoOne(i); });
        google.maps.event.addListener(bermudaTriangle, "mousemove", function () { polygonIn(i); });
        google.maps.event.addListener(bermudaTriangle, "mouseout", function () { polygonOut(i); });
    }

    //有边界数组直接画多边形
    function AddOneBound(i) {
        var strIcon, letter,
             polygon, paths = [], latLng = "", list, lat, lng, boundary, showColor,
             myLatlng, marker0, bounds = new google.maps.LatLngBounds();
        //开始画多边行                
        var polygon = new google.maps.Polygon();
        var polyOptions = {
            strokeColor: "#9B868B",
            fillColor: "#FF8C69",
            fillOpacity: 0.8,
            strokeWeight: 1,
            zIndex: 1
        };
        polygon.setOptions(polyOptions);
        boundary = InfoArr[i][bound];
        if (boundary) {
            list = InfoArr[i][bound].split(";");
            for (var j = list.length - 1; j >= 0; j--) {
                latLng = list[j].split(",");
                lat = latLng[1];
                lng = latLng[0];
                if ((isFloatNumber(lat)) && (isFloatNumber(lng))) {
                    myLatlng = new google.maps.LatLng(lat, lng);
                    paths.push(myLatlng);
                    bounds.extend(myLatlng);
                }
            }
            Centers.push(bounds.getCenter());
            polygon.setPaths(paths);

            polygon.setOptions({
                fillColor: InfoArr[i].Color
            });
            polygon.setMap(map);
        }
        Ploygons.push(polygon);
        boundPloygon(polygon, i);
    }

    function isFloatNumber(value) {
        return (!isNaN(value));
    }

    function polygonIn(i) {
        Ploygons[i].setOptions({
            fillOpacity: 0.8,
            fillColor: "Black"
        });
    }

    function polygonOut(i) {
        Ploygons[i].setOptions({
            fillColor: InfoArr[i].Color
        });
    }

    //添加单点小窗
    function InfoOne(i) {
        var cs = pushOneInfo(InfoArr[i]);
        infowindows.setContent(cs);
        infowindows.setPosition(Centers[i]);
        infowindows.open(map);
    }

    //清除google map中已经生成的东东
    function clear() {
        for (var i = 0; i < Ploygons.length; i++) {
            Ploygons[i].setMap(null);
        }
        Ploygons = [];

        Centers = [];

        infowindows.close;
        TrHtml = [];
    }


    //函数功能：生成一个左侧列表数组，本身是一些html代码，后期可动态添加到左侧列表中
    //默认地址为InfoArr[i].addr
    function AllTree() {
        var len = InfoArr.length;
        for (var i = 0; i < len; i++) {
            var textMaxLength = 20;
            var dataHtml = "<tr>";
            dataHtml += "<td style='white-space:nowrap'>";
            dataHtml = dataHtml + "&nbsp;&nbsp;<a class='Tree' style='line-height:20px;' href='' title='" + InfoArr[i][title].toString() + "' onclick='GmapHelp.ShowInfo(" + i + "); return false;'>";
            if (InfoArr[i][title].length > textMaxLength) {
                dataHtml = dataHtml + InfoArr[i][title].substr(0, textMaxLength) + "...";
            }
            else {
                dataHtml = dataHtml + InfoArr[i][title];
            }
            dataHtml = dataHtml + "</a>";
            dataHtml += "</td></tr>";
            TrHtml.push(dataHtml);
        }
    }

    //函数功能：按需返回左边点击列表
    function SetTr(min, length) {
        var Html = "";
        for (var i = 0; i < length; i++) {
            if (min + i < TrHtml.length)
                Html += TrHtml[i + min];
        }
        return Html
    }

    //获取地区对应经纬度
    function getLatLng(city) {
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({
            'address': city
        }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                return results[0].geometry.location;
            } else {
                return "未知";
            }
        });
    }



    //默认给InfoWindow添加的内容，有特殊需求可将函数替换掉。
    function pushOneInfo(i) {
        var cs = "";
        for (var m in i) {
            if (i[m])
                cs += "<span class='spantext'>" + i[m] + "</span></br>";
        }
        return cs;
    }

    //传入数据初始化
    function init(option) {
        map = option.maps;
        InfoArr = option.msg || [];
        longitude = option.longitude || "Loc_Lon";
        latitude = option.latitude || "Loc_Lat";
        addr = option.addr || "Loc_Name";
        radius = option.radius || "radius";
        sort = option.sort || "Loc_Name";
        addr = option.addr || "Loc_Name";
        title = option.title || "Loc_Name";
        bound = option.bound || "boundary";
        all = option.all || -1;
        $legend = option.legend || $("#divColorLegendTable");
        pushOneInfo = option.info || pushoneInfo;
        beSort();
        if (option.bound)
            hasBound = true;
        clear();
    }

    //气象模块中输入年段和日期段查询总的天数 如：2003 2005 03-05  07-21
    //2014-07-17
    function queryDays(yearMin, yearMax, monthMin, monthMax) {
        //算查询的总天数，2月份就当28天好了,4年添加一天
        var monthDay = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        var leapYear = false;
        var selectDays = 0;
        var dayMin = Math.abs(monthMin.substring(6, 2));
        var monthMin = Math.abs(monthMin.substring(0, 2));
        var dayMax = Math.abs(monthMax.substring(6, 2));
        var monthMax = Math.abs(monthMax.substring(0, 2));

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
        return selectDays;
    }

    return {
        Load: function (option) {
            init(option);
            AddColor();
            AllTree();
            return this;
        },
        Legend: function () {
            $legend.html(legend);
            return this;
        },
        QueryDays: function (yearMin, yearMax, monthMin, monthMax) {
            all = queryDays(yearMin, yearMax, monthMin, monthMax);
            return this;
        },
        Ploygon: function () {
            LegendHtml();
            $legend.html(legend);
            AddBoundary();
            return this;
        },
        ShowInfo: function (i) {
            InfoOne(i);
            map.setCenter(Centers[i])
            return this;
        },
        ShowList: function (start, len) {
            $("#DataTable").html(SetTr(start, len));
            return this;
        },
        Clear: function () {
            clear();
            return this;
        },
        Circle: function () {
            AddCircles();
            LegendHtml();
            $legend.html(legend);
            return this;
        }
    }
} ();


//画弧形函数 传入参数：经纬度，半径，开始角度，结束角度
//如：new google.maps.LatLng(32.3333, 117.4666667),30000,120,200
//2014-07-23
function getPath(point, radius, sDegree, eDegree) {
    var paths = [];
    paths.push(point);
    for (var i = sDegree; i < eDegree + 0.001; i++) {
        paths.push(EOffsetBearing(point, radius, i));
    }
    paths.push(point);
    return paths;
}
function EOffsetBearing(point, dist, bearing) {
    var latConv = getDistance(point, new google.maps.LatLng(point.lat() + 0.1, point.lng())) * 10;
    var lngConv = getDistance(point, new google.maps.LatLng(point.lat(), point.lng() + 0.1)) * 10;
    var lat = dist * Math.cos(bearing * Math.PI / 180) / latConv;
    var lng = dist * Math.sin(bearing * Math.PI / 180) / lngConv;
    return new google.maps.LatLng(point.lat() + lat, point.lng() + lng)
}

function rad(x) {
    return x * Math.PI / 180;
};

function getDistance(p1, p2) {
    var R = 6378137; // Earth’s mean radius in meter
    var dLat = rad(p2.lat() - p1.lat());
    var dLong = rad(p2.lng() - p1.lng());
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) *
                Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d; // returns the distance in meter
};