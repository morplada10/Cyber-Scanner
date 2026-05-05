# Cyber Scanner - Gmail Malicious Email Scorer

A security-focused Gmail Add-on that analyzes incoming emails to detect potential phishing and malicious content. This project provides users with a risk score, a verdict (Safe/Warning/Danger), and a detailed breakdown of the detected threats.

## Architecture (How it works)
The system is built of three main components that work together in real-time:
*   **Frontend (Google Apps Script):** This part lives inside your Gmail. It "wakes up" when you open an email, take the sender's information and the message body, and sends it for analysis.
*   **Backend (Python/Flask):** This is where the processing happens. Our Python script analyzes the text against security rules and decides if the email is dangerous, suspicious, or safe.
*   **Tunneling (ngrok):** Connects the local backend to the Google cloud environment for real-time analysis. Since the Python code runs on a local machine and Google is in the cloud, they can't talk directly. Ngrok creates a secure tunnel so Google can safely send data to the local server and get an answer instantly.

## Security Logic
The scanner evaluates several "Red Flags" to determine the risk:
*   **Impersonation Detection:** Checks if the sender name uses security-related terms without a verified domain (e.g., "Google Security" from a non-google email).
*   **Keyword Analysis:** Scans for high-pressure and phishing-related terms like *Urgent, Credit Card, Password,* and *Frozen*.
*   **Combined Signals:** Assigns a higher risk (Danger) if suspicious keywords are found alongside external links (`http/www`).
*   **Timing Analysis:** Flags emails processed during "suspicious" late-night hours (00:00 - 05:00).

## 📊 Scoring Logic (The Decision Making)
I designed a weighted scoring system to evaluate risk based on specific signals:
*   **The "Red Flag" (75 Points):** If an email contains both a high-pressure keyword (like "immediately" or "verify now") AND a link, it's flagged as **Dangerous**. This is because the combination of urgency and a call-to-action is a classic phishing tactic.
*   **Suspicious(60 Points):** If the system finds 3 or more suspicious keywords even without a link, it's flagged as **Suspicious**. Multiple red flags indicate a high probability of a scam.
*   **Suspicious (40 Points):** If a sender uses a name like "Security" but the email domain isn't from a trusted source (like Google), it triggers an impersonation warning.
*   **The "Timing Factor" (+10 Points):** Emails processed during late-night hours (00:00 - 05:00) get a small penalty, as many automated attacks occur during off-hours.

## Tech Stack
*   **Language:** Python 3.x, JavaScript (Google Apps Script)
*   **Framework:** Flask
*   **APIs & Tools:** Gmail Add-on API, ngrok

## How to Run
1.  **Start Backend:** Run `python backend/app.py`.
2.  **Start Tunnel:** Run `ngrok http 5000`.
3.  **Deploy Add-on:** Update the ngrok URL in `Code.gs` and deploy via the Google Apps Script editor.

## Design Decisions (Why I built it this way)
* **Simple Rules over AI:** For this version, I chose to use clear security rules instead of an AI model. I wanted the user to understand exactly why an email was flagged, and since AI can sometimes make mistakes or be hard to explain, a rule-based engine felt more reliable for a security tool.
* **Handling "Dirty" Data:** I assumed that attackers would try to trick the system by using weird capitalization (like "uRgEnT"). To fix this, the backend automatically converts all text to lowercase before checking it, making the scanner much harder to bypass.
* **Safety First:** My scoring logic is designed to be strict. If an email has both a "stressful" keyword and a link, it immediately gets a high risk score because that is the most common way phishing works.

## 📈 Future Improvements
With more time, I would implement:
*   **URL Reputation:** Integration with APIs like VirusTotal to check if links lead to known malicious sites.
*   **LLM Integration (AI):** Instead of relying on a fixed list of keywords, I would integrate a Large Language Model (like Gemini). This would allow the system to understand the intent and content of the email and recognize suspicious patterns and thousands of "danger words" automatically, even if they aren't on my manual list.
*   **Sender Authentication:** Adding digital validation to confirm the email actually came from the real sender and wasn't faked or changed along the way.