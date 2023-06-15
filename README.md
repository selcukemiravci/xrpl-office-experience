The code used for the QR experience at XRPL Zone in Austin

There are two parts
1. Activate wallet by scanning a QR code which sends XRP to the scanner's wallet
2. Send the scanner a sell offer for an NFT

This code was uploaded to Google Firebase and relies on Xumm's API.

Firestore requirements
The send xrp function requires a datastore collection named wallets to keep track of who has already been sent XRP. Otherwise users would be able to keep scanning and drain the wallets. The documents in this collection have the format below.

```
address: "rLkunnNFiGTESTWRVA7LAqn1Gw9s1"
last_send: April 27, 2023 at 1:22:02 PM UTC-4
xrp_sent: 15
```

QR code requirements
You'll need to generate your own QR codes that point to
```
public/index.html
public/index-nft.html
```

I used this one `https://www.the-qrcode-generator.com/`
