var debug = true;
var sqlite3 = require('sqlite3').verbose();

var transactionDatabaseFilepath = "./storage/transactionTrackingDB.db"

var count=0;
var foundEntries=[""];
var foundCompanyAccount;
var list="";

var saveToDB = function(packetIdFromClient,txHash,unixTimestamp)
{
  var txdb = new sqlite3.Database(transactionDatabaseFilepath);
  txdb.serialize(function()
  {
    txdb.run("INSERT INTO TX(packetID,transactionID,timestamp) VALUES('"+packetIdFromClient+"','"+txHash+"','"+unixTimestamp+"')");
  });
  txdb.close();
}

var loadFromDB = function(searchTerm)
{
  var txdb = new sqlite3.Database(transactionDatabaseFilepath);
  txdb.serialize(function()
  {
    txdb.each("SELECT * FROM TX WHERE packetID='"+searchTerm+"'", function(err, row) {
      var i=0;
      if(row != null)
      {
        foundEntries[i]="'"+row.packetID+"':'"+row.transactionID+"';";
        i+=1;
      }
    });
  });
  txdb.close();
}
var returnTXEntries = function()
{
  if(debug)
  {
    if(foundEntries.length==0)
    {
      console.log("None found from DB!");
    }
    else
    {
      console.log(foundEntries.length+" entries found")
      for(var j=0;j<foundEntries.length;j+=1)
      {
        console.log("\n"+foundEntries[j]);
      }
    }
  }
  return foundEntries;
  foundEntries=[""];
}

var checkCountForPacket = function(searchTerm)
{
  var txdb = new sqlite3.Database(transactionDatabaseFilepath);
  txdb.serialize(function()
  {
    txdb.each("SELECT * FROM TX WHERE packetID='"+searchTerm+"'", function(err, row) {
      if(row != null)
      {
        count+=1;
      }
    });
  });
  txdb.close();
}
var returnCount = function()
{
  var returningCount;
  returningCount=count;
  count=0;
  //if(debug)
    //console.log("reseted count "+count);
  return returningCount;
}

var listPacketID = function()
{
  var txdb = new sqlite3.Database(transactionDatabaseFilepath);
  txdb.each("SELECT * FROM TX ORDER BY timestamp DESC", function(err, row) {
    if(row != null)
    {
      if(!list.includes(";"+row.packetID+";") && row.packetID.length>2)
        list+=";"+row.packetID;
    }
  });
  txdb.close();
}

var returnPacketList = function()
{
  var returningList = list;
  list = "";
  if(debug)
    console.log("List of packets in database sent as predictive text input: "+returningList);
  return returningList;
}

//Company accounts are stored in JSON file.
/*
var findCompanyAccountFromDatabase = function(companyName)
{
  var companydb = new sqlite3.Database(companyDatabaseFilepath);
  companydb.serialize(function()
  {
    companydb.get("SELECT * FROM COMPANYACCOUNTS WHERE companyName='"+companyName+"'", function(err, row) {
      if(row!= null)
      {
        //console.log("found "+row.companyName + " " + row.accountID);
        foundCompanyAccount = row.accountID;
      }
      else
      {
        console.log("No company found. Using default account for misc.");
        foundCompanyAccount = "0xf81D26ae334E416d09828312794A3c2F0A81B02A";
      }
    });
  });
  companydb.close();
}
var returnCompanyAccount = function()
{
  return foundCompanyAccount;
  foundCompanyAccount="";
}
*/

exports.saveToDB=saveToDB;

exports.loadFromDB=loadFromDB;
exports.returnTXEntries=returnTXEntries;

exports.checkCountForPacket=checkCountForPacket;
exports.returnCount=returnCount;

exports.listPacketID=listPacketID;
exports.returnPacketList=returnPacketList;

//exports.findCompanyAccountFromDatabase=findCompanyAccountFromDatabase;
//exports.returnCompanyAccount=returnCompanyAccount;
