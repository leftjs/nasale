import firebase from "firebase";

const config = {
  apiKey: "AIzaSyC4MM32cqb20Rukj-obpQBKlzIvJpxnN0o",
  authDomain: "nasale-c05fa.firebaseapp.com",
  databaseURL: "https://nasale-c05fa.firebaseio.com",
  projectId: "nasale-c05fa",
  storageBucket: "nasale-c05fa.appspot.com",
  messagingSenderId: "371491736349"
};
firebase.initializeApp(config);

const database = firebase.database();

export const postToken = token => {
  const newId = database
    .ref()
    .child("tokens")
    .push().key;

  firebase
    .database()
    .ref("tokens/" + newId)
    .set(token);

  return newId;
};

export const listTokens = callback => {
  const tokenRef = firebase.database().ref("tokens");
  tokenRef.on("child_added", callback);
};

export const buyToken = (account, address) => {
  firebase
    .database()
    .ref(`accounts/${account}/${address}`)
    .set(new Date().valueOf());
};

export const listAccounts = (account, callback) => {
  const accountRef = firebase.database().ref("accounts/" + account);
  accountRef.once("value").then(callback);
};
