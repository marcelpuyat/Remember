document.addEventListener('DOMContentLoaded', function() {

	chrome.runtime.sendMessage({
		type: "getProviders"
	}, function(response) {
		console.log("Receiving message");
		console.log(response);
		if (response.error) {console.log(response.error); return;}
		var idx;
		var provider;
		var authenticated;
		var icon;
		for (provider in response.providers) {
			authenticated = response.providers[provider].authenticated;
			icon = response.providers[provider].icon;
			$('#providers_container')
				.append(
					"<div class='provider-block' id='"+provider+"_block'>"+
						"<h3 class='provider-title'>"+provider+"</h3>"+
						"<img class='provider-icon' src='"+icon+"'>"+
						"<input type='checkbox' name='"+response.providers[provider].id+"-connectSwitch'/>"+
					"</div>");
			var connectSwitch = $("[name='"+response.providers[provider].id+"-connectSwitch']");
			connectSwitch.attr('checked', authenticated);
			connectSwitch.attr('wasConnected', authenticated); // Needed bec toggleSwitch changes 'checked' attr
			connectSwitch.toggleSwitch();
		}
		$('.ToggleSwitch').off('click'); // Turn off default toggleswitch behavior
		$('.ToggleSwitch').on('click', function() {
			var inputElem = $(this).find('input').first();
			if (inputElem.attr('name').split('-').length != 2) {
				console.error("Input name has been tampered with. Not going to send request.");
				return;
			}
			var providerId = inputElem.attr('name').split('-')[0].toLowerCase();
			if (inputElem.attr('wasConnected') == 'true') {
				console.log("Deleting provider!");
				chrome.runtime.sendMessage({
					type: "deleteProvider",
					providerId: providerId
				}, function(response) {
					if (response.error != null) { console.error("UNABLE TO DELETE AUTH FOR PROVIDER WITH ID: " + providerId); return; }
					inputElem.attr('wasConnected', false);
					console.log("Trying to switch off switch for: " + providerId);
					inputElem.prop('checked', false);
				});
			} else {
				console.log("Authenticating provider");
				chrome.runtime.sendMessage({
					type: "authenticateProvider",
					providerId: providerId
				}, function(response) {
					if (response.error != null) { console.error("UNABLE TO AUTHENTICATE PROVIDER WITH ID: " + providerId); return; }
					inputElem.attr('wasConnected', true);
					console.log("Trying to switch on switch for: " + providerId);
					inputElem.prop('checked', true); 
				});
			}

		});
	});

	console.log("Sent message!");

});
