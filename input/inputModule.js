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

var jsonifyString = function(packetIdFromClient,activity,companyNameFromClient)
{
  var jsonifiedString = '"packetID":"'+packetIdFromClient+'","activity":"'+activity+'","userName":"users name here","companyName":"'+companyNameFromClient+'","gpsLongitude":"gps here","gpslatitude":"gps here","locationByGPS":"address/town here"';
  if (debug)
    console.log("jsonified data before encryption: "+jsonifiedString);
  return jsonifiedString;
}

exports.sanitizeInput=sanitizeInput;
exports.jsonifyString=jsonifyString;
