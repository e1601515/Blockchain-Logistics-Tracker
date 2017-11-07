var debug = true;
//var sanitizedInput=null;
var sanitizeInput = function(input)
{
  //var sanitizedInput;
  while(input.includes("'")||input.includes('"'))
  {
    input=input.replace("'","");
    input=input.replace('"','');
  }
  if(debug)
    console.log("sanitized: "+input);
  return input;
}

var jsonifyString = function(packetIdFromClient,activity,companyNameFromClient,latitude,longitude,addressJSON)
{
  var jsonifiedString = '"packetID":"'+packetIdFromClient+'","activity":"'+activity+'","userName":"users name here","companyName":"'+companyNameFromClient+'","gpsLatitude":"'+latitude+'","gpsLongitude":"'+longitude+'","locationByGPS":'+addressJSON;
  return jsonifiedString;
}

exports.sanitizeInput=sanitizeInput;
exports.jsonifyString=jsonifyString;
