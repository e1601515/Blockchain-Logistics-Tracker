var debug = true;
//adding npm modules
var express = require('express');
var bodyParser = require('body-parser')
//adding external .js file
var ethereumModule = require('./ethereum/ethereumModule.js');
var cryptoModule = require('./crypto/cryptoModule.js');
var databaseModule = require('./db/databaseModule.js');
var jsonModule = require('./json/jsonModule.js');
var inputModule = require('./input/inputModule.js');

//initializing and starting web server
var app = express();
var port = 8080;
app.set('view engine', 'ejs');
app.listen(port, function() {
  console.log('Webserver running in port '+port);
  ethereumModule.connectEthereum();
});

//account
//NEVER STORE THE PRIVATE KEY IN PUBLISHED SOURCE CODE!!!!
var fromAccount = "0x15abD8B6b251Dac70B36C456BD880219080E153A";
var privateKey = "";
var cryptoPassword = "logistiikka";
var txHash="";

app.locals.messageToClient="";
app.locals.suggestions="";
app.locals.retrievedPackets="";
//rendering html from ejs template and sending to client
app.get('/', function (req, res)
{
  var checkIfBusy = setTimeout(function ()
  {
    if(databaseModule.isReserved()==false)
    {
      databaseModule.listPacketID()
      var isListFetched = setInterval(function ()
      {
        var listExisting = databaseModule.returnPacketList();
        if(listExisting!="")
        {
          console.log("List of packets in database sent as predictive text input: "+listExisting);
          app.locals.suggestions=listExisting;
          res.render('barcode2');
          app.locals.messageToClient="";
          clearInterval(isListFetched);
        }
      },25);
      clearInterval(checkIfBusy);
    }
  },100);
})

app.get('/getTx', function (req, res)
{
  var txHash=ethereumModule.getLatest();
  if(txHash!=null&&txHash!="")
  {
    res.send('Latest tx https://ropsten.etherscan.io/tx/'+txHash);
  }
  else
  {
    res.send('No tx yet during current session.');
  }
});
app.get('/getFromEthereum', function (req, res)
{
  var txHash=ethereumModule.getLatest();
  if(txHash!=null&&txHash!="")
  {
    var dataToDecrypt = ethereumModule.getFromEthereum(txHash);
    var decryptedData = cryptoModule.decryptString(dataToDecrypt,cryptoPassword)
    var timestampFromEthereum = ethereumModule.getTimestamp(txHash,"string");
    if(debug)
    {
      console.log("searching for: " + txHash);
      console.log("before decryption: " + dataToDecrypt);
      console.log("after decryption: " + decryptedData);
    }
    res.send("Packet info fetched from Ethereum: " + decryptedData +"\nTime: "+timestampFromEthereum);
    //res.render('barcode2');
  }
  else
  {
    res.send('No tx yet during current session.');
  }
});

app.get('/print', function (req, res)
{
  var entriesFromDB;
  var stringFromEthereum;
  var decryptedStrings = "";
  databaseModule.loadFromDB('43217');
  setTimeout(function()
  {
    entriesFromDB = databaseModule.returnTXEntries();
    entriesFromDB=entriesFromDB.split(',');
    var hashEntry;
    for(var i=0;i<entriesFromDB.length;i+=1)
    {
      hashEntry=entriesFromDB[i].split(':');
      if(hashEntry[0]!=null && hashEntry[1]!=null)
      {
        hashEntry[1]=hashEntry[1].replace("'","");
        hashEntry[1]=hashEntry[1].replace("'","");
        stringFromEthereum=ethereumModule.getFromEthereum(hashEntry[1]);
        decryptedStrings+=',"packet'+i+'":'+'{'+cryptoModule.decryptString(stringFromEthereum,cryptoPassword)+ ', "timestamp":"' +ethereumModule.getTimestamp(hashEntry[1],"string")+'"}';
        //decryptedStrings+=";"+cryptoModule.decryptString(stringFromEthereum,cryptoPassword)+ ', "timestamp":"' +ethereumModule.getTimestamp(hashEntry[1],"string");
        if(debug)
        {
          console.log(hashEntry[1]);
          //console.log("after adding "+decryptedStrings);
        }
      }
    }
    setTimeout(function()
    {
      decryptedStrings=decryptedStrings.replace(',',"");
      var newJSON = JSON.parse('{"packets":{'+decryptedStrings+'}}')
      app.locals.retrievedPackets=JSON.stringify(newJSON);
      //res.json(newJSON);
      //app.locals.retrievedPackets=decryptedStrings;
      res.render('barcode2');
    },2000);
  },300);
});
//initializing body parser so we can fetch data from text box
app.use(bodyParser.json() );
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());
app.use(express.urlencoded());

app.post('/', function (req, res)
{
  //no injection attacks here! sanitazing input
  var packetIdFromClient=inputModule.sanitizeInput(req.body.packetID);
  var companyNameFromClient=inputModule.sanitizeInput(req.body.companyName);

  //2nd db replaced with json
  //databaseModule.findCompanyAccountFromDatabase(companyNameFromClient.toUpperCase());
  var busyCheck = setInterval(function()
  {
    if(databaseModule.isReserved()==false)
    {
      databaseModule.checkCountForPacket(packetIdFromClient);
      var toAccount = jsonModule.findCompanyAccount(companyNameFromClient.toUpperCase());
      //async issue forces timeout and separate getter. 150ms has decent tolerance as measured requirement was just 3ms
      var countFound = setInterval(function ()
      {
        //var toAccount = databaseModule.returnCompanyAccount();
        var txCount = databaseModule.returnCount();
        var activity,messageToClient;
        if(txCount>-1)
        {
          if(txCount==0||txCount % 2 == 0)
          {
            activity="receive";
            messageToClient="Packet "+packetIdFromClient+" RECEIVED.";
          }
          else
          {
            activity="deliver";
            messageToClient="Packet "+packetIdFromClient+" DELIVERED.";
          }
          //will be generated by frontend inputs, but hard coding it for now
          var dataToEncrypt=inputModule.jsonifyString(packetIdFromClient,activity,companyNameFromClient);
          //crypting
          let encryptedDataToSave = cryptoModule.encryptString(dataToEncrypt,cryptoPassword);
          ethereumModule.saveTransaction(privateKey,fromAccount,toAccount,encryptedDataToSave,packetIdFromClient);
          app.locals.messageToClient=messageToClient;
          //refresing the input suggestions
          databaseModule.listPacketID();
          var refreshedPage = setInterval(function ()
          {
            if(databaseModule.returnPacketList()!=null)
            {
              app.locals.suggestions=databaseModule.returnPacketList();
              res.redirect('/');
              clearInterval(refreshedPage);
              if(debug)
              {
                console.log("Packet ID: " + packetIdFromClient);
                console.log("Company name: " + companyNameFromClient);
                console.log("Company account: " + toAccount);
                console.log("Existing TX count in DB for the packet: " + txCount);
                console.log("Current activity based on the count: " + activity);
                console.log("Data after encryption " + encryptedDataToSave);
              }
              clearInterval(countFound);
            }
            //console.log("1");
          },50);
        }
        //console.log("2");
      },50);
      clearInterval(busyCheck);
    }
    //console.log("3");
  },100);
})



//this is the command for geth CLI to start the rpc, unless done with parameters when starting geth
//admin.startRPC("127.0.0.1", 8545, "*", "web3,net,eth")
//correct parameters in this case would be
//geth --testnet --fast --rpc --rpcaddr "127.0.0.1" --rpcport 8545 --rpccorsdomain "http://localhost:8545" --rpcapi "web3,net,eth"
