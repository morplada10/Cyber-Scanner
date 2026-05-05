from flask import Flask, request, jsonify
from datetime import datetime

app = Flask(__name__)

# The logic to figure out if an email is "bad"/"dangerous"
def analyze_email_logic(sender, content):
    score = 0
    reasons = []

    # Checking if the sender claims to be "security" but isn't actually from a Google domain
    if "security" in sender.lower() and "google" not in sender.lower():
        score += 40
        reasons.append("Potential impersonation: 'security' name without google.com domain")

    # A list of "red flag" words that make us suspicious
    urgency_keywords = [
        'urgent', 'immediately', 'action required', 'suspended', 'verify now', 
        'important', 'legal action', 'credit card', 'payment'
        'bank', 'password', 'login', 'tax evasion', 'frozen'
    ]
    # We turn everything to lowercase so hackers can't trick us with weird casing (like UrGeNt)
    content_lower = content.lower()
    # Checking which suspicious words from our list actually show up in the email
    found_keywords = [word for word in urgency_keywords if word in content_lower]
    has_urgency = len(found_keywords) > 0
    # Looking for any links (http or www) inside the message
    has_links = "http" in content_lower or "www." in content_lower

    # Scoring Logic:
    # If there are scary words AND a link, that's a huge red flag (75 points)
    if has_urgency and has_links:
        score += 75 
        reasons.append(f"High Risk: Suspicious keywords {found_keywords} combined with links")
    # If we find at least 3 suspicious words, it's still fishy even without a link (60 points)
    elif len(found_keywords) >= 3:
        score += 60
        reasons.append(f"Multiple suspicious keywords detected: {found_keywords}")
    # If there's just one or two words, we give a small warning (20 points)
    elif has_urgency:
        score += 20
        reasons.append(f"Suspicious language detected: {found_keywords}")

    # Checking if the email was sent late at night (00:00 to 05:00) - a common time for attacks
    current_hour = datetime.now().hour
    if 0 <= current_hour <= 5:
        score += 10
        reasons.append(f"Suspicious timing: Email processed at {current_hour}:00")

    # Return the final score (capped at 100) and the reasons why we gave it
    return min(score, 100), reasons

# The "front door" of our backend that the Google Add-on talks to
@app.route('/scan', methods=['POST'])
def scan_endpoint():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
        
    # Grabbing the sender and content from the email data we received
    sender = data.get('sender', 'Unknown')
    content = data.get('content', '')
    
    # Run the logic we built above
    final_score, reasons = analyze_email_logic(sender, content)
    
    # Decide on the final verdict based on the total score
    if final_score >= 70:
        verdict = "Dangerous"
    elif final_score >= 30:
        verdict = "Suspicious"
    else:
        verdict = "Safe"

    # Send back a clean response that Google can easily understand
    return jsonify({
        "score": final_score,
        "verdict": verdict,
        "reasons": reasons,
        "analyzed_at": datetime.now().isoformat()
    })

if __name__ == '__main__':
    # Start the server on port 5000
    app.run(port=5000, debug=True)