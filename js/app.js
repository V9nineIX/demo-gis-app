
(function () {


    $("#delete_btn").hide();
    $("#form").hide();

    var  api_key = "ArXv-P2uvY-tZkds_dzADolCH_pRUfjsfqw-3zHliI4zFo6oOAWWwa3u8h3UMuBo";


    var local_features = localStorage.getItem("geoJson");
    if (local_features != null) {
        local_features = new ol.format.GeoJSON().readFeatures(local_features)
    } else {
        local_features = [];
    }

    var source = new ol.source.Vector({ features: local_features });
    var vector = new ol.layer.Vector({
        source: source,
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 0, 0, 0.2)'
            }),
            stroke: new ol.style.Stroke({
                color: '#ffcc33',
                width: 2
            })
        })
    });



    var map = new ol.Map({
        layers: [
            new ol.layer.Group({
                'title': 'Base maps',
                layers: [
                    new ol.layer.Tile({
                        title: 'OSM',
                        type: 'base',
                        source: new ol.source.OSM()
                    }),
                    new ol.layer.Tile({
                        source: new ol.source.BingMaps({
                            key:  api_key ,
                            imagerySet: 'Aerial',
                            culture: "th"
                        }),
                        type: 'base',
                        title: 'Aerial',
                        loadTilesWhileInteracting: true,
                        visible: true
                    }),


                    new ol.layer.Tile({
                        source: new ol.source.BingMaps({
                            key: api_key,
                            imagerySet: 'AerialWithLabels',
                            culture: "th"
                        }),
                        type: 'base',
                        title: 'Aerial with labels',
                        loadTilesWhileInteracting: true,
                        visible: true
                    })
                ]
            }),
            vector
        ],


        target: 'map',
        view: new ol.View({
            center: ol.proj.transform([100.514699, 13.751945], 'EPSG:4326', 'EPSG:3857'),  //  bangkok
            zoom: 7
        })
    });

    var layerSwitcher = new ol.control.LayerSwitcher({
        tipLabel: 'Layer' // Optional label for button
    });
    map.addControl(layerSwitcher);



    var draw, snap, feature_area;
    var select_interaction, modify_interaction, selectedFeature;
    draw = new ol.interaction.Draw({
        source: vector.getSource(),
        type: "Polygon",
    });
    var selectStyle = new ol.style.Style({

        fill: new ol.style.Fill({
            color: 'rgba(0, 255, 0, 0.2)'
        }),
        stroke: new ol.style.Stroke({
            color: '#0000ff',
            width: 2
        })
    });


    var select_interaction = new ol.interaction.Select({
        style: [selectStyle],
        layers: [vector]
    });


    var formatArea = function (polygon) {
        var area = ol.Sphere.getArea(polygon);

        var output = {
            m: 0.00,
            m2: 0.00,
            km2: 0.00,
            wa: 0.00,
            rai: 0.00,
        };
        output.m = area;
        if (area > 10000) {
            output.km2 = (Math.round(area / 1000000 * 100) / 100)
        } else {
            output.m2 = (Math.round(area * 100) / 100)
        }


        var rai = (area * 0.000625);
        var rai_decimal = rai - Math.floor(rai);
        var ngan = (rai_decimal * 4)

        var ngan_decimal = ngan - Math.floor(ngan);
        var wa = (ngan_decimal * 100);


        if (rai < 1)
            output.rai = 0 + " ไร่";
        else
            output.rai = numeral(rai).format('0,0') + " ไร่";

        if (ngan < 1) {
            output.ngan = 0 + " งาน"
        } else {
            output.ngan = numeral(ngan).format('0,0') + " งาน";
        }

        output.wa = numeral(wa).format('0,0.00') + " ตร.วา";

        return output;
    };


    draw.on('drawstart', function (evt) {

        sketch = evt.feature;

        sketch.getGeometry().on('change', function (evt) {

            var geom = evt.target;
            var output = formatArea(geom);

            // var line_length = ol.Sphere.getLength(geom);
            // line_length= formatLength(new ol.geom.LineString(geom.getLinearRing(0).getCoordinates()));
            //  tooltipCoord = geom.getInteriorPoint().getCoordinates();

            feature_area = "ขนาดพื้นที่ " + output.rai + " " + output.ngan + " " + output.wa;
            $("#area").html(feature_area);




        });



    });


    draw.on('drawend',
        function (evt) {

            setTimeout(function () {
                var features = source.getFeatures();
                var feature_length = features.length;
                var idx = feature_length - 1;
                features[idx].setId(feature_length);
                features[idx].set("area" , feature_area);
            }, 100);


            map.removeInteraction(draw);
            map.addInteraction(select_interaction);

        }); // end draw end




    function addInteractions() {
        map.addInteraction(draw);
        map.removeInteraction(select_interaction);
        // snap = new ol.interaction.Snap({ source: source });
        // map.addInteraction(snap);
        try {
            map.removeInteraction(modify_interaction);
        } catch (ex) {

        }
    }

    function deleteSelectFeature(){
        var selected_features = select_interaction.getFeatures();
        
                selected_features.forEach(function (selected_feature) {
                    var selected_feature_id = selected_feature.getId();
                    // remove from select_interaction
                    selected_features.remove(selected_feature);
         
                    var vectorlayer_features = vector.getSource().getFeatures();
                    vectorlayer_features.forEach(function (source_feature) {
                        var source_feature_id = source_feature.getId();
                        if (source_feature_id === selected_feature_id) {
              
                            vector.getSource().removeFeature(source_feature);
                        }
                    });
                });
        
        
                $("#delete_btn").hide();
                $("#form").hide();
                $("#map_name").val("");
                $("#map_desc").val("");
                $("#area").html("");
        
    }


    function clearMap() {
        
                vector.getSource().clear();
                try {
                    if (select_interaction) {
                        select_interaction.getFeatures().clear();
                    }
                } catch (ex) {
        
                }
                map.removeInteraction(select_interaction);
                map.removeInteraction(draw);
    
                $("#area").html("");
                $("#form").hide();
                $("#delete_btn").hide()
        
            }




    // button event


    select_interaction.on("select", function (e) {

        $(document).off('keyup');
    
        //var selectedFeature = e.selected[0];
        var selectedFeature =e.target.getFeatures().getArray()[0]
 
            var props = e.target.getFeatures().getArray()[0].getProperties();


            $("#delete_btn").show();
            $("#form").show();

            $("#map_name").val(props.name || "");
            $("#map_desc").val(props.desc || "");

            $("#area").html(props.area || "");
            $("#area").show();

            modify_interaction = new ol.interaction.Modify({
                features: e.target.getFeatures()
            });
            // add it to the map
            map.addInteraction(modify_interaction);

            $(document).on("keyup", "#map_name", function () {
                selectedFeature.set("name", $("#map_name").val());
            });


            $(document).on("keyup", "#map_desc", function () {
                selectedFeature.set("desc", $("#map_desc").val());
            });

            $(document).on('keyup', function(evt) {  // event for key delete
                if (evt.keyCode == 46) {
                    deleteSelectFeature();
                }
            });

            selectedFeature.on('change', function (evt) {

                var target_feature = evt.target;
                var output = formatArea(target_feature.getGeometry());
                feature_area = "ขนาดพื้นที่ " + output.rai + " " + output.ngan + " " + output.wa;
                $("#area").html(feature_area);
            });


    });


    map.addInteraction(select_interaction);


    $("#draw_btn").on("click", function () {
        addInteractions();
        $("#form").hide();
        $("#area").html("");
        $("#area").show();
    });


    $("#clear_btn").on("click", function () {
        clearMap();
    })


    $("#save_btn").on("click", function () {

        var vectorlayer_features = vector.getSource().getFeatures();
        var feature = []
        var parser = new ol.format.GeoJSON();

        var geoJson = parser.writeFeatures(vectorlayer_features);

        localStorage.setItem("geoJson", geoJson);

        $.notify("บันทึกข้อมูลเรียบร้อย", "success");

    })




    // delete selected
    $("#delete_btn").on("click", function () {
        deleteSelectFeature();
    });


    map.on("click" ,function(evt){
         var feature = map.forEachFeatureAtPixel(evt.pixel,
            function(feature, layer) {
                return [feature, layer]; 
          });  //  end map               
          
        if(feature == undefined){
          $("#delete_btn").hide();
          $("#area").hide();
          $("#form").hide();
          $(document).off('keyup');
          select_interaction.getFeatures().clear();
        }
    });



    // var wgs84Sphere = new ol.Sphere(6378137);
    // var formatLength = function(line) {
    //     var length;
    //     // if (geodesicCheckbox.checked) {
    //       var coordinates = line.getCoordinates();
    //       length = 0;
    //       var sourceProj = map.getView().getProjection();
    //       for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
    //         var c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:4326');
    //         var c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
    //         length += wgs84Sphere.haversineDistance(c1, c2);
    //       }
    //     // } else {
    //      // length = Math.round(line.getLength() * 100) / 100;
    //   //  }
    //     var output;
    //     if (length > 100) {
    //       output = (Math.round(length / 1000 * 100) / 100) +
    //           ' ' + 'km';
    //     } else {
    //       output = (Math.round(length * 100) / 100) +
    //           ' ' + 'm';
    //     }
    //     return output ;
    //   };





})();