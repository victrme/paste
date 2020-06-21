function storage(type, data) {

	//initialise le storage de paste en mettant
	//toute les variables dans un array "paste", dans local et session Storage

	if (type == "session") {

		if (data) {
			sessionStorage.paste = JSON.stringify(data);
		}
		else {
			if (sessionStorage.paste) {
				return JSON.parse(sessionStorage.paste);
			} else {
				let x = {
					sent: "",
					rece: "",
				}
				sessionStorage.paste = JSON.stringify(x);
				return JSON.parse(sessionStorage.paste);
			}
		}
	}

	if (type == "local") {
		if (data) {
			console.log(data)
			localStorage.paste = JSON.stringify(data);
		}
		else {

			if (localStorage.paste) {
				return JSON.parse(localStorage.paste);
			} else {
				let x = {
					user: "",
					encoded: "",
                    filename: "",
                    password: false,
                    theme: "",
					zoom: 1
				}
				localStorage.paste = JSON.stringify(x);
				return JSON.parse(localStorage.paste);
			}
		}
	}
}

function removeUserData(local) {
	local.user = ""
	local.encoded = ""
	local.filename = ""
	storage("local", local)

	dom_note.removeAttribute("disabled")
	dom_note.value = ""
	dom_password.value = ""
	document.body.style = ""

	sessionStorage.removeItem("paste");
}

function erase() {
	//envoie erase au serv, vide la note, efface le storage, retourne sur index

	function deleteAll() {

		let l = storage("local");
		toServer(null, l.filename, "erase");

		localStorage.removeItem("paste");
		sessionStorage.removeItem("paste");

		location.replace("index.html");
	}

	if (conf) {
		clearTimeout(confTimer);
		id('erase').innerText = "Erase from server";
		conf = false;
		deleteAll();

	}
	else {
		id('erase').innerText = "Are you sure ?";
		conf = true;
		confTimer = setTimeout(function () {
			id('erase').innerText = "Erase from server";
			conf = false;
		}, 2000);
	}
}

function theme(color, event) {

	function applyTheme(val) {

		function textColorSelection(hex) { 

			if (hex.length === 3) {
				hex =
					parseInt(hex[0], 16) ** 2
					+ parseInt(hex[1], 16) ** 2
					+ parseInt(hex[2], 16) ** 2
			}
			else if (hex.length === 6) {
				hex =
					parseInt(hex[0] + hex[1], 16)
					+ parseInt(hex[2] + hex[3], 16)
					+ parseInt(hex[4] + hex[5], 16)
			}
			else {
				return false;
			}

			return ((hex / 765) > .5 ? "black" : "white");
		}

		let textColor = textColorSelection(val.replace("#", ""));

		
		if (val === "") {
			document.body.style.background = "#000"
			document.body.style.color = "white"
		}
		//doesnt apply colors that can't be contrasted properly
		if (textColor) {
			document.body.style.background = (val.indexOf("#") === -1 ? "#" + val : val)
			document.body.style.color = textColor
			dom_background.value = val
		}
	}

	let l = storage("local")

	if (event) {

		applyTheme(color)
		l.theme = color
		storage("local", l)


	} else {
		applyTheme(color)
	}
}

function zoom(val, event) {

	let l = storage("local");

	if (event) {
		document.body.style.zoom = l.zoom
		l.zoom = val
		storage("local", l)
	}
	else {
		dom_zoom.value = l.zoom;
		document.body.style.zoom = val;
	}
}


// GLOBAL VAL INIT OH NO

let conf = false, confTimer = 0;

const id = elem => document.getElementById(elem)

const dom_username = id("username"),
	dom_note = id("note"),
	dom_settings = id("settings"),
	dom_password = id("password"),
	dom_pattern = id("pattern"),
	dom_background = id("background"),
	dom_zoom = id("zoom"),
	dom_erase = id("erase");

let firebaseConfig = {
	apiKey: "AIzaSyCVqSZy0y_nue8fBiU_bX1kI3Ltd76_ObM",
	authDomain: "paste-test-6969.firebaseapp.com",
	databaseURL: "https://paste-test-6969.firebaseio.com",
	projectId: "paste-test-6969",
	storageBucket: "paste-test-6969.appspot.com",
	messagingSenderId: "587142456017",
	appId: "1:587142456017:web:99cf4b1e0eb2b8fcfb9bf0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig)
let database = firebase.database()