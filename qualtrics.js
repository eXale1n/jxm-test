Qualtrics.SurveyEngine.addOnReady(function () {
	var qid = this.questionId;

	// read round type from embedded data
	var roundLabel = Qualtrics.SurveyEngine.getEmbeddedData("RoundType") || "positive";
	// map semantic round to numeric index
	var numericMap = { positive: 1, negative: 2, ambiguous: 3 };
	var displayRound = numericMap[roundLabel] || 1;

	console.log(">> Initialized Qualtrics script");
	console.log("   questionId:", qid);
	console.log("   roundLabel:", roundLabel, "| displayRound:", displayRound);

	// set a test field to confirm round assignment
	var testValue = "WORKING_" + Date.now();
	Qualtrics.SurveyEngine.setEmbeddedData("TestField_" + roundLabel, testValue);
	console.log("   setEmbeddedData: TestField_" + roundLabel, testValue);

	// pull valence string from embedded sequence (or empty fallback)
	var valence = Qualtrics.SurveyEngine.getEmbeddedData("Seq" + displayRound) || "";
	console.log("   pulled valence Seq" + displayRound + ":", valence);

	// initialize empty player/opponent fields if needed
	function initChatFields() {
		var playerField   = roundLabel;
		var opponentField = "opponent_" + roundLabel;
		if (Qualtrics.SurveyEngine.getEmbeddedData(playerField) == null) {
			Qualtrics.SurveyEngine.setEmbeddedData(playerField, "");
			console.log("   initialized player field:", playerField);
		}
		if (Qualtrics.SurveyEngine.getEmbeddedData(opponentField) == null) {
			Qualtrics.SurveyEngine.setEmbeddedData(opponentField, "");
			console.log("   initialized opponent field:", opponentField);
		}
	}
	initChatFields();

	// assign competition and mode randomly if not already set
	var competition = Qualtrics.SurveyEngine.getEmbeddedData("Competition");
	var mode        = Qualtrics.SurveyEngine.getEmbeddedData("GameMode");
	if (!competition) {
		var choices = [
			{ competition: "High", mode: "vs" },
			{ competition: "Low",  mode: "vs" }
		];
		var pick = choices[Math.floor(Math.random() * choices.length)];
		competition = pick.competition;
		mode        = pick.mode;
		Qualtrics.SurveyEngine.setEmbeddedData("Competition", competition);
		Qualtrics.SurveyEngine.setEmbeddedData("GameMode",    mode);
		console.log("   randomly assigned Competition/Mode:", competition, mode);
	} else {
		console.log("   existing Competition/Mode:", competition, mode);
	}

	// valence‐based messages per round
	var valenceMessages = {
		1: { win: "Thanks for Playing. That was Great!", loss: "Thanks for Playing. That was Great!", tie: "Thanks for Playing. That was Great!" },
		2: { win: "Lol, I beat you! you lost.",         loss: "Lol, I beat you! you lost.",         tie: "Lol, I beat you! you lost." },
		3: { win: "That was something.",                loss: "That was something.",                tie: "That was something." }
	};
	var msgs = valenceMessages[displayRound];
	console.log("   selected valence messages:", msgs);

	// construct iframe url with game settings
	var src = "https://jxmis0n.github.io/TetrisExperiment/"
		+ "?competition=" + encodeURIComponent(competition)
		+ "&valence="     + encodeURIComponent(valence)
		+ "&mode="        + encodeURIComponent(mode)
		+ "&round="       + encodeURIComponent(roundLabel)
		+ "&winMsg="      + encodeURIComponent(msgs.win)
		+ "&lossMsg="     + encodeURIComponent(msgs.loss)
		+ "&tieMsg="      + encodeURIComponent(msgs.tie);
	console.log("   iframe src:", src);

	// choose layout based on screen width
	var isMobile = window.innerWidth <= 480 ||
		/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	var style = isMobile
		? "font-family:sans-serif;width:315px;height:600px;overflow:hidden;margin:0 auto;"
		: "font-family:sans-serif;width:130vh;height:90vh;overflow:hidden;";

	// inject iframe into Qualtrics question
	var html = '<div style="' + style + '">'
		+ '<h3 style="font-size:1.2em;margin:4px 0;">'
		+ 'Round ' + roundLabel.charAt(0).toUpperCase() + roundLabel.slice(1)
		+ ' (' + competition + ' ' + (mode === "solo" ? "Solo" : "Competition") + ')'
		+ '</h3>'
		+ '<iframe src="' + src + '" '
		+ 'style="width:100%;height:calc(100% - 30px);border:0;" allowfullscreen>'
		+ '</iframe></div>';
	console.log("   injecting HTML:", html);
	jQuery("#" + qid + " .QuestionText").html(html);

	// handle chat messages from iframe and store them
	window.addEventListener("message", function (evt) {
		var d = evt.data;
		console.log("<< received postMessage:", d);
		if (!d || d.round !== roundLabel) {
			console.log("   ignored message for round:", d && d.round);
			return;
		}

		var field = (d.type === "chatResponse" ? roundLabel : "opponent_" + roundLabel);
		console.log("   storing embedded data:", field, "=", d.text);
		Qualtrics.SurveyEngine.setEmbeddedData(field, d.text);

		// auto-advance when player submits a chat response
		if (d.type === "chatResponse") {
			setTimeout(function () {
				console.log("   advancing to next question");
				jQuery("#NextButton").click();
			}, 100);
		}
	});
});
