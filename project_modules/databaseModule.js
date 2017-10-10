var sqlite3 = require('sqlite3').verbose();
//database file premade by SQlite3 browser application
var dbFilePath = "./database/transactionTrackingDB.db"
var saveToDB = function(packetIdFromClient,txHash)
{
  var txdb = new sqlite3.Database(dbFilePath);
  txdb.serialize(function()
  {
    txdb.run("INSERT INTO TX(packetID,transactionID) VALUES('"+packetIdFromClient+"','"+txHash+"')");
    txdb.close();
  });
}
var loadFromDB = function(searchTerm)
{
  txdb.get("SELECT * FROM TXHASH WHERE packetID='"+searchTerm+"'", function(err, row) {
    var foundEntries=[""];
    if(row!= null)
    {
      for(i=0;i<rows.length;i++)
      {
          foundEntries[i]="'"+row.packetID+"':'"+row.transactionID+"';";
      }
      return foundEntries;
    }
    else {
      console.log("None found from DB!");
    }
  });
}
exports.saveToDB=saveToDB;
exports.loadFromDB=loadFromDB;
