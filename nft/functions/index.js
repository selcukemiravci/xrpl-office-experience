// Create the 30 images upload it to Pinada
// Send the image to poap using infura
// I need the API key for the POAP
// And then send it to POAP

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const xrpl = require("xrpl");

admin.initializeApp();


exports.claimNFT = functions.https.onCall(async (data, context) => {
  const taxonid = data.taxonid;
  const wallet = xrpl.Wallet.fromSeed("sEdSSHPhkcuxY8bvbJoC58pWfUgNLkm");

  const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233/");
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
      if (nft.Issuer == wallet.address && nft.NFTokenTaxon == taxonid) {
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
      filteredNFTs.forEach(async (nft, i) => {
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