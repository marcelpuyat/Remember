function NotifHandler() {

	this.notifRememberNote = function(note, icon) {
		chrome.notifications.create(null, {
			type: 'basic',
			title: 'Remember?',
			message: note.title,
			iconUrl: icon,
			buttons: [
				{
					'title': 'View page'
				}
			]
		}, function(notifId) {
			chrome.notifications.onButtonClicked.addListener(function(clickedId) {
				if (clickedId == notifId)
					openInNewTab(note.url); // TODO: Figure out how to delete this listener... bec it will live forever if we dont delete
			});
		});
	};

	/* Popup to notify user about authentication of provider 
	 * @param isAuth true if action is to authenticate, false if is to delete
	 */
	this.notifAuth = function(isAuth, wasSuccessful, providerName) {
		var readableName = _providers[providerName].readableName;
		var message;
		if (isAuth && wasSuccessful) message = "Will now include "+readableName+" content tagged as \"remember\"";
		else if (isAuth && !wasSuccessful) message = "Sorry, but we were not able to authenticate with " +readableName;
		else if (!isAuth && wasSuccessful) message = "Will no longer get content from " +readableName;
		else if (!isAuth && !wasSuccessful) message = "Unexpected error deauthenticating with "+readableName+". Contact us for support.";
		chrome.notifications.create(null, {
			type: 'basic',
			title: (isAuth ? "Authentication " : "Deauthentication ") + (wasSuccessful ? "successful" : "failed"),
			message: message,
			iconUrl: _providers[providerName].icon
		});
	};

	this.notifError = function(title, msg) {
		chrome.notifications.create(null, {
			type: 'basic',
			title: title,
			message: msg
		})
	};
}

var _notifHandler = new NotifHandler();

// Must clear notification on user button click or close
chrome.notifications.onClosed.addListener(function(notificationId, doneByUser) {
	chrome.notifications.clear(notificationId);
});
chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
	chrome.notifications.clear(notificationId);
});