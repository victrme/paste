
const inputdom = document.getElementById('i_usr')
const areadom = document.getElementById('note')
const domPattern = document.getElementById('userPattern')
let inputstate = "user"

function events() {

  inputdom.onchange = function() {
    loginNote(this.value)
  }

  inputdom.onkeyup = function(e) {

    //back to username
    if (inputstate === "pin" && this.value === "" && e.which === 8) {
      inputStateChange("user")
      this.value = storage("username")
    }

    //validate with [entrée]
    else if (e.which === 13) {
      loginNote(this.value)
    }

    //remove current username
    else if (inputstate === "user" && this.value === "") {
      sessionStorage.removeItem("pin")
      storage("username", "")
      areadom.setAttribute("placeholder", "Type a username")
    }

  }

  areadom.onkeyup = function(e) {

    //when remove last character of paste
    if (this.value.length === 1 && e.which === 8)
      storage("note", "")

    //cap paste to 200 char
    else if (this.value.length < 200 && storage("username"))
      storage("note", encrypt(this.value))
  }
}

function loginNote(value) {

  const val = value ? value.toLowerCase() : ""
  if (val.length < 4) return false

  if (inputstate === "user") {

    if (storage("username") !== val)
      sessionStorage.removeItem("pin")

    //dom change
    inputStateChange("pin")
    userPattern(val)

    //data change
    storage("username", val)
    inputdom.value = ""

  }
  else if (inputstate === "pin") {

    let username = storage("username")

    //theres a previous pin
    if (storage('pin')) {

      //pin not corresponding, reset
      if (storage('pin') !== val) {
        inputdom.value = ''
        return false

      //pin corresponding, decrypt username
      } else {
        let dec = CryptoJS.AES.decrypt(atob(username), inputdom.value)
    		username = dec.toString(CryptoJS.enc.Utf8)
      }

    //no previous pin, pin encrypts username & save
    } else {
      let encryptedUsername = btoa(CryptoJS.AES.encrypt(username, inputdom.value).toString())
      storage("username", encryptedUsername)
    }

    //dom change
    inputStateChange("user")
    inputdom.value = username
    areadom.focus()


    //updates pin
    sessionStorage.pin = val

    //display note
    if (storage("note"))
      areadom.value = decrypt(storage("note"))
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

  areadom.setAttribute("placeholder", etat === "pin" ? "Waiting for pin" : "Write something here")

  inputstate = etat
}

function userPattern(value='') {
    const pattern = GeoPattern.generate(value).toDataUrl()
    sessionStorage.pattern = pattern
    domPattern.style.background = pattern
}

function storage(key, val) {

    //get full data
    if (!key && !val)
      return sessionStorage

    //get specific data
    if (key && val === undefined)
      return sessionStorage[key]

    //save secified data
    if (key && val !== undefined)
      sessionStorage[key] = val

}

function encrypt(message) {

	let time = Date.now()
	let key = CryptoJS.SHA3(storage("username") + time).toString()
	let encr = CryptoJS.AES.encrypt(message, key).toString()

	return time + "," + btoa(encr)
}

function decrypt(message) {

	//ajoute le random a la clé pour pouvoir déchiffrer
	let [time, note] = message.split(",");
	let key = CryptoJS.SHA3(storage("username") + time).toString();

	try {

		let dec = CryptoJS.AES.decrypt(atob(note), key)
		return dec.toString(CryptoJS.enc.Utf8)

	} catch(e) {

		//empeche d'envoyer un message d'erreur si le déchiffrage ne fonctionne pas
		//pour eviter un leak ou truc du genre jsp
		return false
	}
}

events()

//on startup
if (!storage("username")) {
  userPattern()
}
else if (storage("username")) {
  inputStateChange("pin")
  domPattern.style.background = storage('pattern')
  inputdom.focus()
}
