/**
 This function runs automatically whenever you open an email in Gmail.
 It grabs the email details and sends them to our Python server for a check.
 */
function onGmailMessageOpen(e) {
  // Get the ID of the opened message
  var messageId = e.gmail.messageId;
  var message = GmailApp.getMessageById(messageId);
  
  // Extract the sender's address and the actual text of the email
  var sender = message.getFrom();
  var content = message.getPlainBody();
  
  // This is the "bridge" to our Python server (via ngrok)
  var url = 'https://fencing-pulp-aspect.ngrok-free.dev/scan'; 
  
  // Setting up the request: telling the server we're sending JSON and sharing the email data
  var options = {
    "method": "post",
    "contentType": "application/json",
    "headers": {
      "ngrok-skip-browser-warning": "69420" // This header bypasses the ngrok welcome page
    },
    "payload": JSON.stringify({
      "sender": sender,
      "content": content
    })
  };
  
  try {
    // Send the data and wait for the Python server to give us a score
    var response = UrlFetchApp.fetch(url, options);
    var result = JSON.parse(response.getContentText());
    
    // Once we have the result, build the UI card to show the user
    return createResultCard(result);
  } catch (err) {
    // If the server is down or ngrok isn't running, show an error message instead
    return CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader().setTitle("Connection Error"))
      .addSection(CardService.newCardSection().addWidget(
        CardService.newTextParagraph().setText("Error: Could not connect to the Python server.")))
      .build();
  }
}

/**
 This function takes the results from our Python server and turns them into a visual card in Gmail.
 */
function createResultCard(result) {
  var section = CardService.newCardSection();
  
  var score = result.score; 
  var statusText = "";
  var iconUrl = "";

  // Decide on the color, text, and icon based on the risk score
  if (score >= 70) {
    statusText = "<font color=\"#EA4335\">DANGER: High Risk</font>";
    iconUrl = "https://www.gstatic.com/images/icons/material/system/1x/report_problem_black_24dp.png";
  } else if (score >= 40) {
    statusText = "<font color=\"#FBBC04\">WARNING: Medium Risk</font>";
    iconUrl = "https://www.gstatic.com/images/icons/material/system/1x/warning_black_24dp.png";
  } else {
    statusText = "<font color=\"#34A853\">SAFE: Low Risk</font>";
    iconUrl = "https://www.gstatic.com/images/icons/material/system/1x/verified_user_black_24dp.png";
  }

  // Build the first part of the UI showing the status and the score
  section.addWidget(CardService.newDecoratedText()
    .setTopLabel("Security Status")
    .setText(statusText)
    .setStartIcon(CardService.newIconImage().setIconUrl(iconUrl)));
    
  section.addWidget(CardService.newTextParagraph()
    .setText("<b>Risk Score:</b> " + score + "/100"));

  // Format the reasons we got from the server into a nice bulleted list
  var analysisText = "";
  if (Array.isArray(result.reasons)) {
    analysisText = result.reasons.join("<br>• "); 
  } else {
    analysisText = result.reasons || "No details provided";
  }

  // Add the detailed analysis text to the card
  section.addWidget(CardService.newTextParagraph()
    .setText("<b>Analysis:</b><br>• " + analysisText));

  // Wrap everything up in a neat card with a header
  var card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle("Cyber Scanner")
      .setSubtitle("AI-Powered Email Security"))
    .addSection(section)
    .build();
    
  return card;
}