var _unique_ids_ = {};

function Provider(fields) {
	checkRequiredFields(fields);
	var _this = this;
	$.extend(this, fields);
	
	this.saveNotesAndCreds = function(creds, successCb, errorCb) {
		_this.saveNotes(creds, function() {
			_chromeStorageWrapper.saveCredsForProvider(_this.name, creds, successCb, errorCb);
		}, errorCb);
	};

	this.deleteNotesAndCreds = function(successCb, errorCb) {
		_chromeStorageWrapper.deleteCredsForProvider(_this.name, function() {
			_chromeStorageWrapper.deleteNotesForProvider(_this.name, successCb, errorCb);
		}, errorCb);
	}

	function checkRequiredFields(fields) {
		if (fields.id == null) { console.error("No id in a provider constructor"); return; }
		if (_unique_ids_.hasOwnProperty(fields.id)) {
			console.error("Repeating provider id: " + fields.id); return;
		} else {
			_unique_ids_[fields.id] = true;
		}
		if (fields.getCreds == null) { console.error("No creds fn in a provider constructor"); return;}
		if (fields.saveNotes == null) { console.error("No save notes fn in a provider constructor"); return; }
		if (fields.name == null) { console.error("No name in a provider constructor"); return;}
		if (fields.icon == null) { console.error("No icon in a provider constructor"); return;}
	}
}