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
  },500);
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
  var stringFromEthereum,decryptedStrings2;
  var decryptedStrings1 = "";
  var decryptedStringsFinal = "";
  var busyCheckForPrint = setInterval(function()
  {
    if(databaseModule.isReserved()==false)
    {
      databaseModule.loadFromDB('5551');
      var entriesFound = setInterval(function()
      {
        entriesFromDB = databaseModule.returnTXEntries();
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
              stringFromEthereum=ethereumModule.getFromEthereum(hashEntry[1]);
              decryptedStrings1+=',"entry'+i+'":'+'{'+cryptoModule.decryptString(stringFromEthereum,cryptoPassword)+ ', "timestamp":"' +ethereumModule.getTimestamp(hashEntry[1],"string")+'"}';
              //decryptedStrings+=";"+cryptoModule.decryptString(stringFromEthereum,cryptoPassword)+ ', "timestamp":"' +ethereumModule.getTimestamp(hashEntry[1],"string");
              if(debug)
              {
                //console.log(hashEntry[1]);
                //console.log("after adding "+decryptedStrings1);
              }
            }
          }
          var checkIfMoreFromEthereum = setInterval(function()
          {
            if(decryptedStrings1!=decryptedStrings2)
            {
              decryptedStrings2=decryptedStrings1;
            }
            else
            {
              decryptedStringsFinal=decryptedStrings1;
              clearInterval(checkIfMoreFromEthereum);
            }
          },25)
          clearInterval(entriesFound);
        }
      },25)
      var printingResults = setInterval(function()
      {
        if(decryptedStringsFinal!="")
        {
          decryptedStringsFinal=decryptedStringsFinal.replace(',',"");
          var newJSON = JSON.parse('{"packets":{'+decryptedStringsFinal+'}}')
          //app.locals.retrievedPackets=decryptedStrings;
          app.locals.retrievedPackets=JSON.stringify(newJSON);
          res.json(newJSON);
          //res.render('barcode2');
          clearInterval(printingResults);
        }
      },25);
      clearInterval(busyCheckForPrint);
    }
  },500);
});
//initializing body parser so we can fetch data from text box
app.use(bodyParser.json() );
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());
app.use(express.urlencoded());

app.post('/', function (req, res)
{
  //no injection attacks here! sanitizing input
  var packetIdFromClient=inputModule.sanitizeInput(req.body.packetID);
  var companyNameFromClient=inputModule.sanitizeInput(req.body.companyName);
  //var longitude = inputModule.sanitizeInput(req.body.longitudeClient);
  //var latitude = inputModule.sanitizeInput(req.body.latitudeClient);
  var latitude = 33.7489;
  var longitude = -84.3789;
  //var addressJSON="default";
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
          var NodeGeocoder = require('node-geocoder');
          var geocoder = NodeGeocoder();
          //var addressJSON;
          var addressJSON;
          geocoder.reverse({lat:latitude,lon: longitude}, function(err, res) {
            addressJSON=JSON.stringify(res);
            addressJSON=addressJSON.replace("[","");
            addressJSON=addressJSON.replace("]","");
            if(debug)
            {
              console.log("Information of client: "+addressJSON);
            }
          });
          var locationFound = setInterval(function()
          {
            if(addressJSON!=null)
            {
              //crypting
              var dataToEncrypt=inputModule.jsonifyString(packetIdFromClient,activity,companyNameFromClient,latitude,longitude,addressJSON);
              let encryptedDataToSave = cryptoModule.encryptString(dataToEncrypt,cryptoPassword);
              ethereumModule.saveTransaction(privateKey,fromAccount,toAccount,encryptedDataToSave,packetIdFromClient);
              app.locals.messageToClient=messageToClient;
              //refresing the input suggestions
              databaseModule.listPacketID();
              var refreshedPage = setInterval(function ()
              {
                var suggestionsInPost = databaseModule.returnPacketList();
                if(suggestionsInPost!=null)
                {
                  app.locals.suggestions=suggestionsInPost;
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
              },25);
              clearInterval(locationFound);
            }
          },50)
            //console.log("1");
        }
        //console.log("2");
      },25);
      clearInterval(busyCheck);
    }
    //console.log("3");
  },500);
})



//this is the command for geth CLI to start the rpc, unless done with parameters when starting geth
//admin.startRPC("127.0.0.1", 8545, "*", "web3,net,eth")
//correct parameters in this case would be
//geth --testnet --fast --rpc --rpcaddr "127.0.0.1" --rpcport 8545 --rpccorsdomain "http://localhost:8545" --rpcapi "web3,net,eth"
