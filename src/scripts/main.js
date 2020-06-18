
const id = elem => document.getElementById(elem)

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
			localStorage.paste = JSON.stringify(data);
		}
		else {

			if (localStorage.paste) {
				return JSON.parse(localStorage.paste);
			} else {
				let x = {
					user: "",
					encoded: "",
					hidden: false,
					filename: "",
					theme: ""
				}
				localStorage.paste = JSON.stringify(x);
				return JSON.parse(localStorage.paste);
			}
		}
	}
}

function encrypt(message, user) {

	//ran: calcul bien trop compliqué pour pas grand chose, sert d'IV à la clé d'encryption
	//ajoute ran au hash user pour que le message soit toujours encrypté avec une clé differente
	//encrypte avec le hash de ran + user, rajoute ran au debut du message encrypté
	//ran peut être découvert, il randomise seulement un peu plus l'encryption

	let l = storage("local");

	let ran = (Math.floor((Math.random() + 1) * Math.pow(10, 15))).toString();
	let key = CryptoJS.SHA3(user + ran).toString();
	let encr = CryptoJS.AES.encrypt(message, key).toString();

	let full = ran + ",000000," + btoa(encr);

	return full;
}

function decrypt(message) {

	let l = storage("local");
	//ajoute le random a la clé pour pouvoir déchiffrer
	let arr = message.split(",000000,");
	let key = CryptoJS.SHA3(l.user + arr[0]).toString();

	try {

		let dec = CryptoJS.AES.decrypt(atob(arr[1]), key);
		return dec.toString(CryptoJS.enc.Utf8)

	} catch(e) {

		//empeche d'envoyer un message d'erreur si le déchiffrage ne fonctionne pas
		//pour eviter un leak ou truc du genre jsp
		return "";
	}
}

function isLoggedIn() {

	//check on page load si le localStorage a le username
	//si oui on affiche le username, cherche la note et affiche
	//si non on efface le storage pour pas d'ambiguité

	var l = storage("local");
	var hash = window.location.hash.substr(1);

	if (hash != "") {

		localStorage.removeItem("paste");
		sessionStorage.removeItem("paste");
		$("#username").val(hash);
		login();

	} else {

		if (l.user) {

			getusername();
			$("#note").focus();
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

		if (!l.hidden) {
			
			$(location).attr('href', window.location.pathname + "#" + plaintext);

		}
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

//quand on appuie sur entrée dans le username input
$("#username").keypress(function(e) {
	if (e.keyCode == 13) {
		localStorage.removeItem("paste");
		sessionStorage.removeItem("paste");
        login();
        return false;
    }
});

//globalooo
var timeout;

function isTyping() {

	//commence un timer de .7s
	//se reset a chaque keypress et enregistre la note si le timer est dépassé

	var l = storage("local");
	var user = l.user;
	var file = l.filename;

	alertCtrl("Typing...");

    clearTimeout(timeout);

    timeout = setTimeout(function () {

    	let sstore = storage("session");
    	let rawnote = $("#note").val();

    	//si on supprime le contenu de #note, reset le fichier serveur en envoyant une string vide
    	//sinon envoyer la note encrypté
    	if (rawnote == "") {
    		toServer("--", file, "send");
    	} else {
    		sstore.sent = encrypt(rawnote, user);
    		toServer(sstore.sent, file, "send");
    	}
        
        storage("session", sstore);
		alertCtrl("Sent !");

    }, 700);
}

//les fameux paste et keypress
$("#note").on("paste", () => {
	isTyping();
});

$("#note").keydown(() => {
	isTyping();
});

//les boutons settings
$(".btnRefresh").click(() => {
	alertCtrl("Refreshed !");
	let l = storage("local");
	toServer("lol", l.filename, "read");
});

$("#copyBtn").click(() => {
	copyText();
});

$(".gotosettings").click(() => {
	location.replace("settings.html");
});



function toServer(data, fnam, func) {

	//assez moche
	//data a envoyer, nom du fichier a localiser et la fonction a effectuer par le serveur
	//si read, dechiffrer la note, alerter et enregistrer dans session

	var xhr = new XMLHttpRequest(),
		method = "POST",
		url = "save.php";
	var send;

	if (func === "send") {
		send = "data=" + data + "&fnam=" + fnam + "&func=" + func;
	}
	if (func === "read") {
		send = "data=lol&fnam=" + fnam + "&func=" + func;
	}

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

function copyText() {

	// Create a "hidden" input
	// Assign it the value of the specified element
	// Append it to the body
	// Highlight its content
	// Copy the highlighted text
	// Remove it from the body
	// Non je l'ai pas copié sur internet c'est pas vrai

	var val = document.getElementById("note").value;

	if (val != "") {
		var aux = document.createElement("input");
		aux.setAttribute("value", document.getElementById("note").value);
		document.body.appendChild(aux);
		aux.select();
		document.execCommand("copy");
		document.body.removeChild(aux);

		alertCtrl("Copied !");
	}	
}

var t;
function alertCtrl(state) {

	//la petite popup pour dire qu'une action a été effectué

	clearTimeout(t);
	var a = $("#alert");
	a.html(state);

	a.css("opacity", 1);
	t = setTimeout(function() {
		a.css("opacity", 0);
	}, 1000);
}

function theme(init, newTheme) {

	let l = storage("local")
	const applyTheme = val => document.body.setAttribute("class", val)

	if (init)
		applyTheme(l.theme);

	else {
		applyTheme(newTheme);
		l.theme = newTheme;
		storage("local", l);
	}
}

window.onload = function() {

	isLoggedIn();
	theme(true)
};