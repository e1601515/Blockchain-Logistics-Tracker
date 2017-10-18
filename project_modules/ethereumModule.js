var debug = true;
var Web3 = require('web3');
//var util = require('ethereumjs-util');
var tx = require('ethereumjs-tx');
var lightwallet = require('eth-lightwallet');
var databaseModule = require('./databaseModule.js');
var txHash;
var previousNonce=0;
var web3 = new Web3();

function connectEthereum()
{
  web3.setProvider(new web3.providers.HttpProvider("http://localhost:8545"));
  if(web3.isConnected())
  {
    console.log("Using local node.")
  }
  else
  {
    console.log("Can't connect to local node. Trying remote node.")
    web3.setProvider(new web3.providers.HttpProvider("https://ropsten.infura.io/i5B73ieEWv30x1P28jca"));
    if(web3.isConnected())
    {
      console.log("Connected to remote node.")
    }
    else
    {
      console.log("No connection. Program will exit.")
      process.exit(0);
    }
  }
}

var saveTransaction = function(privateKey,fromAccount,toAccount,encryptedDataToSave,packetIdFromClient)
{
  //this is for fastly repeated run so that nonce if increased if transactioncount didnt update fast enought in ethereum
  var dynamicNonce = web3.eth.getTransactionCount(fromAccount);
  if(dynamicNonce<=previousNonce)
    dynamicNonce=previousNonce+1;
  previousNonce = dynamicNonce;
  if(debug)
    console.log("NONCE " + dynamicNonce);
  var rawTx =
  {
    from: fromAccount,
    to: toAccount,
    value: web3.toHex(0),
    //this methdod fetches the integer that represents the count of transactions.
    nonce: web3.toHex(dynamicNonce),
    gasLimit: web3.toHex(800000),
    gasPrice: web3.toHex(20000000000),
    data: web3.toHex(encryptedDataToSave)
  };
  //var txutils = lightwallet.txutils;
  var transaction = new tx(rawTx);
  var hexPrivateKey = new Buffer(privateKey, 'hex');
  transaction.sign(hexPrivateKey);
  var serializedTx = transaction.serialize().toString('hex');
  web3.eth.sendRawTransaction(
  '0x' + serializedTx, function(err, result)
  {
      if(err)
      {
        console.log(err);
      }
      else
      {
        txHash=result;
        var timeStamp="";
        var intervalFunction = setInterval(
        function delayTimestamp()
        {
          var found = false;
            try
            {
              timeStamp = getTimestamp(result,"unix");
            } catch (e)
            {
              if(debug)
                console.log("Waiting for next Block to be mined...");
            }
            if(timeStamp!="")
            {
              databaseModule.saveToDB(packetIdFromClient,result,timeStamp);
              clearInterval(intervalFunction);
              console.log("Block mined with timestamp: "+timeStamp+"\nTransaction for packet "+packetIdFromClient+" saved to database.");
            }
        }
        ,5000);
        if(debug)
        {
          console.log("Transaction made with identifier: "+result);
        }
        timeStamp="";
      }
  });
}

var getLatest = function()
{
  return txHash;
}

var getFromEthereumFunction = function(searchTerm)
{
  var transactionFromEthereum = web3.toAscii(web3.eth.getTransaction(searchTerm).input);
  return transactionFromEthereum;
}

var getTimestamp = function(tx,mode)
{
  var unixTimeStamp = web3.eth.getBlock(web3.eth.getTransaction(tx).blockNumber).timestamp;
  var timestamp = new Date(unixTimeStamp*1000);
  if(mode=="unix")
  {
    return unixTimeStamp;
  }
  else if(mode=="date")
  {
    return timestamp;
  }
  else if(mode=="string")
  {
    return timestamp.toString();
  }
}

exports.connectEthereum=connectEthereum;
exports.saveTransaction=saveTransaction;
exports.getFromEthereumFunction=getFromEthereumFunction;
exports.getLatest=getLatest;
exports.getTimestamp=getTimestamp;
