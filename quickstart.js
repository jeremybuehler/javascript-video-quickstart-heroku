var endpoint;
var activeConversation;
var previewMedia;

// check for WebRTC
if (!navigator.webkitGetUserMedia && !navigator.mozGetUserMedia) {
  alert('WebRTC is not available in your browser.');
}

// connect to Twilio
document.getElementById('button-listen').onclick = function () {
  var accessToken = document.getElementById('token-text').value;
  endpoint = new Twilio.Endpoint(accessToken);
  endpoint.listen().then(
    endpointConnected,
    function (error) {
      log('Could not connect to Twilio: ' + error.message);
    }
  );
};

// successfully connected!
function endpointConnected() {
  document.getElementById('token').style.display = 'none';
  document.getElementById('invite-controls').style.display = 'block';
  log("Connected to Twilio. Listening for incoming Invites as '" + endpoint.address + "'");

  endpoint.on('invite', function (invite) {
    log('Incoming invite from: ' + invite.from);
    invite.accept().then(conversationStarted);
  });

  // bind button to create conversation
  document.getElementById('button-invite').onclick = function () {
    var inviteTo = document.getElementById('invite-to').value;

    if (activeConversation) {
      // add a participant
      activeConversation.invite(inviteTo);
    } else {
      // create a conversation
      var options = {};
      if (previewMedia) {
        options.localMedia = previewMedia;
      }
      endpoint.createConversation(inviteTo, options).then(
        conversationStarted,
        function (error) {
          log('Unable to create conversation');
          console.error('Unable to create conversation', error);
        }
      );
    }
  };
};

// conversation is live
function conversationStarted(conversation) {
  log('In an active Conversation');
  activeConversation = conversation;
  // draw local video, if not already previewing
  if (!previewMedia) {
    conversation.localMedia.attach('#local-media');
  }
  // when a participant joins, draw their video on screen
  conversation.on('participantConnected', function (participant) {
    log("Participant '" + participant.address + "' connected");
    participant.media.attach('#remote-media');
  });
  // when a participant disconnects, note in log
  conversation.on('participantDisconnected', function (participant) {
    log("Participant '" + participant.address + "' disconnected");
  });
  // when the conversation ends, stop capturing local video
  conversation.on('ended', function (conversation) {
    log("Connected to Twilio. Listening for incoming Invites as '" + "endpoint.address'");
    conversation.localMedia.stop();
    conversation.disconnect();
    activeConversation = null;
  });
};

//  local video preview
document.getElementById('button-preview').onclick = function () {
  if (!previewMedia) {
    previewMedia = new Twilio.LocalMedia();
    Twilio.getUserMedia().then(
      function (mediaStream) {
        previewMedia.addStream(mediaStream);
        previewMedia.attach('#local-media');
      },
      function (error) {
        console.error('Unable to access local media', error);
        log('Unable to access Camera and Microphone');
      }
    );
  };
};

// activity log
function log(message) {
  document.getElementById('log-content').innerHTML = message;
};