##XRPL Experience - Claim your NFT

This is a Firebase Cloud Function and a corresponding front-end website for an Interactive XRPL Office Learning Experience that enables users to claim a weekly NFT and get a chance to win a $20 gift card. The backend is handled by Firebase Cloud Functions while the frontend is simple HTML/CSS/JS.

Prerequisites
A Firebase project with Firebase Cloud Functions and Firestore set up
A XUMM application created at https://apps.xumm.dev
An XRPL Testnet account (can be created here)
Node.js and npm installed locally
The Firebase CLI installed locally (npm install -g firebase-tools)
How to use
Clone this repository to your local machine.

Navigate into the function folder (cd functions) and install the necessary node modules by running npm install.

In the index.js file in the functions folder, replace <your event wallet's seed> with your XRPL Testnet account's secret.

Replace <your XUMM API key> with your XUMM application's API key in the index.html file.

Use Firebase CLI to deploy your functions and your site. Run firebase deploy --only functions,hosting.

Go to the URL provided by Firebase Hosting and interact with the site. Users can enter their XRPL Testnet account's address, and then they can click the button to claim their weekly NFT.

Functionality
The Firebase Cloud Function first checks if the user has already claimed an NFT within the same week. If not, the function proceeds to look for an NFT with no existing offers in the event's XRPL account's NFT collection. If an NFT is found, the function creates a sell offer for the NFT, offering it to the user's XRPL account for free. The offer is set to expire in 10 minutes.

The frontend website allows the user to enter their XRPL Testnet account's address. When they click the "Claim NFT" button, the Firebase Cloud Function is called. If the function successfully creates the sell offer, the user is then redirected to the XRPL's documentation on how to accept the offer and claim their NFT.

Notes
The application does not handle the case where the user does not accept the sell offer within the 10-minute window. The function also does not retry if it fails to create the sell offer. You may need to implement these features yourself.

This project was built for educational purposes and may not be ready for production use.

Support
If you are having issues, please let us know.
We have a mailing list located at: john@example.com

License
The project is licensed under the XYZ license.