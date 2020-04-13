

const inputdom = document.getElementById('i_usr')
const areadom = document.getElementById('note')
const domPattern = document.getElementById('userPattern')
let inputstate = "user"
let savedUsername = ""

function events() {

  inputdom.onchange = function() {

    //pin & user attributes
    let attrs = {
      user: {
        placeholder: "PIN",
        type: "password",
        newState: "pin"
      },
      pin: {
        placeholder: "username",
        type: "text",
        newState: "user"
      }
    }

    //display control
    inputdom.setAttribute("placeholder", attrs[inputstate].placeholder)
    inputdom.setAttribute("type", attrs[inputstate].type)

    //value control
    if (inputstate === "user") {

      savedUsername = inputdom.value
      inputdom.value = ""

    } else {

      //shows username, focuses to paste
      inputdom.value = savedUsername
      areadom.focus()
    }


    //change input state
    inputstate = attrs[inputstate].newState
  }

  domPattern.onmouseenter = function() {
    this.style.animation = "pattern 2s ease-in-out"
  }

  domPattern.onmouseleave = function() {
    this.style.animation = ""
  }
}

function userPattern() {
  const pattern = GeoPattern.generate('')
  domPattern.style.background = pattern.toDataUrl()
}



events()
userPattern()
