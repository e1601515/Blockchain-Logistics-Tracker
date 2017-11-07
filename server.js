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
var NodeGeocoder = require('node-geocoder');
var geocoder = NodeGeocoder();
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
  var listExisting;
  var sendResponseLoop, checkIfBusyLoop;
  checkIfBusyLoop = setTimeout(function ()
  {
    if(databaseModule.isReserved()==false)
    {
      try
      {
        databaseModule.listPacketID();
        sendResponseLoop = setInterval(sendResponse,25);
        clearInterval(checkIfBusyLoop);
      }
      catch(error)
      {
        console.log(error);
      }
    }
  },500);
  function sendResponse()
  {
    listExisting = databaseModule.returnPacketList();
    if(listExisting!=null)
    {
      console.log("List of packets in database sent as predictive text input: "+listExisting);
      app.locals.suggestions=listExisting;
      res.render('barcode2');
      app.locals.messageToClient="";
      clearInterval(sendResponseLoop);
    }
  }
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

//initializing body parser so we can fetch data from text box
app.use(bodyParser.json() );
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());
app.use(express.urlencoded());

app.get('/print', function (req, res)
{
  //saving searchTerm from client UI
  //var searchTerm = req.body.searchTerm;

  //hard coded
  var searchTerm="5541";

  //initializing strings to hold packet data
  var entriesFromDB;
  var stringFromEthereum;
  var decryptedStrings1 = "";
  var decryptedStrings2;
  var decryptedStringsFinal = "";

  //loops for async
  var searchEntriesLoop,checkIfMoreFromEthereumLoop,showResultsLoop;

  var busyCheckForPrintLoop = setInterval(function()
  {
    if(databaseModule.isReserved()==false)
    {
      //loading from DB
      databaseModule.loadFromDB(searchTerm);

      //starting next loop
      searchEntriesLoop = setInterval(searchEntries,25);
      clearInterval(busyCheckForPrintLoop);
    }
  },500);
  function searchEntries()
  {
    entriesFromDB = databaseModule.returnTXEntries();
    //when loaded from DB >> retrieving and decrypting the packet data
    if(entriesFromDB!=null)
    {
      entriesFromDB = entriesFromDB.split(',');
      var hashEntry;

      for(var i=0;i<entriesFromDB.length;i+=1)
      {
        hashEntry=entriesFromDB[i].split(':');

        if(hashEntry[0]!="" && hashEntry[1]!="" && hashEntry[0]!=null && hashEntry[1]!=null)
        {
          hashEntry[1]=hashEntry[1].replace("'","");
          hashEntry[1]=hashEntry[1].replace("'","");
          //hashEntry[1] is the transaction hash and here we search the transaction and the data stored to it
          stringFromEthereum=ethereumModule.getFromEthereum(hashEntry[1]);
          decryptedStrings1+=',"entry'+i+'":'+'{'+cryptoModule.decryptString(stringFromEthereum,cryptoPassword)+ ', "timestamp":"' +ethereumModule.getTimestamp(hashEntry[1],"string")+'"}';

          if(debug)
          {
            //console.log(hashEntry[1]);
            //console.log("after adding "+decryptedStrings1);
          }
        }
      }
      checkIfMoreFromEthereumLoop = setInterval(checkIfMoreFromEthereum,25);
      clearInterval(searchEntriesLoop);
    }
  }
  function checkIfMoreFromEthereum()
  {
    if(decryptedStrings1!=decryptedStrings2)
    {
      decryptedStrings2=decryptedStrings1;
    }
    else
    {
      decryptedStringsFinal=decryptedStrings1;
      showResultsLoop = setInterval(showResults,25);
      clearInterval(checkIfMoreFromEthereumLoop);
    }
  }
  function showResults()
  {
    if(decryptedStringsFinal!="")
    {
      try
      {
        decryptedStringsFinal=decryptedStringsFinal.replace(',',"");
        var newJSON = JSON.parse('{"entries":{'+decryptedStringsFinal+'}}')
        if(debug)
          console.log(newJSON);
        app.locals.retrievedPackets=JSON.stringify(newJSON);
        res.json(newJSON);
        //res.render('barcode2');
        clearInterval(showResultsLoop);
      }
      catch (error)
      {
        console.log(error);
        res.send("Something went wrong. Probably the data is in wrong format.   "+error);
        clearInterval(showResultsLoop);
      }
    }
  }
});

