/**
 * Function to call to run task on a schedule.
 */
function scheduledProcessInbox() {
  processInbox(false, '');
}

/**
 * Function to call to run task back buffer.
 */
function ProcessInboxAll() {
  processInbox(true, '');
}

/**
 * Process the inbox
 *
 * @param doAll Go back as far as possible, or just the last 2 days?
 * @param When looking for labels to use, use a prefix? (eg "contacts/")
 */
function processInbox(doAll, labelPrefix) {
  // Last date we looked at.
  var lastDate = '';
  // We go back 2 days then stop.
  var secondDate = false;

  // get all threads in inbox
  var threads = GmailApp.getInboxThreads();

  // Get our contact object.
  Logger.log('We are: ' + Session.getActiveUser().getEmail());
  var ourAliases = GmailApp.getAliases();

  // Loop all threads.
  for (var i = 0; i < threads.length; i++) {
    Logger.log('Date: ' + Utilities.formatDate(threads[i].getLastMessageDate(), 'GMT', 'yyyy-MM-dd'));

    // Are we doing everything or just the last 2 day's worth?
    if (doAll == undefined || !doAll) {
      // Check the date..
      var thisDate = Utilities.formatDate(threads[i].getLastMessageDate(), 'GMT', 'yyyy-MM-dd');
      // If we haven't had a date yet, lets set the first date.
      if (lastDate == '') { lastDate = thisDate; }
      // Check if the date changed.
      if (thisDate != lastDate) {
        // If we are on the second date, bail.
        if (secondDate) {
          Logger.log('Gone back far enough, aborting!');
          return;
        } else {
          // Otherwise, remember this for next time.
          Logger.log('Reached second date!');
          lastDate = thisDate;
          secondDate = true;
        }
      }
    }


    // get all messages in a given thread
    var messages = threads[i].getMessages();

    // iterate over each message
    for (var j = 0; j < messages.length; j++) {
      // log message subject
      Logger.log(messages[j].getSubject());

      // Find who this was from
      var from = messages[j].getFrom()
      if (from.match(/</) != null) {
        from = from.match(/<([^>]*)/)[1];
      }
      Logger.log('    Message From: ' + from);

      // Check if they are a contact
      var contact = ContactsApp.getContact(from);
      // Check that the contact exists.
      if (contact != null) {
        // Check that it isn't us.
        if (ourAliases.indexOf(contact.getPrimaryEmail()) >= 0) {
          Logger.log('        Ignoring contact: ' + contact.getPrimaryEmail());
          continue;
        }
        // Get all their groups
        var groups = contact.getContactGroups();
        // Loop the groups...
        for (var k = 0; k < groups.length; k++) {
          // CHeck to see if we have a label by the same name.
          var name = (labelPrefix == undefined) ? groups[k].getName() : labelPrefix + groups[k].getName();
          var label = GmailApp.getUserLabelByName(name);
          // If we do, add it to the thread.
          if (label != null) {
            label.addToThread(threads[i]);
            Logger.log('        Adding label: ' + label.getName());
          }
        }
      }
    }
  }
};
