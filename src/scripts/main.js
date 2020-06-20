


function removeUserData(local) {
	local.user = ""
	local.encoded = ""
	local.filename = ""
	storage("local", local)

	sessionStorage.removeItem("paste");
}

function encrypt(message, user) {

	let l = storage("local");
	let ran = (Math.floor((Math.random() + 1) * Math.pow(10, 15))).toString();
	let key = CryptoJS.SHA3(user + ran).toString();
	let encr = CryptoJS.AES.encrypt(message, key).toString();

	const package = JSON.stringify({
		ran: ran,
		note: btoa(encr),
		settings: {
			theme: l.theme,
			zoom: l.zoom
		}
	})

	return package
}

function decrypt(package) {

	if (package.indexOf(",000000,") !== -1) {

		let arr = package.split(",000000,")
		package = {
			ran: arr[0],
			note: arr[1],
			settings: {
				theme: atob(arr[2]) || "",
				zoom: null
			}
		}
	} else {
		package = JSON.parse(package)
	}
	
	let l = storage("local");
	let key = CryptoJS.SHA3(l.user + package.ran).toString()

	if (package.settings.theme) settings("theme", package.settings.theme)
	if (package.settings.zoom) settings("zoom", package.settings.zoom)

	try {
	
		const dec = CryptoJS.AES.decrypt(atob(package.note), key);
		return dec.toString(CryptoJS.enc.Utf8)

	} catch(e) {

		//empeche d'envoyer un message d'erreur si le déchiffrage ne fonctionne pas
		//pour eviter un leak ou truc du genre jsp
		console.error(e)
	}
}

function isLoggedIn() {

	//check on page load si le localStorage a le username
	//si oui on affiche le username, cherche la note et affiche
	//si non on enleve le username present pour pas d'ambiguité

	var l = storage("local");
	var hash = window.location.hash.substr(1);

	if (hash != "") {

		removeUserData(l)
		id("username").value = hash
		login()

	} else {

		if (l.user) {

			getusername();
			id("note").focus();
			toServer("lol", l.filename, "read");

		} else {
			login();
		}
	}

	
}

function getusername(state, name) {

	//dechiffre du storage le username pour pouvoir le réafficher à chaque relogin
	//affiche le header geopattern

	let l = storage("local");

	let dec = CryptoJS.AES.decrypt(atob(l.encoded), l.user);
	dec = dec.toString(CryptoJS.enc.Utf8);

	$('#pattern').geopattern(dec);
	$("#username").val(dec);
}

function login() {

	var l = storage("local");

	function filename(input) {
		
		//prend les 64 premiers char de user, les hash, en prend 64 sur 256
		//devient le nom du fichier a sauvegarder, differant du nom d'utilisateur

		if (!l.filename) {

			let fn = input.substring(0, 64);
			fn = CryptoJS.SHA3(fn, { outputLength: 64 }).toString();

			l.filename = fn;
		}
	}

	function setusername(plaintext) {

		//encode le username
		//affiche le header geopattern

		let enc = btoa(CryptoJS.AES.encrypt(plaintext, l.user).toString());
		l.encoded = enc;
		$('#pattern').geopattern(plaintext);
		$(location).attr('href', window.location.pathname + "#" + plaintext)
	}


	//defini les variables
	var user = $("#username").val();
	l.user = CryptoJS.SHA3(user).toString();

	//ajoute username et enregistre
	filename(l.user);
	setusername(user);
	storage("local", l);

	//focus la note et refresh la note
	$("#note").focus();
	toServer("lol", l.filename, "read");
}

function isTyping() {

	//commence un timer de .7s
	//se reset a chaque keypress et enregistre la note si le timer est dépassé

	var l = storage("local");
	var user = l.user;
	var file = l.filename;

	alertCtrl("Typing...");

    clearTimeout(typingTimeout);

    typingTimeout = setTimeout(function () {

    	let sstore = storage("session");
    	let rawnote = $("#note").val();

    	//si on supprime le contenu de #note, reset le fichier serveur en envoyant une string vide
    	//sinon envoyer la note encrypté
    	if (rawnote == "") {
    		toServer("removed", file, "send");
    	} else {
    		sstore.sent = encrypt(rawnote, user);
    		toServer(sstore.sent, file, "send");
    	}
        
        storage("session", sstore);
		alertCtrl("Sent !");

    }, 700);
}

function toServer(data, fnam, func) {

	//assez moche
	//data a envoyer, nom du fichier a localiser et la fonction a effectuer par le serveur
	//si read, dechiffrer la note, alerter et enregistrer dans session

	var xhr = new XMLHttpRequest(),
		method = "POST",
		url = "save.php";

	let send ="data="
		+ (func === "read" ? "lol" : data)
		+ "&fnam=" + fnam
		+ "&func=" + func;

	xhr.open(method, url, true);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

	xhr.onreadystatechange = function () {
		if(xhr.readyState === 4 && xhr.status === 200) {
			
			if (func === "read") {

				let rep = xhr.responseText;

				$("#note").val(decrypt(rep));
				alertCtrl("Received");
				
				var s = storage("session");
				s.rece = rep;
				storage("session", s);
			}
		}
	};
	xhr.send(send);
}

function alertCtrl(state) {

	//la petite popup pour dire qu'une action a été effectué

	clearTimeout(alertTimeout);
	var a = $("#alert");
	a.html(state);

	a.css("opacity", 1);
	alertTimeout = setTimeout(function() {
		a.css("opacity", 0);
	}, 1000);
}

//globalooo
let typingTimeout = 0, alertTimeout = 0
const setuserinputwidth = (elem=id("username"), backspace) => elem.style.width = `calc(7.2px * ${elem.value.length + (backspace ? 0 : 2)})`

window.onload = function() {

	//quand on appuie sur entrée dans le username input
	id("username").onkeydown = function(e) {

		if (e.keyCode === 8) {
			setuserinputwidth(this, true)
		}
		else if (e.keyCode === 13) {
			removeUserData(storage("local"));
			login();
			return false;
		}
		else {
			setuserinputwidth(this)
		}
	}

	//les fameux paste et keypress
	$("#note").on("paste", () => {
		isTyping();
	});

	$("#note").keydown(() => {
		isTyping();
	});

	//les boutons settings
	id("refresh").onclick = function() {
		alertCtrl("Refreshed !")
		toServer("lol", storage("local").filename, "read")
	}

	isLoggedIn()
	settings()
	setuserinputwidth()
};