app.post('/', function (req, res)
{
  //no injection attacks here! sanitizing input
  //receiving input element values from users submission
  var packetIdFromClient=inputModule.sanitizeInput(req.body.packetID);
  var companyNameFromClient=inputModule.sanitizeInput(req.body.companyName);
  //var longitude = inputModule.sanitizeInput(req.body.longitudeClient);
  //var latitude = inputModule.sanitizeInput(req.body.latitudeClient);

  //hard coded while waiting UI to be built further
  var latitude = 33.7489;
  var longitude = -84.3789;

  //variables for the input data parameter
  var txCount,toAccount,activity
  var addressJSON = null;

  //strings of full packet data
  var dataToEncrypt;
  let encryptedDataToSave;

  //variables for the outputs to client
  var suggestionsInPost,messageToClient;

  //loops that have to be used for the async
  var checkIfReservedLoop, getCountAndActivityLoop, encryptAndSendEthereumLoop, refreshPageLoop;

  //starting the first loop
  checkIfReservedLoop = setInterval(function()
  {
    //If other clients dont have stored values on the way. We can begin the save.
    if(databaseModule.isReserved()==false)
    {
      //finding out existing entry count and company account assigned to the company
      databaseModule.checkCountForPacket(packetIdFromClient);
      toAccount = jsonModule.findCompanyAccount(companyNameFromClient.toUpperCase());

      //count is being retrieved from db, starting second loop to receive
      getCountAndActivityLoop = setInterval(getCountAndActivity,25);
      clearInterval(checkIfReservedLoop);
    }
    //long delay->less chance to conflict as it checks if the modules are busy only at the start
  },500);

  //The functions are in the same order here as the order they are executed in.

  function getCountAndActivity()
  {
    txCount = databaseModule.returnCount();

    //if none or even exist, we are receiving. if odd exists, we are already carrying the packet and giving it away next
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

      //we have count and activity, time to get location
      initLocation();
      clearInterval(getCountAndActivityLoop);
    }
  }

  function initLocation()
  {
    //asynchronous retrieval of additional info based on gps coord, such as street address
    geocoder.reverse({lat:latitude,lon: longitude}, function(err, res)
    {
      //sometimes returns null! try catching
      try
      {
        addressJSON=JSON.stringify(res);
        addressJSON=addressJSON.replace("[","");
        addressJSON=addressJSON.replace("]","");
        encryptAndSendEthereumLoop = setInterval(encryptAndSendEthereum,50);
      }

      catch(error)
      {
        initLocation();
        if(debug)
          console.log(error);
      }

      if(debug)
        console.log("Information of client: "+addressJSON);
    });

    //location info is being retrieved. Starting third loop.
  }

  function encryptAndSendEthereum()
  {
    if(addressJSON!=null)
    {
      dataToEncrypt=inputModule.jsonifyString(packetIdFromClient,activity,companyNameFromClient,latitude,longitude,addressJSON);
      encryptedDataToSave = cryptoModule.encryptString(dataToEncrypt,cryptoPassword);

      ethereumModule.saveTransaction(privateKey,fromAccount,toAccount,encryptedDataToSave,packetIdFromClient);

      printDebugs();

      app.locals.messageToClient=messageToClient;
      res.redirect('/');
      clearInterval(encryptAndSendEthereumLoop);
    }
  }

  function printDebugs()
  {
    if(debug)
    {
      console.log("Packet ID: " + packetIdFromClient);
      console.log("Company name: " + companyNameFromClient);
      console.log("Company account: " + toAccount);
      console.log("Existing TX count in DB for the packet: " + txCount);
      console.log("Current activity based on the count: " + activity);
      console.log("Data after encryption " + dataToEncrypt);
      console.log("Data after encryption " + encryptedDataToSave);
    }
  }

})



//this is the command for geth CLI to start the rpc, unless done with parameters when starting geth
//admin.startRPC("127.0.0.1", 8545, "*", "web3,net,eth")
//correct parameters in this case would be
//geth --testnet --fast --rpc --rpcaddr "127.0.0.1" --rpcport 8545 --rpccorsdomain "http://localhost:8545" --rpcapi "web3,net,eth"
