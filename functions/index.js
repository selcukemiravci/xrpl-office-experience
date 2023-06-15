// Create the 30 images upload it to Pinada
// 
// Send the image to poap using infura  
// I need the API key for the POAP 
// And then send it to POAP

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const xrpl = require("xrpl");

admin.initializeApp();

exports.sendXRP = functions.https.onCall(async (data, context) => {
  const walletsRef = admin.firestore().collection("wallets");
  const timeNow = admin.firestore.Timestamp.now();
  const amountAlreadySent = 0;
  let docID;

  // First check that we haven't sent XRP in the last 2 min
  const lastSend = await walletsRef.orderBy("last_send", "desc").limit(1).get();
  const latestDoc = lastSend.docs[0].data();
  const latestDocSecs = latestDoc.last_send._seconds;
  console.log("most recent date = " + latestDocSecs);

  if (timeNow.seconds < latestDocSecs + (5 * 60)) {
    const errorMsg = "Insufficient time has passed since the " +
      "last send, try again in 5 minutes";
    console.log(errorMsg);

    throw new functions.https.HttpsError(
        "cancelled",
        errorMsg,
    );
  }

  // Second check if the wallet has already been sent XRP
  const debug = " ";
  const result = await walletsRef.where("address", "==", data.address).get();

  // If the address does not exist lets add it and record the time
  if (result.empty) {
    console.log("Good news! No matching address found");
  } else if (result.docs.length > 1 ) {
    console.log("more than one address match error");
    throw new functions.https.HttpsError(
        "cancelled",
        "More than one record matches the address provided",
    );
  } else {
    console.log("A matching address found");
    throw new functions.https.HttpsError(
        "cancelled",
        "This address was already sent XRP",
    );
  }

  const client = new xrpl.Client("wss://xrplcluster.com");
  await client.connect();

  const wallet = xrpl.Wallet.fromSeed("<your event wallet's seed>");

  // Check the balance first of the funding wallet
  try {
    const xrplResponse = await client.request({
      command: "account_info",
      account: wallet.address,
      ledger_index: "validated",
    });

    const xrpBalance = xrpl.dropsToXrp(
        xrplResponse.result.account_data.Balance);
    console.log("Funding wallet XRP = " + xrpBalance);

    if (xrpBalance < 30) {
      throw new functions.https.HttpsError(
          "cancelled",
          "Funding wallet needs more funds. See staff.",
      );
    }
  } catch (error) {
    console.log(error);
    throw new functions.https.HttpsError(
        "cancelled",
        "Something is wrong with the funding wallet. See staff.",
    );
  }

  // Send the XRP
  try {
    // Send the XRP
    const prepared = await client.autofill({
      "TransactionType": "Payment",
      "Account": wallet.address,
      "Amount": xrpl.xrpToDrops(15),
      "Destination": data.address,
    });

    const signed = wallet.sign(prepared);
    await client.submitAndWait(signed.tx_blob);

    console.log("Sending at Upsert");
    const upsert = {
      address: data.address,
      xrp_sent: amountAlreadySent + 15,
      last_send: timeNow,
    };

    if (docID) { // properly inserted into the dataset
      await walletsRef.doc(docID).set(upsert);
    } else {
      await walletsRef.doc().set(upsert);
    }
  } catch (error) {
    console.log("error: " + error + " address: " + wallet.address);
  }

  return data.address + " debug = " + debug;
});


