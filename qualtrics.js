Qualtrics.SurveyEngine.addOnReady(function () {
	var qid = this.questionId;

	// read semantic round from ED
	var roundLabel = Qualtrics.SurveyEngine.getEmbeddedData("RoundType") || "positive";

	// map to numeric only if you still need Seq1/2/3
	var numericMap = { positive: 1, negative: 2, ambiguous: 3 };
	var displayRound = numericMap[roundLabel] || 1;

	console.log(">> Qualtrics init:", { qid, roundLabel, displayRound });

	// test field
	var testValue = "WORKING_" + Date.now();
	Qualtrics.SurveyEngine.setEmbeddedData("TestField_" + roundLabel, testValue);
	console.log("   set TestField_" + roundLabel, testValue);

	// pull the raw valence (from Seq1/Seq2/Seq3)
	var valence = Qualtrics.SurveyEngine.getEmbeddedData("Seq" + displayRound) || "";
	console.log("   Seq" + displayRound + " →", valence);

	// ensure our two chat‐storage fields exist
	function initChatFields() {
		var pf = roundLabel,
			of = "opponent_" + roundLabel;
		if (Qualtrics.SurveyEngine.getEmbeddedData(pf) == null) {
			Qualtrics.SurveyEngine.setEmbeddedData(pf, "");
			console.log("   init player field:", pf);
		}
		if (Qualtrics.SurveyEngine.getEmbeddedData(of) == null) {
			Qualtrics.SurveyEngine.setEmbeddedData(of, "");
			console.log("   init opponent field:", of);
		}
	}
	initChatFields();

	// competition & mode
	var competition = Qualtrics.SurveyEngine.getEmbeddedData("Competition"),
		mode        = Qualtrics.SurveyEngine.getEmbeddedData("GameMode");
	if (!competition) {
		var pick = [{competition:"High",mode:"vs"},{competition:"Low",mode:"vs"}]
			[Math.floor(Math.random()*2)];
		competition = pick.competition;
		mode        = pick.mode;
		Qualtrics.SurveyEngine.setEmbeddedData("Competition", competition);
		Qualtrics.SurveyEngine.setEmbeddedData("GameMode",    mode);
		console.log("   new Competition/Mode:", competition, mode);
	}
	else console.log("   existing Competition/Mode:", competition, mode);

	// —— NEW: pull valence messages from ED instead of hardcoding ——
	var winMsg  = Qualtrics.SurveyEngine.getEmbeddedData("WinMsg_"  + roundLabel) || "";
	var lossMsg = Qualtrics.SurveyEngine.getEmbeddedData("LossMsg_" + roundLabel) || "";
	var tieMsg  = Qualtrics.SurveyEngine.getEmbeddedData("TieMsg_"  + roundLabel) || "";
	console.log("   pulled valence messages:", { winMsg, lossMsg, tieMsg });

	// build iframe URL
	var src = "https://exale1n.github.io/jxm-test"
		+ "?competition=" + encodeURIComponent(competition)
		+ "&valence="     + encodeURIComponent(valence)
		+ "&mode="        + encodeURIComponent(mode)
		+ "&round="       + encodeURIComponent(roundLabel)
		+ "&winMsg="      + encodeURIComponent(winMsg)
		+ "&lossMsg="     + encodeURIComponent(lossMsg)
		+ "&tieMsg="      + encodeURIComponent(tieMsg);
	console.log("   iframe src:", src);

	// layout style
	var isMobile = window.innerWidth <= 480 ||
		/Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/.test(navigator.userAgent);
	var style = isMobile
		? "font-family:sans-serif;width:100%;height:600px;overflow:hidden;margin:0 auto;"
		: "font-family:sans-serif;width:130vh;height:90vh;overflow:hidden;";

	// inject iframe
	var html = '<div style="' + style + '">'
		+ '<h3 style="font-size:1.2em;margin:4px 0;">'
		+ 'Round ' + roundLabel.charAt(0).toUpperCase() + roundLabel.slice(1)
		+ ' (' + competition + ' ' + (mode==="solo"?"Solo":"Competition") + ')'
		+ '</h3>'
		+ '<iframe src="' + src + '" style="width:100%;height:calc(100% - 30px);border:0;" allowfullscreen>'
		+ '</iframe></div>';
	console.log("   injecting HTML snippet");
	jQuery("#" + qid + " .QuestionText").html(html);

	// listen for chat messages
	window.addEventListener("message", function(evt) {
		var d = evt.data;
		console.log("<< postMessage received:", d);
		if (!d || d.round !== roundLabel) {
			console.log("   ignoring round:", d && d.round);
			return;
		}
		var field = (d.type==="chatResponse" ? roundLabel : "opponent_" + roundLabel);
		console.log("   saving embedded:", field, "=", d.text);
		Qualtrics.SurveyEngine.setEmbeddedData(field, d.text);

		if (d.type==="chatResponse") {
			console.log("   advancing question");
			setTimeout(function(){ jQuery("#NextButton").click() },100);
		}
	});
});
