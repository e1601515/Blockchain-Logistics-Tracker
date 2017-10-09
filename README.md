"# Blockchain-Logistics-Tracker" 
This is a student project for a course in VAMK University of applied sciences.

The idea is to create a package tracker for internal logistics that stores and reads data using Ethereum blockchain API.

INSTRUCTIONS

by synchronized local node :  <br>
geth --testnet --fast --rpc --rpcaddr "127.0.0.1" --rpcport 8545 --rpccorsdomain "http://localhost:8545" --rpcapi "web3,net,eth"

or use infura.io by changing in server.js (requires free registration) : <br>
web3.setProvider(new web3.providers.HttpProvider("https://ropsten.infura.io/<your API key>"));

you have to add your own accounts private key to server.js , you can get that from myetherwallet.com

then just run server.js and connect localhost by browser
