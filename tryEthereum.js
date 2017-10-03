var Web3 = require('web3');
var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider("http://localhost:8545"));

var account1 = "0x42a0193dc3685a83d0c38d129fedb72b7d9262b0";
var account2 = "0xf81d26ae334e416d09828312794a3c2f0a81b02a";
var messageOut = "userID;packetID;locationID;packetStatus;timestamp"

//web3.personal.unlockAccount(account1, "e1601515", 10000);
//not working

//web3.eth.sendTransaction({from: account1, to: account2, data: web3.toHex(messageOut), gas: 200000})



var balance1 = web3.eth.getBalance(account1)
console.log("Balance of account 1  " + balance1)

var balance2 = web3.eth.getBalance(account2)
console.log("Balance of account 2  " + balance2)



/*
if(web3.isConnected())
{
  console.log("Connected")
}
else
{
  console.log("Not connected")
}
*/

//admin.startRPC("127.0.0.1", 8545, "*", "web3,net,eth")
/*
//var version = web3.version.api;
//console.log(version);
*/
