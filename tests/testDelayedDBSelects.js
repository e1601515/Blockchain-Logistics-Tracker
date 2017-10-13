var databaseModule = require('./project_modules/databaseModule.js');

//DONT ENABLE ALL checkcount and load AT ONCE OR THEY WILL INTERFERE EACH OTHER

//databaseModule.checkCountForPacket("1234");
databaseModule.loadFromDB("1234");
databaseModule.findCompanyAccountFromDatabase("VR");


setTimeout(returnValues,150);
function returnValues()
{
  var table = databaseModule.returnTXEntries();
  console.log(table);
  if(table=="'1234':'0x48803e15780f3a1c3306d934c4a5cef16b00e64d53337f1ddaf38dfab37a7c7b';")
    console.log("yes");
  console.log(databaseModule.returnCount());
  console.log(databaseModule.returnCompanyAccount());
}
