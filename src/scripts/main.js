
function removeUserData(local) {
	local.user = ""
	local.encoded = ""
	local.filename = ""
	storage("local", local)

	id("note").removeAttribute("disabled")
	id("note").value = ""
	id("password").value = ""
	document.body.style = ""

	sessionStorage.removeItem("paste");
}

function encrypt(message, user) {

	//encodage normal
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

	//wrap le tout si ya un mdp

	return password({is: "enc", note: package})
}

function decrypt(package) {

	function applyDecrypt(data) {

		//old version control
		if (data.indexOf(",000000,") !== -1) {

			let arr = data.split(",000000,")
			data = {
				ran: arr[0],
				note: arr[1],
				settings: {
					theme: atob(arr[2]) || "",
					zoom: null
				}
			}
		} else {
			data = JSON.parse(data)
		}

		let l = storage("local")
		let decrypted = ""
		let key = CryptoJS.SHA3(l.user + data.ran).toString()

		try {
			decrypted = CryptoJS.AES.decrypt(atob(data.note), key)
		} catch (error) {
			console.warn("N'a pas pu déchiffrer")
		}

		//ajoute settings si jamais
		if (data.settings.theme) settings("theme", data.settings.theme)
		if (data.settings.zoom) settings("zoom", data.settings.zoom)

		return decrypted.toString(CryptoJS.enc.Utf8)
	}

	//password control
	if (package.indexOf("yaunmdp") !== -1) {

		package = password({is: "dec", note: package})

		//si password est cool
		if (package !== false) {

			id("note").removeAttribute("disabled")
			id("note").focus()
			id("settings").className = ""
			return applyDecrypt(package)

		} else {
			//mauvais password
			id("note").setAttribute("disabled", "")
			id("settings").className = "open"
			id("password").value = ""
			id("password").focus()

			return "This note is protected by a password"
		}

	} else {
		//pas de password
		return applyDecrypt(package)
	}
}

function password(arg) {

	const mdp = id("password").value

	if (arg.is === "enc" && mdp === "") {
		return arg.note
	}

	else if (arg.is === "enc") {
		return "yaunmdp" + btoa(CryptoJS.AES.encrypt(arg.note, mdp).toString())
	}

	else if (arg.is === "dec") {

		let decrypted = false
		arg.note = arg.note.replace("yaunmdp", "")

		try {
			decrypted = CryptoJS.AES
				.decrypt(atob(arg.note), mdp)
				.toString(CryptoJS.enc.Utf8)

		} catch (error) {
			console.warn("N'a pas pu déchiffrer")
			decrypted = false
		}

		return decrypted
	}
}

function isLoggedIn() {

	//check on page load si le localStorage a le username
	//si oui on affiche le username, cherche la note et affiche
	//si non on enleve le username present pour pas d'ambiguité

	var l = storage("local");
	var hash = window.location.hash.substr(1);

	if (hash !== "") {

		id("username").value = hash
		login()

	} else {

		if (l.user) {

			getusername()
			id("note").focus()
			toServer("lol", l.filename, "read")

		} else {
			login()
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
	let l = storage("local");
	let user = id("username").value;
	l.user = CryptoJS.SHA3(user).toString();

	//ajoute username et enregistre
	filename(l.user);
	setusername(user);
	storage("local", l);

	//focus la note et refresh la note
	id("note").focus()
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

function toServer(data, filename, option) {

	//data a envoyer, nom du fichier a localiser et la fonction a effectuer par le serveur
	//si read, dechiffrer la note, alerter et enregistrer dans session

	var xhr = new XMLHttpRequest(),
		method = "POST",
		url = "https://victor-azevedo.me/paste/save.php";

	let send ="data="
		+ (option === "read" ? "lol" : data)
		+ "&fnam=" + filename
		+ "&func=" + option;

	xhr.open(method, url, true);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

	xhr.onreadystatechange = function () {

		if (xhr.readyState === 4 && xhr.status === 200) {
			
			if (option === "read") {

				let response = xhr.responseText;

				if (response && response !== "removed") {

					id("note").value = decrypt(response)
					alertCtrl("Received")
					
					let storagesession = storage("session")
					storagesession.rece = response
					storage("session", storagesession)
				}
			}
		}
	}
	
	xhr.send(send)
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
	})

	$("#note").keydown(() => {
		isTyping();
	})

	id("refresh").onclick = function() {
		alertCtrl("Refreshed !")
		toServer("lol", storage("local").filename, "read")
	}

	id("password").onkeypress = function(e) {
		
		
		let received = ""
		let l = storage("local")

		try {
			received = JSON.parse(sessionStorage.paste).rece
		} catch (error) {
			console.warn("nothing received yet")
		}

		//quand on enter
		if (e.keyCode === 13) {

			l.password = (this.value !== "" ? true : false) //si mdp vide, false
			storage("local", l)

			//si 
			if (!received) {
				id("note").focus()	
			} else {
				id("note").value = decrypt(received)
			}
		}
	}

	isLoggedIn()
	settings()
	setuserinputwidth()
}