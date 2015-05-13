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
			authenticated = response.providers[provider]['authenticated'];
			icon = response.providers[provider]['icon'];
			$('#providers_container')
				.append(
					"<div class='provider-block' id='"+provider+"_block'>"+
						"<h3 class='provider-title'>"+provider+"</h3>"+
						"<img class='provider-icon' src='"+icon+"'>"+
						"<input type='checkbox' name='"+provider+"-connectSwitch'/>"+
					"</div>");
			var connectSwitch = $("[name='"+provider+"-connectSwitch']");
			connectSwitch.attr('checked', authenticated);
			connectSwitch.attr('wasConnected', authenticated); // Needed bec toggleSwitch changes 'checked' attr
			connectSwitch.toggleSwitch();
		}
		$('.ToggleSwitch').off('click'); // Turn off default toggleswitch behavior
		$('.ToggleSwitch').on('click', function() {
			var inputElem = $(this).find('input').first();
			var provider = inputElem.attr('name').split('-')[0].toLowerCase();
			if (inputElem.attr('wasConnected') == true) {
				console.log("Deleting provider!");
				chrome.runtime.sendMessage({
					type: "deleteProvider",
					provider: provider
				});
			} else {
				console.log("Authenticating provider");
				chrome.runtime.sendMessage({
					type: "authenticateProvider",
					provider: provider
				}, function(response) {
					if (response.error != null) { console.log("UNABLE TO AUTHENTICATE: " + provider); return; }
				});
			}

		});
	});

	console.log("Sent message!");

});
