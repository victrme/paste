

const inputdom = document.getElementById('i_usr')
const areadom = document.getElementById('note')
const domPattern = document.getElementById('userPattern')
let inputstate = "user" //user - pin - (loggedin ?)
let notestate = "empty" //empty - writing - ready - saved

function events() {

  inputdom.onchange = function() {

    const val = this.value ? this.value.toLowerCase() : ""
    if (val.length < 4) return false

    if (inputstate === "user") {

      if (data("username") !== val)
        sessionStorage.removeItem("pin")

      //dom change
      inputStateChange("pin")
      areadom.setAttribute("placeholder", "Waiting for pin")
      userPattern(val)

      //data change
      data("username", val)
      inputdom.value = ""
      inputstate = "pin"

    }
    else if (inputstate === "pin") {

      if (sessionStorage.pin) {
        if (sessionStorage.pin !== val) {
          inputdom.value = ""
          return false
        }
      }

      //dom change
      inputStateChange("user")
      areadom.focus()
      areadom.setAttribute("placeholder", "Write something here")

      //data change
      inputdom.value = data("username")
      sessionStorage.pin = val
      inputstate = "user"
    }
  }

  areadom.onkeyup = function(e) {

    if (this.value.length === 0) data("note", "")
    else if (this.value.length < 200) data("note", encrypt(this.value))
  }
}

function inputStateChange(etat) {

  //pin & user attributes
  let attributes = {
    pin: {
      name: "pin",
      placeholder: "PIN",
      type: "password",
      //pattern: "[0-9]*",
      inputmode: "numeric"
    },
    user: {
      name: "username",
      placeholder: "username",
      type: "text",
      //pattern: "",
      inputmode: "text"
    }
  }

  //apply all inputs attributes
  for (let a in attributes[etat])
    inputdom.setAttribute(a, attributes[etat][a])
}

function userPattern(value='') {
  const pattern = GeoPattern.generate(value)
  domPattern.style.background = pattern.toDataUrl()
}

function data(key, val) {

  let data = {}

  if (sessionStorage.data === undefined)
    data = {username: "", note: ""}
  else
    data = JSON.parse(sessionStorage.data)

    //get full data
    if (!key && !val)
      return data

    //get specific data
    if (key && val === undefined)
      return data[key]

    //save secified data
    if (key && val !== undefined) {
      data[key] = val
      sessionStorage.data = JSON.stringify(data)
    }
}

function encrypt(message) {

  const user = CryptoJS.SHA3(data("username")).toString()

	//ran: calcul bien trop compliqué pour pas grand chose, sert d'IV à la clé d'encryption
	//ajoute ran au hash user pour que le message soit toujours encrypté avec une clé differente
	//encrypte avec le hash de ran + user, rajoute ran au debut du message encrypté
	//ran peut être découvert, il randomise seulement un peu plus l'encryption

	let time = Date.now()
	let key = CryptoJS.SHA3(user + time).toString()
	let encr = CryptoJS.AES.encrypt(message, key).toString()

	return time + "," + btoa(encr)
}

function decrypt(message) {

	const user = data("username")

	//ajoute le random a la clé pour pouvoir déchiffrer
	let [time, note] = message.split(",");
	let key = CryptoJS.SHA3(user + time).toString();

	try {

		let dec = CryptoJS.AES.decrypt(atob(note), key);
		return dec.toString(CryptoJS.enc.Utf8)

	} catch(e) {

		//empeche d'envoyer un message d'erreur si le déchiffrage ne fonctionne pas
		//pour eviter un leak ou truc du genre jsp
		return false
	}
}

events()

//on startup
if (!data("username")) {
  userPattern()
}
else if (data("username")) {
  inputstate = "pin"
  inputStateChange("pin")
  inputdom.focus()
  areadom.setAttribute("placeholder", "Waiting for pin")
  userPattern(data("username"))
}
