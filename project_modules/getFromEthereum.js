var Web3 = require('web3');
var web3 = new Web3();
const crypto = require('crypto');
var getFromEthereumFunction=function(searchTerm)
{
  web3.setProvider(new web3.providers.HttpProvider("http://localhost:8545"));
  console.log("search "+searchTerm);
  var transactionFromEthereum = web3.toAscii(web3.eth.getTransaction(searchTerm).input);
  console.log("ascii "+transactionFromEthereum);
  var decipher = crypto.createDecipher('aes192', 'logistiikka');
  let decrypted = decipher.update(transactionFromEthereum, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  //console.log(decrypted);
  return decrypted;
}
/*
var returnTransactionInfo=function(callback)
{
  callback()
}
*/
exports.getFromEthereumFunction=getFromEthereumFunction;
