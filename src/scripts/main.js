
function encrypt(message, user) {

	let l = storage("local");
	let ran = Date.now().toString();								//IV is ran: now()
	let key = CryptoJS.SHA3(user + ran).toString();					//key is long user + IV
	let encr = CryptoJS.AES.encrypt(message, key).toString();		//first base64 wrap

	const package = JSON.stringify({
		ran: ran,
		note: btoa(encr),											//second base64 wrap for sending encrypted note
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

		//old control
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
		
		//init values
		let l = storage("local")
		let decrypted = ""
		let key = CryptoJS.SHA3(l.user + data.ran).toString()

		//note decryption
		try {
			decrypted = CryptoJS.AES.decrypt(atob(data.note), key).toString(CryptoJS.enc.Utf8)
		} catch(e) {
			console.warn(e)
			return false
		}
		
		//settings update
		theme(!data.settings.theme ? "#000" : data.settings.theme)
		zoom(!data.settings.zoom ? 12 : data.settings.zoom) 

		l.theme = data.settings.theme
		l.zoom = data.settings.zoom

		storage("local", l)
		
		//after settings update
		return decrypted
	}

	//password control
	if (package.indexOf("yaunmdp") !== -1) {

		package = password({is: "dec", note: package})

		//si password est cool
		if (package !== false) {

			dom.note.removeAttribute("disabled")
			dom.note.focus()
			id("settings").className = ""
			return applyDecrypt(package)

		} else {
			//mauvais password
			dom.note.setAttribute("disabled", "")
			id("settings").className = "open"
			dom.password.value = ""
			dom.password.focus()

			return "This note is protected by a password"
		}

	} else {
		//pas de password
		return applyDecrypt(package)
	}
}

function password(arg) {

	const mdp = dom.password.value

	if (arg.event) {
		
		let received = ""
		let l = storage("local")

		try {
			received = JSON.parse(sessionStorage.paste).rece
		} catch(e) {
			console.warn("nothing received yet")
		}

		//quand on enter
		if (e.keyCode === 13) {

			l.password = this.value !== "" //si mdp vide, false
			storage("local", l)

			//si 
			(!received ? dom.note.focus() : dom.note.value = decrypt(received))
		}
	}

	else {

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
}

function isLoggedIn() {

	//check on page load si le localStorage a le username
	//si oui on affiche le username, cherche la note et affiche
	//si non on enleve le username present pour pas d'ambiguité

	function cacheControl() {
		
		if (s.sent || s.rece) {

			let sentTime = 0, receTime = 0;

			//omg
			if (s.sent !== "" && s.rece === "") decrypt(s.sent)
			else if (s.sent === "" && s.rece !== "") decrypt(s.rece)
			else if (s.sent !== "" && s.rece !== "") {
				sentTime = JSON.parse(s.sent).ran
				receTime = JSON.parse(s.rece).ran
				dom.note.value = decrypt((sentTime > receTime ? s.sent : s.rece))
			}
		}
	}

	let l = storage("local");
	let s = storage("session");
	let hash = window.location.hash.substr(1);

	cacheControl()
	

	if (hash !== "") {
		dom.username.value = hash
		login(true)
	}
	else if (l.user && l.filename !== "9e50bb628aacc742") {

		getusername()
		dom.note.focus()
		toServer("lol", l.filename, "read")
	}
	else {
		resetPaste()
	}
}

function getusername(state, name) {

	//dechiffre du storage le username pour pouvoir le réafficher à chaque relogin
	//affiche le header geopattern

	let l = storage("local");

	let dec = CryptoJS.AES.decrypt(atob(l.encoded), l.user);
	dec = dec.toString(CryptoJS.enc.Utf8);

	dom.pattern.style.backgroundImage = GeoPattern.generate(dec).toDataUrl()
	dom.username.value = dec
}

function login() {

	captchaTest(() => {
		
		function filename(input) {
		
			//prend les 64 premiers char de user, les hash, en prend 64 sur 256
			//devient le nom du fichier a sauvegarder, differant du nom d'utilisateur
	
			if (!local.filename) {
	
				let fn = input.substring(0, 64);
				fn = CryptoJS.SHA3(fn, { outputLength: 64 }).toString();
	
				local.filename = fn;
				return fn
			} else {
				return local.filename
			}
		}
	
		function setusername(plaintext) {
	
			//encode le username
			//affiche le header geopattern
	
			let enc = btoa(CryptoJS.AES.encrypt(plaintext, local.user).toString());
			local.encoded = enc;
			dom.pattern.style.backgroundImage = GeoPattern.generate(plaintext).toDataUrl()
			window.location.href = window.location.pathname + "#" + plaintext
		}
	
		//defini les variables
		let local = storage("local");
		let user = CryptoJS.SHA3(dom.username.value).toString();
		let fileName = filename(user);
	
		//ajoute username et enregistre
		setusername(dom.username.value);
	
		//focus la note et refresh la note
		dom.note.focus()

		//removes previous listener
		if (dbref) {
			dbref.off();
		}
	
		//listen
		dbref = firebase.database().ref(fileName)

		dbref.on('value', function(snapshot) {
	
			const read_val = snapshot.val()
			const session = storage("session")
			const sameNote = (read_val && read_val === session.sent)
			const sameFile = (fileName && fileName === local.filename)
	
			if (initlistener || !sameNote && sameFile) {
	
				dom.note.value = decrypt(read_val)
				session.rece = read_val
				storage("session", session)
				alert("Received !")

				initlistener = false
			}
	
			console.log("from firebase listen: ", read_val)
		})
	
		//to storage
		local.fileName = fileName
		local.user = user
		storage("local", local);
	
		document.querySelector("header").className = "connected"
		setUserInputWidth()
	})
}

function updateNote() {

	let local = storage("local");
	let session = storage("session");

	session.sent = encrypt(dom.note.value, local.user);
	storage("session", session);

	toServer(session.sent, local.filename, "send");
	alert("Sent")
}

function toServer(data, filename, option) {

	//updates
	if (option === "send") {
		firebase.database().ref(filename).set(data)
	}

	//read once
	else if (option === "read") {

		alert("Loading...")

		return firebase.database().ref(filename).once('value').then(function(snapshot) {
			if (snapshot.val()) decrypt(snapshot.val())
		})
	}

	//erase
	else if (option === "erase") {
		firebase.database().ref(filename).set(null)
	}
}

function alert(state) {

	clearTimeout(alertTimeout)
	const alert = id("alert")
	alert.innerText = state

	alert.className = "visible"
	alertTimeout = setTimeout(function() {alert.className = ""}, 1000)
}

function setUserInputWidth(backspace) {

	let fontsize = parseInt(document.body.style.fontSize) || 12
	let valueLength = dom.username.value.length + (backspace ? 0 : 2)
	let inputwidth = (fontsize * .59) * valueLength

	if (dom.username.value.length < 2) {
		inputwidth = fontsize * 5
	}
	
	dom.username.style.width = inputwidth + "px"
}

function events() {

	//main
	dom.username.onkeydown = function(e) {

		//backspace
		if (e.keyCode === 8) {
			setUserInputWidth(true)
		}

		//enter
		else if (e.keyCode === 13) {

			if (this.value === "") {
				resetPaste()
			} else {
				removeUserData(storage("local"))
				login()
			}
		}
		
		else setUserInputWidth()
	}

	dom.note.onkeydown = function() {
		typingWait(updateNote)
	}


	//settings
	dom.password.onkeypress = function(e) {
		password({event: true, e: e})
	}

	dom.background.oninput = function() {
		theme(this.value, true)
	}

	dom.zoom.onchange = function() {
		zoom(this.value, true)
	}

	dom.erase.onclick = function() {
		erase()
	}

	dom.toSettings.onclick = function() {
		dom.settings.className = (dom.settings.className !== "open" ? "open" : "")
	}
}

window.onload = function() {

	events()

	id("wrap").className = "loaded"
	isLoggedIn()

	//change mobile icon
	if (isMobile) id("toSettings").innerText = "☰"
}