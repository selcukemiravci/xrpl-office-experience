// Create the 30 images upload it to Pinada
// 
// Send the image to poap using infura  
// I need the API key for the POAP 
// And then send it to POAP

const cors = require('cors')({origin: true});
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const xrpl = require("xrpl");

admin.initializeApp();

exports.sendXRP = functions.https.onCall(async (data, context) => {
  return cors(request, response, async () => {
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

  const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233/");
  await client.connect();

  const wallet = xrpl.Wallet.fromSeed("sEdSSHPhkcuxY8bvbJoC58pWfUgNLkm");

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

});

