var _unique_ids_ = {};

function Provider(fields) {
	checkRequiredFields(fields);
	var _this = this;
	$.extend(this, fields);
	this.saveNotesAndCreds = function(creds, callback) {
		_this.saveNotes(creds);
		_chromeStorageWrapper.saveCredsForProvider(_this.name, creds);
		if (callback != null) {
			callback();
		}
	};

	function checkRequiredFields(fields) {
		if (fields.id == null) { console.log("No id in a provider constructor"); return; }
		if (_unique_ids_.hasOwnProperty(fields.id)) {
			console.log("Repeating provider id: " + fields.id); return;
		} else {
			_unique_ids_[fields.id] = true;
		}
		if (fields.getCreds == null) { console.log("No creds fn in a provider constructor"); return;}
		if (fields.saveNotes == null) { console.log("No save notes fn in a provider constructor"); return; }
		if (fields.name == null) { console.log("No name in a provider constructor"); return;}
		if (fields.icon == null) { console.log("No icon in a provider constructor"); return;}
	}
}