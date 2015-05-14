document.addEventListener('DOMContentLoaded', function() {
	// chrome.runtime.onInstalled.addListener(_providers.evernote.getAccessToken(
	// 	_providers.evernote.saveNotesAndAccessToken,
	// 	function(errorMsg) {
	// 		if (errorMsg) { console.error("Error: "+errorMsg); return; }
	// 		else { console.error("Error without message :("); }
	// 	})
	// );

	var alarmHandlers = {
		popupAlarm: function(alarm) {
			console.log("Popup alarm");
			_chromeStorageWrapper.getLastPopupTime(function(lastPopupTime) {
				if (lastPopupTime == null) {
					// Means we are doing this for first time.
					console.log("Haven't popped up before.");
					_chromeStorageWrapper.updateLastPopupTime();
					popupRandomNote();
				} else {
					console.log("Need to check last popup time.");
					console.log(lastPopupTime);
					console.log(new Date(lastPopupTime));
					console.log("It's been " + diffInHours(new Date(lastPopupTime), new Date()) + " hours since last popup.");
					if (diffInHours(lastPopupTime, new Date()) > _config.hoursBetweenPopups) {
						_chromeStorageWrapper.updateLastPopupTime();
						popupRandomNote();
					}
				}
			});
			/* Will handle case where no notes exist */
			function popupRandomNote() {
				_chromeStorageWrapper.getNotes(function(savedNotes) {
					if (savedNotes.length > 0) {
						console.log("Pop up!");
						var randomIdx = Math.floor(Math.random()*savedNotes.length);
						var chosenNote = savedNotes[randomIdx];
						console.log("Choosing note: " + JSON.stringify(chosenNote));
						console.dir(savedNotes);
						_popupHandler.popupRememberNote(chosenNote, _providers[chosenNote.provider].icon);
					}
				});
			}
		},
		updateSavedNotes: function(alarm) {
			_chromeStorageWrapper.refreshAllProviderNotes();
		}
	};

	chrome.alarms.create("popupAlarm", {
		periodInMinutes: 20
	});
	chrome.alarms.create("updateSavedNotes", {
		periodInMinutes: 20
	});
	chrome.alarms.onAlarm.addListener(function(alarm) {
		if (alarmHandlers[alarm.name] === undefined) { console.error("Undefined alarm: " + alarm.name); return; }
		alarmHandlers[alarm.name](alarm); // Call appropriate alarm handler, passing in alarm
	});

	// Must clear notification on user button click or close
	chrome.notifications.onClosed.addListener(function(notificationId, doneByUser) {
		chrome.notifications.clear(notificationId);
	});
	chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
		chrome.notifications.clear(notificationId);
	});
});