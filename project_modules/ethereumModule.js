var debug = true;
var Web3 = require('web3');
//var util = require('ethereumjs-util');
var tx = require('ethereumjs-tx');
var lightwallet = require('eth-lightwallet');
var databaseModule = require('./databaseModule.js');
var txHash;
var web3 = new Web3();

var saveTransaction = function(privateKey,fromAccount,toAccount,encryptedDataToSave,packetIdFromClient,companyNameFromClient)
{
  var rawTx =
  {
    from: fromAccount,
    to: toAccount,
    value: web3.toHex(0),
    //this methdod fetches the integer that represents the count of transactions.
    //if we knew this already, we could create transactions without our Ethereum node being fully synced.
    nonce: web3.toHex(web3.eth.getTransactionCount(fromAccount)),
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
        console.log("Transaction made with identifier: "+result);
        txHash=result;
        databaseModule.saveToDB(packetIdFromClient,result);
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

exports.getFromEthereumFunction=getFromEthereumFunction;
exports.saveTransaction=saveTransaction;
exports.getLatest=getLatest;
exports.connectEthereum=connectEthereum;
