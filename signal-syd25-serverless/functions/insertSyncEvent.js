exports.handler = async function(context, event, callback) {
  const twilioClient = context.getTwilioClient();
  const syncServiceSid = context.TWILIO_SYNC_SERVICE_SID;
  const listUniqueName = 'rcs-events';

  try {
    // Insert item into the Sync List
    const listItem = await twilioClient.sync.v1
      .services(syncServiceSid)
      .syncLists(listUniqueName)
      .syncListItems
      .create({
        data: event
      });

    return callback(null, {
      success: true,
      itemIndex: listItem.index,
      data: listItem.data
    });
  } catch (error) {
    console.error('Error inserting sync event:', error);
    return callback(error);
  }
};
