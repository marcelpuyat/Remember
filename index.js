document.addEventListener('DOMContentLoaded', function() {

	var _providerIdToProviderMap = {};
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
			_providerIdToProviderMap[response.providers[provider].id] = {'name': provider, 'icon': response.providers[provider].icon};
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
		$('.ToggleSwitch').on('click', onSwitchClick);
	
		$('.ToggleSwitch').hover(function() {
			// TODO: Change this to adding class
			$(this).find('.Nub').first().css('background', 'linear-gradient(to bottom,#fff 0%,#bbb 100%)');
		}, function() {
			// TODO: Change this to adding class
			$(this).find('.Nub').first().css('background', 'linear-gradient(to bottom,#fff 0%,#eee 100%)');
		});
	});

	console.log("Sent message!");

	function animateEllipsis(spanWithText) {
		spanWithText.text('.');
		return setInterval(function() {
			if (spanWithText.text() == ". . .") {
				spanWithText.text('');
			} else if (spanWithText.text() == '') {
				spanWithText.text('.');
			} else {
				spanWithText.text(spanWithText.text() + " .");
			}
		}, 400);
	}

	function onSwitchClick() {
		var _this = this;
		var inputElem = $(this).find('input').first();
		if (inputElem.attr('name').split('-').length != 2) {
			console.error("Input name has been tampered with. Not going to send request.");
			return;
		}
		var providerId = inputElem.attr('name').split('-')[0].toLowerCase();
		$(_this).off('click');
		if (inputElem.attr('wasConnected') == 'true') {
			console.log("Deleting provider!");
			var intervalId = animateEllipsis($(this).find('.OnSide').children().first());
			chrome.runtime.sendMessage({
				type: "deleteProvider",
				providerId: providerId
			}, function(response) {
				if (response.error != null) { 
					console.error("UNABLE TO DELETE AUTH FOR PROVIDER WITH ID: " + providerId); 
					clearInterval(intervalId);
					$(_this).find('.OnSide').children().first().text('ON');
					$(_this).on('click', onSwitchClick);
					return; 
				}
				inputElem.attr('wasConnected', false);
				console.log("Trying to switch off switch for: " + providerId);
				clearInterval(intervalId);
				$(_this).find('.OnSide').children().first().text('ON');
				inputElem.prop('checked', false);
				$(_this).on('click', onSwitchClick);
			});
		} else {
			console.log("Authenticating provider");
			var intervalId = animateEllipsis($(this).find('.OffSide').children().first());
			chrome.runtime.sendMessage({
				type: "authenticateProvider",
				providerId: providerId
			}, function(response) {
				if (response.error != null) { 
					console.error("UNABLE TO AUTHENTICATE PROVIDER WITH ID: " + providerId); 
					clearInterval(intervalId);
					$(_this).find('.OffSide').children().first().text('OFF');
					$(_this).on('click', onSwitchClick);
					return; 
				}
				inputElem.attr('wasConnected', true);
				console.log("Trying to switch on switch for: " + providerId);
				clearInterval(intervalId);
				$(_this).find('.OffSide').children().first().text('OFF');
				inputElem.prop('checked', true); 
				$(_this).on('click', onSwitchClick);
			});
		}
	}

});
