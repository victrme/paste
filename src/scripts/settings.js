//alors j'ai mis theme() dans main.js donc voila

$(".day").click(function() {
	theme(false, "day")
});

$(".nit").click(function() {
	theme(false, "nit")
});


$(".min").click(function() {
	theme(false, "min")
});

function erase() {

	//envoie erase au serv, vide la note, efface le storage, retourne sur index

	function deleteAll() {

		let l = storage("local");
		toServer("lol", l.filename, "erase");

		$("#note").val("");
		$("#theme").attr("href", "");

		localStorage.removeItem("paste");
		sessionStorage.removeItem("paste");

		location.replace("index.html");
	}

	//juste une confirmation pour pas delete trop facilement

	var conf = false;

	$(".erase button.yes").click(() => {
		if (conf) {
			$(".erase h4").html("Erase From server");
			$(".erase button.yes").html("Erase");
			conf = false;
			deleteAll();
			
		} else {
			$(".erase h4").html("Are you sure ?");
			$(".erase button.yes").html("Yes");
			conf = true;
		}
	});

	$(".erase button.no").click(() => {
		conf = false;
		$(".erase h4").html("Erase From server");
		$(".erase button.yes").html("Erase");
	});
}

//ciao to paste
$(".gotopaste").click(() => {
	location.replace("index.html");
})

erase();
theme(true);