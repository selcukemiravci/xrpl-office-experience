# 🏢 XRPL Office Experience: Activate & Claim!

Join our XRPL Office Experience, specifically designed for our workforce. Activate your wallets with XRP and claim exclusive Office POAP NFTs for a chance to win gift cards.

## 📜 Table of Contents
- [📖 Description](#Description)
- [🔧 Prerequisites](#Prerequisites)
- [🚀 Installation & Usage](#installation)
- [📚 Functionality](#Functionality)
- [❗ Notes](#Notes)

<a name="Description"></a>
## 📖 Description
Dive into our Interactive XRPL Office Learning Experience, utilizing Firebase Cloud and an associated front-end website. Engage weekly to claim an NFT and stand a chance to win a $20 gift card. The magic happens with Firebase Cloud Functions for the backend, while the frontend dances in HTML/CSS/JS.

<a name="Prerequisites"></a>
## 🔧 Prerequisites
- Firebase project armed with Firebase Cloud Functions and Firestore.
- XUMM application from [here](https://apps.xumm.dev).
- An XRPL Testnet account. Need one? [Create here](#).
- Node.js and npm, ready on your local machine.
- Firebase CLI installed locally via `npm install -g firebase-tools`.

<a name="installation"></a>
## 🚀 Installation & Usage

1. Clone this repository locally.
2. Dive into the function directory: `cd functions`.
3. Install necessary node modules: `npm install`.
4. In `index.js` (within functions), replace `<your event wallet's seed>` with your XRPL Testnet account secret.
5. In `index.html`, swap `<your XUMM API key>` with your XUMM application API key.
6. Deploy via Firebase CLI: `firebase deploy --only functions,hosting`.
7. Visit the Firebase Hosting URL and enjoy the site! Users pop in their XRPL Testnet account's address and hit the claim button for their weekly NFT.

<a name="Functionality"></a>
## 📚 Functionality

Our Firebase Cloud Function starts by verifying the user's NFT claim within the week. Upon green signals, it hunts for an unclaimed NFT in the event's XRPL account collection. Discovering an NFT, a sell offer is crafted for the user's XRPL account – all free of charge and available for 10 minutes.

The frontend lets users input their XRPL Testnet account address. Tapping "Claim NFT" activates the Firebase Cloud Function. Successful offer creation redirects users to XRPL documentation, guiding them to accept the offer and cherish their NFT.

<a name="Notes"></a>
## ❗ Notes

- Keep in mind, the application doesn't cater to users bypassing the 10-minute claim window nor retries offer creations upon failures. Tailoring these features requires a hands-on approach.
- Crafted for learning; might require refinements for a production environment.
- For the splendid XRPL Zone experience in Austin: QR codes were employed for wallet activation and NFT offers. The setup was hosted on Google Firebase, with Xumm's API under the hood.
