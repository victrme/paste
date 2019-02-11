<?php

	$data = $_POST["data"];
	$fnam = $_POST["fnam"];
	$func = $_POST["func"];

	if ($func === "test") {
		echo "Ca Fonctionne !";
	}

	$fileName = "pastes/" . $fnam . ".txt";

	if ($func === "send") {
		if ($data != null) {
			$file = fopen($fileName, "w+") or die("Unable to open file!");
			fwrite($file, $data);
			fclose($file);
		}

		echo "Data: " . $data . "\nUser: " . $fnam;

	}

	if ($func === "read") {

		$file = fopen($fileName, "r") or die("");

		$content = fread($file, filesize($fileName));
		echo $content;
		fclose($file);
	}
	
	if ($func === "erase") {

		if (file_exists($fileName)) {
			unlink($fileName);
			echo $fileName . " deleted !";
		} else {
			echo $fileName . " wasn't found !";
		}
		
	}

	
?>