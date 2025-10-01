require('dotenv').config();
const client = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

async function main() {
  try {

    console.log(`Listing Templates`)

    let list_output = await client.content.v1.contents.list({
    });

    list_output.map( (msg) => {
      // console.log(`${JSON.stringify(msg, null, 2)}`);
      if( msg.friendlyName.includes("twilitransit") ) {
        console.log(`  Deleting ${msg.friendlyName}`);
        client.content.v1.contents(msg.sid).remove();
      }
      if( msg.friendlyName.startsWith("signal_syd25") ) {
        console.log(`  Found (${msg.sid}) ${msg.friendlyName}`);
        client.content.v1.contents(msg.sid).remove();
      }
    });    

  }
  catch(err) {
    console.error(err);
  }
}

main();