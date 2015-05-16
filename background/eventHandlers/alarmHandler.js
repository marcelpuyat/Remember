/* In charge of registering and responding to events that should happen time interval using chrome's alarm module.
 * See https://developer.chrome.com/apps/alarms for more details.
 */

(function() {

	var alarmHandlers = {
		popupAlarm: function(alarm) {
			console.log("Popup alarm");
			_storage.getLastPopupTime(function(lastPopupTime) {
				if (lastPopupTime == null) {
					// Means we are doing this for first time.
					console.log("Haven't popped up before.");
					_storage.updateLastPopupTime(function() {
						popupRandomNote();
					}, console.error);
				} else {
					console.log("Need to check last popup time.");
					console.log(lastPopupTime);
					console.log(new Date(lastPopupTime));
					console.log("It's been " + diffInHours(new Date(lastPopupTime), new Date()) + " hours since last popup.");

					if (!_config.testMode && diffInHours(lastPopupTime, new Date()) > _config.hoursBetweenPopups) {
						_storage.updateLastPopupTime(function() {
							popupRandomNote();
						}, console.error);
					}
				}
			}, console.error);
		},
		updateSavedNotes: function(alarm) {
			_storage.refreshAllProviderNotes(null, console.error);
		}
	};

	chrome.alarms.create("popupAlarm", {
		periodInMinutes: _config.testMode ? 1 : 20
	});
	chrome.alarms.create("updateSavedNotes", {
		periodInMinutes: _config.testMode ? 1 : 20
	});
	chrome.alarms.onAlarm.addListener(function(alarm) {
		if (alarmHandlers[alarm.name] === undefined) { console.error("Undefined alarm: " + alarm.name); return; }
		alarmHandlers[alarm.name](alarm); // Call appropriate alarm handler, passing in alarm
	});

	function popupRandomNote() {
		_storage.getAllNotes(function(savedNotes) {
			if (savedNotes.length > 0) {
				console.log("Pop up!");

				var randomIdx = Math.floor(Math.random()*savedNotes.length);
				var chosenNote = savedNotes[randomIdx];

				console.print("Choosing note: ", chosenNote);
				console.print("All saved notes: ", savedNotes);

				_notifHandler.notifRememberNote(chosenNote, _providers[chosenNote.provider].icon);
			}
		}, console.error);
	}

	/* Use for testing new providers */
	function authenticateProviderOnInstall(provider) {
		chrome.runtime.onInstalled.addListener(provider.getAccessToken(
			provider.saveNotesAndAccessToken,
			function(errorMsg) {
				if (errorMsg) { console.error("Error: "+errorMsg); return; }
				else { console.error("Error without message :("); }
			})
		);
	}

})();