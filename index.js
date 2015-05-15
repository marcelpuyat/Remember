document.addEventListener('DOMContentLoaded', function() {

	chrome.runtime.sendMessage({
		type: "getProviders"
	}, function(response) {
		console.log("Receiving message");
		console.log(response);
		if (response.error) {console.log(response.error); return;}

		var provider, connectSwitch;
		for (provider in response.providers) {
			$('#providers_container').append(
				"<div class='provider-block' id='"+provider+"_block'>"+
					"<h3 class='provider-title'>"+provider+"</h3>"+
					"<img class='provider-icon' src='"+response.providers[provider].icon+"'>"+
					"<input type='checkbox' name='"+response.providers[provider].id+"-connectSwitch'/>"+
				"</div>");

			connectSwitch = $("[name='"+response.providers[provider].id+"-connectSwitch']");
			connectSwitch.attr('checked', response.providers[provider].authenticated);
			connectSwitch.attr('wasConnected', response.providers[provider].authenticated); // Needed bec toggleSwitch changes 'checked' attr
			connectSwitch.toggleSwitch();
		}
		$('.ToggleSwitch').off('click'); // Turn off default toggleswitch behavior
		$('.ToggleSwitch').on('click', onSwitchClick);
	
		// On hover effect so that user knows they can click on a switch to trigger it
		$('.ToggleSwitch').hover(function() {
			$(this).find('.Nub').first().addClass('NubDark');
		}, function() {
			$(this).find('.Nub').first().removeClass('NubDark');
		});
	});

	console.log("Sent message!");

	/* Function to be called when a ToggleSwitch is clicked. ToggleSwitch is denoted by a div with the class ToggleSwitch.
	 * Will handle sending and receiving message from event page regarding auth for a given provider, and will handle
	 * updating UI when waiting/done/successful/on failure.
	 */
	function onSwitchClick() {
		var toggleSwitchElem = this; // From event listener callback
		var inputElem = $(this).find('input').first();
		if (inputElem.attr('name').split('-').length != 2) {
			console.error("Input name has been tampered with. Not going to send request.");
		} else {
			var providerId = inputElem.attr('name').split('-')[0].toLowerCase();
			$(toggleSwitchElem).off('click'); // Disable default click handler of TinyTools ToggleSwitch
			toggleProviderAuth(providerId, toggleSwitchElem, inputElem, {turnOn: inputElem.attr('wasConnected') != 'true'});
		}
	}

	/* This would be in the body of onSwitchClick if not for the repeated code across on/off... */
	function toggleProviderAuth(providerId, toggleSwitchElem, inputElem, options) {
		console.log((options.turnOn ? "Authenticating" : "Deauthenticating") + " provider");

		var switchTextToSwitchTo = (options.turnOn ? "OFF" : "ON");
		var messageType = (options.turnOn ? "authenticate" : "delete");
		var switchClass = (options.turnOn ? "Off" : "On");

		$(toggleSwitchElem).css('cursor', 'progress');
		var intervalId = animateEllipsis($(toggleSwitchElem).find('.'+switchClass+'Side').children().first());
		chrome.runtime.sendMessage({
			type: messageType + "Provider",
			providerId: providerId
		}, function(response) {
			if (response.error != null) { 
				console.error("UNABLE TO "+messageType+" PROVIDER WITH ID: " + providerId);

				clearInterval(intervalId);
				restoreSwitchState(toggleSwitchElem, inputElem,{turnOn:options.turnOn,switchClass:switchClass,switchText:switchTextToSwitchTo,
					wasSuccessful: false
				});
			} else {
				console.log("Trying to turn "+switchClass+" switch for: " + providerId);

				clearInterval(intervalId);
				restoreSwitchState(toggleSwitchElem, inputElem,{turnOn:options.turnOn,switchClass:switchClass,switchText:switchTextToSwitchTo,
					wasSuccessful: true
				});
			}
		});
	}

	/* . -> .. -> ... -> '' -> . over and over
	 * Will return interval id so can be cleared to stop animation.
	 */
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

	/* This would be in the body of toggleProviderAuth if not for repeated code */
	function restoreSwitchState(toggleSwitchElem, inputElem, options) {
		$(toggleSwitchElem).find('.'+options.switchClass+'Side').children().first().text(options.switchText);
		$(toggleSwitchElem).css('cursor', 'pointer');
		$(toggleSwitchElem).on('click', onSwitchClick);
		if (options.wasSuccessful) {
			inputElem.prop('checked', options.turnOn);
			inputElem.attr('wasConnected', options.turnOn); // Needed bec TinyTools ToggleSwitch breaks 'checked' attr functionality
		}
	}

});
