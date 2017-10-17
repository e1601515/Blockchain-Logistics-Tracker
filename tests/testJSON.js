// Define JSON File
 var fs = require("fs");
 //console.log("\n *STARTING* \n");
// Get content from file
 var contents = fs.readFileSync("./companyAccounts.json");
// Define to JSON type
 var jsonContent = JSON.parse(contents);
// Get Value from JSON
//console.log(JSON.stringify(jsonContent));
//console.log(jsonContent.companies.VR.accountID);

for(var company in jsonContent.companies)
{
  console.log(jsonContent.companies[company].accountID);
}

//console.log("Password:", jsonContent.password);
//log("\n *EXIT* \n");
