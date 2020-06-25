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
					zoom: 12
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

	dom.note.removeAttribute("disabled")
	dom.note.value = ""
	dom.password.value = ""
	document.body.style = ""

	sessionStorage.removeItem("paste");
}

function resetPaste() {
	dom.pattern.style.backgroundImage = GeoPattern.generate("").toDataUrl()
	removeUserData(storage("local"))
	dom.settings.className = ""
	document.querySelector("header").className = ""
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
			dom.background.value = val
		}
	}

	let l = storage("local")
	l.theme = color
	storage("local", l)
	applyTheme(color)

	if (event) {
		typingWait(updateNote)
	} else {
		dom.background.value = color
	}
}

function zoom(val, event) {

	if (val !== NaN
		&& val >= 12
		&& val <= 16) {

		let l = storage("local");

		document.body.style.fontSize = val + "px"
		l.zoom = val
		storage("local", l)

		if (event) {
			typingWait(updateNote)
		} else {
			dom.zoom.value = val
		}
	}
}

function captchaTest(callback) {

	//don't captcha localfile
	//this needs a fix
	if (window.location.protocol === "file:") {
		callback()
	}

	else {
		grecaptcha.ready(function() {
			grecaptcha.execute(atob("NkxmdWthZ1pBQUFBQUtpZjU1YU1YMGZEaUEyV1lHMWF2RmxOWXZIaA=="), {action: 'submit'}).then(function(token) {
	
				let xhttp = new XMLHttpRequest();
	
				xhttp.open("POST", "https://victor-azevedo.me/paste/captcha.php", true)
				xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
				xhttp.onreadystatechange = function() {
					if (this.readyState == 4 && this.status == 200) {
						if (this.responseText === "not a bot") {
							callback()
						}
					}
				}
				
				xhttp.send("token=" + token)
			})
		})
	}
}

function typingWait(callback) {

	//commence un timer de .7s
	clearTimeout(typingTimeout);
	typingTimeout = setTimeout(function() {
		callback()
	}, 700);
}


// GLOBAL VAL INIT OH NO

let conf = false,
	confTimer = 0,
	alertTimeout = 0,
	typingTimeout = 0,
	dbref = null,
	initlistener = true;

const id = elem => document.getElementById(elem);
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userA).agent;

const dom = {
	username: id("username"),
	note: id("note"),
	settings: id("settings"),
	toSettings: id('toSettings'),
	password: id("password"),
	pattern: id("pattern"),
	background: id("background"),
	zoom: id("zoom"),
	erase: id("erase")
}

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

