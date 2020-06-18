
function erase() {

	//envoie erase au serv, vide la note, efface le storage, retourne sur index

	function deleteAll() {

		let l = storage("local");
		toServer("lol", l.filename, "erase");

		localStorage.removeItem("paste");
		sessionStorage.removeItem("paste");

		location.replace("index.html");
	}

	let conf = false, confTimer = 0

	id('erase').onclick = function() {

		if (conf) {
			clearTimeout(confTimer)
			id('erase').innerText = "Erase from server"
			conf = false
			deleteAll()
			
		} else {
			id('erase').innerText = "Are you sure ?"
			conf = true
			confTimer = setTimeout(function() {
				id('erase').innerText = "Erase from server"
				conf = false
			}, 2000)
		}
	}
}

id("day").onclick = function() {
	theme(false, "day")
}

id("nit").onclick = function() {
	theme(false, "nit")
}

//ciao to paste
id("gotopaste").onclick = function() {
	location.replace("index.html")
}

erase()
theme(true)