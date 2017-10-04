//adding modules
var Web3 = require('web3');
var util = require('ethereumjs-util');
var tx = require('ethereumjs-tx');
var lightwallet = require('eth-lightwallet');
const crypto = require('crypto');
var express = require('express');
var bodyParser = require('body-parser')
var sqlite3 = require('sqlite3').verbose();

//initializing connection to local ethereum node
var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider("http://localhost:8545"));

//this is the command for geth CLI to start the rpc, unless done with parameters when starting geth
//admin.startRPC("127.0.0.1", 8545, "*", "web3,net,eth")

//initializing and starting web server
var app = express();
var port = 8080;
app.set('view engine', 'ejs')
app.listen(port, function() {
 console.log('app started');
});

//initializing variables
var mainAccount = "0xf81D26ae334E416d09828312794A3c2F0A81B02A";
var secondaryAccount = "0x42a0193dc3685a83d0c38d129fedb72b7d9262b0";
//NEVER STORE THE PRIVATE KEY IN PUBLISHED SOURCE CODE!!!!
var privateKey = "";
var txutils = lightwallet.txutils;
var txHash,packetIdFromClient,messageOut;
const cipher = crypto.createCipher('aes192', 'logistiikka');
let encrypted;
//as we dont have viewing functionality yet, we dont need decipherer right now
//const decipher = crypto.createDecipher('aes192', 'logistiikka');

//database file premade by SQL lite browser application
//at this stage should consist of 1 table with 4 columns, which are
//1.packetID , 2.Sent , 3.Forwarded , 4.Delivered(or Received)
//SHOULD NOT BE IN PUBLICLY ACCESSED FOLDER so it cant be accessed by 3rd parties
var dbFilePath = "transactionTrackingDB.db"

//rendering html from ejs template and sending to client
app.get('/', function (req, res) {
  res.render('index');
})

//initializing body parser so we can fetch data from text box
//not understanding this part nearly good enough yet, but brought it in after getting recommended to do so in multiple tutorials
app.use(bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

//client has pressed submit and we call method that saves the transaction to ethereum
//
app.post('/sendpacketid', function (req, res) {
  //Debug in server console
  console.log("String received from the client: "+req.body.packetID);
  packetIdFromClient=req.body.packetID;
  saveTransaction();
  //in final version we could return to same page for adding more or viewing data,
  //res.render('index');
  //but for prototype1 proof of concept we will just display the return value of saveTransaction, which is the hash identifier of the created transaction
  res.send("Transaction made! Check database for changes. /getTx for hash.");
})

//method to save the transaction to database
function dbSave()
{
  var notFound=true;
  var txdb = new sqlite3.Database(dbFilePath);
  txdb.serialize(function() {
    //assuming that packetID are unique per transfer, as I imagine they should be, it is in order to check whether a record already exists in database
    //txdb.get("SELECT * FROM TXHASH WHERE packetID='"+packetIdFromClient+"'", function(err, row) {
    txdb.get("IF EXISTS (SELECT * FROM TXHASH WHERE packetID='"+packetIdFromClient+"') THEN SELECT * FROM TXHASH WHERE packetID='"+packetIdFromClient+"' END IF", function(err, row) {
      if(row!= null)
      {
        console.log("Record already found with txHash!");
        notFound = false;
      }
      else {
        notFound = true;
      }
    });
    if(notFound)
    {
      //frontend doesnt yet tell which action the transaction represents (status of package delivery that we are logging) so ill just use 'sent' for proof of concept
      txdb.run("INSERT INTO TXHASH(packetID,sent,forwarded,received) VALUES('"+packetIdFromClient+"','"+txHash+"','','')");
    }
    txdb.close();
  });
}

//method that saves the transaction to ethereum
function saveTransaction()
{
  var hexPrivateKey = new Buffer(privateKey, 'hex');
  encryptOutput();
  //console.log(web3.eth.getTransactionCount(mainAccount));

  //this is the structure where parameters are defined
  var rawTx = {
  //unlike with web.eth.sendTransaction the raw transaction takes parameters in hex
  from: mainAccount,
  to: secondaryAccount,
  value: web3.toHex(0),
  //this methdod fetches the integer that represents the count of transactions.
  //if we knew this already, we could create transactions without our Ethereum node being fully synced.
  nonce: web3.toHex(web3.eth.getTransactionCount(mainAccount)),
  //values seem huge because theyre in Wei, which is the smallest subunit of Ether
  gasLimit: web3.toHex(800000),
  gasPrice: web3.toHex(20000000000),
  //this is the core of our operations as its the parameter where our relevant data is stored
  //please notice that web3.toHex doesnt have to be used in this case, because encryption method already returns correct type. 0x at the start tells ethereum its hex.
  //hardcoded "sent" as its the selected operation for demo... so now we have packet ID and packet status along with timestamp from Ethereum itself.
  data: web3.toHex(encrypted)
  };

  var transaction = new tx(rawTx);
  transaction.sign(hexPrivateKey);
  var serializedTx = transaction.serialize().toString('hex');
  web3.eth.sendRawTransaction(
  '0x' + serializedTx, function(err, result) {
      if(err) {
        console.log(err);
      } else {
        console.log("No error. Transaction made with identifier: "+result);
        txHash=result;
        dbSave();
      }
  });
}

function encryptOutput()
{
  var dataToEncrypt="packetID:"+packetIdFromClient+";packetStatus:sent;userID:<userID here>;locationName:<locationName here>;gpslongitude:<gps here>;gpslatitude:<gps here>;locationByGPS:<address/town here>"
  console.log("Data to encrypt:  "+dataToEncrypt);
  encrypted = cipher.update(dataToEncrypt, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  console.log("Encrypted data parameter output: " + encrypted);
}


//Methods used during earlier phases for testing
/*
//web3.eth.sendTransaction({from: account1, to: account2, data: web3.toHex(messageOut), gas: 200000})

var balance1 = web3.eth.getBalance(account1)
console.log("Balance of account 1  " + balance1)

var balance2 = web3.eth.getBalance(account2)
console.log("Balance of account 2  " + balance2)

if(web3.isConnected())
{
  console.log("Connected")
}
else
{
  console.log("Not connected")
}

var version = web3.version.api;
console.log(version);
*/