// ***********************************
//
// Claim NFT
//
// ***********************************
exports.claimNFT = functions.https.onCall(async (data, context) => {
  const taxonid = data.taxonid;
  const wallet = xrpl.Wallet.fromSeed("<your event wallet's seed>");

  const client = new xrpl.Client("wss://xrplcluster.com");
  await client.connect();

  // First check if they have it already in that week's collection
  console.log("address = " + data.address);
  const hasNfts = await client.request({
    method: "account_nfts",
    account: data.address,
  });

  const nftArray = hasNfts.result.account_nfts;
  if (nftArray.length > 0) {
    // Check each nft
    nftArray.forEach( (nft) => {
      if (nft.Issuer == wallet.address && nft.NFTokenTaxon == taxonid) { // check if they already have our NFT minted
        throw new functions.https.HttpsError(
            "cancelled",
            "You have already claimed this NFT",
        );
      }
    });
  }

  // Find an NFT with no existing offers
  const nfts = await client.request({
    method: "account_nfts",
    account: wallet.address,
    limit: 400,
  });

  // Filter the array to just a particular taxon
  const filteredNFTs = nfts.result.account_nfts.
      filter((obj) => obj.NFTokenTaxon == taxonid);
  console.log("Filtered NFTs = " + JSON.stringify(filteredNFTs));

  // Go through the event wallet's NFTs
  // First looking for the those with the correct taxonid
  const findNoOffers = function(taxonID) { // Randomization happen
    return new Promise((resolve) => {
      console.log("\n\n*** NFT count = " +
      filteredNFTs.length + "\n\n");
      filteredNFTs.forEach(async (nft, i) => { // Get the length of the filtered NFTs value, and randomly start picking numbers. Get a specific number to check.
        console.log("Checking NFT for offers: " +
          nft.NFTokenID + " i = " + i);
        if (nft.NFTokenTaxon != taxonID) {
          console.log("incorrect taxon: nft taxonid = " +
            nft.NFTokenTaxon + " taxonID =  " + taxonID); // Legacy Code 
          if (i == filteredNFTs.length - 1 ) resolve(0);
        } else {
          console.log("correct taxon!!: nft taxonid = " +
            nft.NFTokenTaxon + " taxonID =  " + taxonID);

          // Find any sell offers
          let nftSellOffers;
          try {
            nftSellOffers = await client.request({
              method: "nft_sell_offers",
              nft_id: nft.NFTokenID});
          } catch (err) {
            nftSellOffers = "No sell offers.";
            console.log("No sell offers on " + nft.NFTokenID);

            // Resolve when we've found one NFT with no offers
            resolve(nft.NFTokenID); // Get out of the function
          }
          let results = "***Sell Offers***\n";
          results += JSON.stringify(nftSellOffers, null, 2);
          console.log(results + "\n");

          // Resolve if every NFT has a sell offer
          if (i == filteredNFTs.length - 1) resolve(0); // No available ones
        }
      });
    });
  };

  const foundNFTToSell = await findNoOffers(taxonid);
  if (!foundNFTToSell) {
    console.log("nothing to sell");
    throw new functions.https.HttpsError(
        "cancelled",
        "Sorry, there are no NFTs left. See staff.",
    );
  }

  console.log("\n\n*** Found NFT to sell = " + foundNFTToSell);

  const now = new Date();
  const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);
  console.log("tenMinutesLater = " + tenMinutesLater.toLocaleTimeString());

  const transactionBlob = {
    "TransactionType": "NFTokenCreateOffer",
    "Account": wallet.address,
    "Destination": data.address,
    "NFTokenID": foundNFTToSell,
    "Amount": "0",
    "Flags": 1,
    "Expiration": xrpl.isoTimeToRippleTime(tenMinutesLater),
  };

  await client.submitAndWait(transactionBlob, {wallet: wallet});

  // Verify a sell offer was created
  // Return the offer index
  let nftSellOffers;
  try {
    nftSellOffers = await client.request({
      method: "nft_sell_offers",
      nft_id: foundNFTToSell});
  } catch (err) {
    nftSellOffers = "No sell offers.";

    throw new functions.https.HttpsError(
        "cancelled",
        "Sorry, there was an error creating your offer. See staff.",
    );
  }
  let resultsOffers = "\n\n***Sell Offers***\n";
  resultsOffers += JSON.stringify(nftSellOffers, null, 2);
  console.log(resultsOffers);

  nftSellOffers.result.offers.forEach( (offer) => {
    if ( offer.flags == 1 ) {
      console.log("*** offer index = " + offer.nft_offer_index);
    }
  });
});
