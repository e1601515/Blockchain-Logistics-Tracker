"# Blockchain-Logistics-Tracker" 
This is a student project for a course in VAMK University of applied sciences.

The idea is to create a package tracker for internal logistics that stores and reads data using Ethereum blockchain API.

INSTRUCTIONS

by synchronized local node :
geth --testnet --fast --rpc --rpc --rpcaddr "127.0.0.1" --rpcport 8545 --rpccorsdomain "http://localhost:8545" --rpcapi "web3,net,eth"

or use infura.io by changing in server.js (requires free registration) :
web3.setProvider(new web3.providers.HttpProvider("https://ropsten.infura.io/<your API key>"));

then just run server.js and connect localhost by browser
