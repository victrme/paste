

const inputdom = document.getElementById('i_usr')
const areadom = document.getElementById('note')
const domPattern = document.getElementById('userPattern')
let inputstate = "user"

function events() {

  inputdom.onchange = inputStateChange

  areadom.onkeyup = function(e) {
    data("note", this.value)

    if (this.value.length === 0) {
      alert('empty note')
    }
  }
}

function inputStateChange() {
  //pin & user attributes
  const val = this.value.toLowerCase()
  let attrs = {
    user: {
      placeholder: "PIN",
      type: "password",
      pattern: "[0-9]*",
      inputmode: "numeric",
      newState: "pin"
    },
    pin: {
      placeholder: "username",
      type: "text",
      pattern: "[A-Za-z]*",
      inputmode: "text",
      newState: "user"
    }
  }

  if (val.length > 3) {

    //apply all inputs attributes
    for (let attr in attrs[inputstate]) {
      inputdom.setAttribute(attr, attrs[inputstate][attr])
    }

    //value control
    if (inputstate === "user") {

      userPattern(val)
      data("username", val)
      this.value = ""
      areadom.setAttribute("placeholder", "Waiting for pin")

    } else {

      //shows username, focuses to paste
      data("pin", val)
      this.value = data("username")
      areadom.focus()
      areadom.setAttribute("placeholder", "Write something here")
    }

    //toggle input state
    inputstate = attrs[inputstate].newState
  }
}

function userPattern(value='') {
  const pattern = GeoPattern.generate(value)
  domPattern.style.background = pattern.toDataUrl()
}

function data(key, val) {

  let data = sessionStorage.data === undefined ? {
      username: "",
      pin: "",
      note: ""
    }
    : JSON.parse(sessionStorage.data)

    if (!key && !data)
      return data

    if (key && !val)
      return data[key]

    if (key && val) {
      data[key] = val
      sessionStorage.data = JSON.stringify(data)
    }
}

function encrypt(message) {

  const user = data("username")
	const pin = data("pin")

	//ran: calcul bien trop compliqué pour pas grand chose, sert d'IV à la clé d'encryption
	//ajoute ran au hash user pour que le message soit toujours encrypté avec une clé differente
	//encrypte avec le hash de ran + user, rajoute ran au debut du message encrypté
	//ran peut être découvert, il randomise seulement un peu plus l'encryption

	let ran = (Math.floor((Math.random() + 1) * Math.pow(10, 15))).toString();
	let key = CryptoJS.SHA3(user + pin + ran).toString();
	let encr = CryptoJS.AES.encrypt(message, key).toString();

	let full = ran + ",000000," + btoa(encr);

	return full;
}

function decrypt(message) {

	const user = data("username")
	const pin = data("pin")

	//ajoute le random a la clé pour pouvoir déchiffrer
	let [ran, note] = message.split(",000000,");
	let key = CryptoJS.SHA3(user + pin + ran).toString();

	try {

		let dec = CryptoJS.AES.decrypt(atob(note), key);
		return dec.toString(CryptoJS.enc.Utf8)

	} catch(e) {

		//empeche d'envoyer un message d'erreur si le déchiffrage ne fonctionne pas
		//pour eviter un leak ou truc du genre jsp
		return console.log("alors");
	}
}

events()
userPattern()

if (data("username")) {
  inputdom.value = data("username")
  userPattern(data("username"))
  areadom.focus()
}
