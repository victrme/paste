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

function settings(option, newVal) {

	function erase() {
		//envoie erase au serv, vide la note, efface le storage, retourne sur index

		function deleteAll() {

			let l = storage("local");
			toServer("lol", l.filename, "erase");

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

			//doesnt apply colors that can't be contrasted properly
			if (textColor) {
				document.body.style.background = (val.indexOf("#") === -1 ? "#" + val : val);
                document.body.style.color = textColor;
                id("background").value = val;
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
            id("zoom").value = l.zoom;
			document.body.style.zoom = val;
		}
	}

	let conf = false, confTimer = 0;

	if (option === "theme") {
        theme(newVal)
    }
    else if (option === "zoom") {
        zoom(newVal)
    }
    else { //c'est init

        id("background").oninput = function () {
            theme(this.value, true)
        }
    
        id("zoom").oninput = function () {
            zoom(this.value, true)
        }
    
    
        id('erase').onclick = function () {
            erase()
        }
    
        id('toSettings').onclick = function () {
            //idk felt sexy, might delete later
            const dom = id('settings')
            dom.className = (dom.className !== "open" ? "open" : "")
        }

        id("connected").className = "loaded"
    }
}

const id = elem => document.getElementById(elem)