//Stewart Fitzpatrick, B5732227

var controller;

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    console.log("Running cordova-" + cordova.platformId + "@" + cordova.version);
    // Create the SaleOrder object for use by the HTML view
    controller = new SaleOrder();
}
    

function SaleOrder() {
    console.log("Creating controller/model");
	
	var BASE_GET_URL = "http://137.108.92.9/openstack/api";
	
    var BASE_URL = BASE_GET_URL;
	counter = -1;
	numberGen = 110;
	var subTotal = 0;
	var VAT = 0;
	var total = 0;
	var shoppingList = Array();
	shoppingRows = 0;
	
    markers = []
	
	var mapInterval;
	var marker;
	var bubble;
	var destination;
	var icon = new H.map.DomIcon("<div>&#x1F3C3;</div>");
	
	function updateMap() {
        function onSuccess(position) {
            console.log("Obtained position", position);
            var point = {
                lng: position.coords.longitude,
                lat: position.coords.latitude,
            };

            if (marker) {
                // Remove marker if it already exists
                map.removeObject(marker);
            }

            if (bubble) {
                // Remove bubble if it already exists
                ui.removeBubble(bubble);
            }

            map.setCenter(point);
            marker = new H.map.DomMarker(point, { icon: icon });
            map.addObject(marker);

            // Set destination to position of first marker
            if (destination) {
                bubble = new H.ui.InfoBubble(destination, {
                    content: "<b>You want to get there!</b>",
                });
                ui.addBubble(bubble);
            }
        }
		function onError(error) {
            console.error("Error calling getCurrentPosition", error);
        }

        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
            enableHighAccuracy: true,
        });
    }
	updateMap();
	
	var platform = new H.service.Platform({
        apikey: "Bhtmt84j067SHsl_OIjugjO0XPIZdnNtBB5EjAqhalA",
    });
    // Obtain the default map types from the platform object:
    var defaultLayers = platform.createDefaultLayers();
    // Instantiate (and display) a map object:
    var map = new H.Map(
        document.getElementById("mapContainer"),
        defaultLayers.vector.normal.map,
        {
            zoom: 15,
            center: { lat: 52.5, lng: 13.4 },
        }
    );

    // Create the default UI:
    var ui = H.ui.UI.createDefault(map, defaultLayers);
    var mapSettings = ui.getControl("mapsettings");
    var zoom = ui.getControl("zoom");
    var scalebar = ui.getControl("scalebar");
    mapSettings.setAlignment("top-left");
    zoom.setAlignment("top-left");
    scalebar.setAlignment("top-left");
    // Enable the event system on the map instance:
    var mapEvents = new H.mapevents.MapEvents(map);
    // Instantiate the default behavior, providing the mapEvents object:
    new H.mapevents.Behavior(mapEvents);

    var markers = []; // array of markers that have been added to the map
	
	
	//FR2.1 Displaying a Map for the area around the current location of the salesperson when placing or viewing an order.
	this.start = function() {
    var oucu = getInputValue("oucu", "sf9585");
    var pass = getInputValue("pass", "FXlLXmO1");


    clientNo = getInputValue("client");
    console.log("this is the client number: " + clientNo);

	
    function addMarkerToMap(obj1) {
		
        console.log("Address Data contains: ", obj1.data[0].address);
        var marker;
        var icon = new H.map.DomIcon("<div>&#x1F3C3;</div>");
        var onSuccess = function (obj2) {
			console.log("Obj2 contains :", obj2);
            var point = {
                lat: obj2[0].lat,
                lng: obj2[0].lon
            };
			//FR2.2 When clicking on Begin Order to start an empty order, displaying the orders along the day’s journey with markers, where the location of clients’ addresses are used to place the markers.
            map.setCenter(point);
            marker = new H.map.DomMarker(point, { icon: icon });
            markers.push(marker);
            map.addObject(marker);
        }

        nominatim.get(obj1.data[0].address, onSuccess);
    }

    var address = BASE_GET_URL + "/clients/" + clientNo + "?OUCU=" + oucu + "&password=" + pass;
    console.log("Sending GET to " + address);
    $.ajax(address, { type: "GET", data: {}, success: addMarkerToMap });
}

	
	//FR1.2 Navigating the widgets catalogue (with Previous and Next buttons) and display of widget images, in addition to the description and asking price.		
	this.next = function() {
	
	var oucu = getInputValue("oucu", "sf9585");
	var pass = getInputValue("pass", "FXlLXmO1");
	counter = counter + 1;
	
        function onSuccess(obj) {			
			console.log("widgetImage is " + counter);
            
			
			if (counter == 10){
				alert("That is the last widget in the inventory, returning back to item 1.");
				counter = 0;
			}
			
			document.getElementById("widgetImg").src = obj.data[counter].url
			document.getElementById("widgetCaption").innerHTML = obj.data[counter].description;
			document.getElementById("base_price").innerHTML = ("Base price is: " + obj.data[counter].pence_price) + "p";
			
			console.log(counter);
		}
		
		var widgetImage = BASE_GET_URL + "/widgets/?OUCU=" + oucu + "&password=" + pass;
			console.log("Sending GET to " + widgetImage);
			$.ajax(widgetImage, { type: "GET", data: {id: counter.value}, success: onSuccess });
	
	}
	
	this.prev = function() {
	
	var oucu = getInputValue("oucu", "sf9585");
	var pass = getInputValue("pass", "FXlLXmO1");
	
	
        function onSuccess(obj) {
			console.log("widgetImage is " + counter);
            counter = counter - 1;
			console.log(counter);
			if (counter == -1){
				alert("This is the first item in the inventory.");
				counter = 0;
			}
			document.getElementById("widgetImg").src = obj.data[counter].url
			document.getElementById("widgetCaption").innerHTML = obj.data[counter].description;
			document.getElementById("base_price").innerHTML = ("Base price is: " + obj.data[counter].pence_price) + "p";
        }
		
		var widgetImage = BASE_GET_URL + "/widgets/?OUCU=" + oucu + "&password=" + pass;
			console.log("Sending GET to " + widgetImage);
			$.ajax(widgetImage, { type: "GET", data: {id: counter.value}, success: onSuccess });
	
	}
	
	//FR1.3 Adding the currently displayed widget to the order items, including the amount and the agreed price.
	this.add = function() {
	var defaultStartTime = convertToOrderTime(new Date());
	var oucu = getInputValue("oucu", "sf9585");
	var pass = getInputValue("pass", "FXlLXmO1");
	
	
        function onSuccess(obj) {
			
			
			var clientNo = getInputValue("client");
			
			var businessName = obj.data[clientNo - 1].name;
			var businessLoc = obj.data[clientNo - 1].address;
			
			document.getElementById("order_info").innerHTML = "Dear " + businessName + ", Your order at " + businessLoc + ". Order created at: " + defaultStartTime;
			
			var quantity = getInputValue("number");
			var item = widgetCaption.innerHTML;
			var agreed_cost = getInputValue("agreed_price");
			
			document.getElementById("items").innerHTML = (item + " ( " + quantity + " )");
			document.getElementById("agreed_pence").innerHTML = ("Agreed price: " + agreed_cost);
			
			shoppingList[shoppingRows] = ("  " + item + "    " + "[" + quantity + "]" +  "     " + agreed_cost + "GBP per unit   ");
			shoppingRows = shoppingRows + 1;
			
			
			document.getElementById("all_items").innerHTML = shoppingList;
			shoppingList
			
			//Adding the widgets to the orders database
			function addToOrderItems(obj) {
				
				numberGen = numberGen + 1;
				var orderInfo = {
				
					id: numberGen,
					widget_id: obj.id,
					number: quantity,
					pence_price: agreed_cost
				}
				var orderItems = BASE_GET_URL + "/orders_items"
				console.log("Sending POST to " + orderItems);
				$.ajax(orderItems, { type: "POST", data: orderInfo});
				
				//FR1.4 Displaying the sum of ordered items including VAT at a rate of 20%.
				subTotal = subTotal + (agreed_cost * quantity);
				subTotal2 = subTotal.toFixed(2);
				document.getElementById("sub").innerHTML = subTotal2 + "GBP";
				
				VAT = VAT + (agreed_cost * quantity);
				trueVat = (VAT/10) * 2;
				trueVat2 = trueVat.toFixed(2);
				document.getElementById("VAT").innerHTML = trueVat2 + "GBP";
				
				total = total + agreed_cost;
				sum = trueVat + subTotal
				trueTotal = sum;
				trueTotal2 = trueTotal.toFixed(2);
				document.getElementById("total").innerHTML = trueTotal2 + "GBP";
			}
				
			var widgetObj = BASE_GET_URL + "/widgets/?OUCU=" + oucu + "&password=" + pass;
			console.log("Sending GET to " + widgetObj);
			$.ajax(widgetObj, { type: "GET", data: {desciption: item}, success: addToOrderItems });	
			
		
			
        }
		
		
		var clientAdd = BASE_GET_URL + "/clients/?OUCU=" + oucu + "&password=" + pass;
			console.log("Sending GET to " + clientAdd);
			$.ajax(clientAdd, { type: "GET", data: {}, success: onSuccess });
	
	}


	
    //FR1.5 The order is saved to the web service.
    this.end = function() {
	var oucu = getInputValue("oucu", "sf9585");
	var pass = getInputValue("pass", "FXlLXmO1");
	clientNo = getInputValue("client");
	
		function addMarkerToMap(obj1) {
		
			
			var marker;
			var icon = new H.map.DomIcon("<div>&#x1F3C3;</div>");
			var onSuccess = function (obj2) {
				console.log("Obj2 contains :", obj2);
				
				lat = obj2[0].lat,
				lon = obj2[0].lon
				orderTime = convertToOrderTime(new Date());
				clientIdent = getInputValue("client");
				
				var orderFinish = {
					client_id: clientIdent,
					date: orderTime,
					latitude: lat,
					longitude: lon
				}
				var ordersTable = BASE_GET_URL + "/orders"
				
				console.log(orderFinish);
				console.log("Sending POST to " + ordersTable);
				$.ajax(ordersTable, { type: "POST", data: orderFinish});
				alert("Order confirmed!");
				};

			nominatim.get(obj1.data[0].address, onSuccess);
			}
			
		var address = BASE_GET_URL + "/clients/" + clientNo + "?OUCU=" + oucu + "&password=" + pass;
		console.log("Sending GET to " + address);
		$.ajax(address, { type: "GET", data: {}, success: addMarkerToMap });	
		
		}

		
		}


