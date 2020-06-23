<?php

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST["token"])) {

    // Build POST request:
    $recaptcha_url = 'https://www.google.com/recaptcha/api/siteverify';
    $recaptcha_secret = '6LfukagZAAAAABcNEhjzlGk53OHrOZnzjmotALxd';
    $recaptcha_response = htmlspecialchars($_POST["token"]);

    // Make and decode POST request:
    $recaptcha = file_get_contents($recaptcha_url . '?secret=' . $recaptcha_secret . '&response=' . $recaptcha_response);
    $recaptcha = json_decode($recaptcha);

    //Take action based on the score returned:
    if ($recaptcha->score >= 0.7) {
        echo "not a bot";
    }
}
?>