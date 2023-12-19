 /********************************************************
 * 
 * Macro Author:      William Mills
 *                    Technical Solutions Specialist 
 *                    wimills@cisco.com
 *                    Cisco Systems
 * 
 * Macro Co Author:   Robert(Bobby) McGonigle Jr
 *                    Technical Marketing Engineer 
 *                    bomcgoni@cisco.com
 *                    Cisco Systems
 * 
 * Version: 1-0-0
 * Released: 12/19/23
 * 
 * This example macro detects when you have joined a zoom
 * meeting and automatically mutes the microphone of the
 * Webex Device and also sends the DTMF string to indicate
 * to other Zoom meeting participants that the device is
 * muted.
 * 
 * The macro attempts to detect if you are successfully
 * in a Zoom meeting before sending the DTMF strings.
 * 
 * This detection is based on media rates of the incoming
 * video from the Zoom meeting.
 * 
 * Full Readme, source code and license agreement available 
 * on Github:
 * https://github.com/wxsd-sales/zoom-auto-mute-macro
 * 
 ********************************************************/
import xapi from 'xapi';

/*********************************************************
 * Configure the settings below
**********************************************************/

const config = {
  zoomString: {
    mute: '1001',           // DTMF String to indicate muted
    unmute: '12'            // DTMF String to indicate unmuted
  },
  muteMediaTrigger: 700000  // Min Media Rate to trigger initial mute
}

/*********************************************************
 * Main functions and Event Subscriptions
**********************************************************/

let polling = false;

xapi.Event.CallSuccessful.on(async event => {
  const callback = await xapi.Status.Call[event.CallId].CallbackNumber.get()
  if (!callback.endsWith('zoomcrc.com')) return;
  console.log('New Zoom Call detected - muting local microphone')
  xapi.Command.Audio.Microphones.Mute();
  const callId = event.CallId;
  console.log('Polling Incoming Video Media Rate for in meeting detection')
  polling = true;
  setTimeout(pollIncomingMedia, 500, callId)
})

xapi.Event.CallDisconnect.on(() => {
  polling = false;
})


xapi.Status.Audio.Microphones.Mute.on(async event => {
  const call = await xapi.Status.Call.get();
  if (!call.hasOwnProperty('CallbackNumber')) return
  if (!call.CallbackNumber.endsWith('zoomcrc.com')) return
  if (polling) return;
  if (event === 'On') zoomMute();
  if (event === 'Off') zoomUnmute();
})

function zoomMute() {
  console.log('Muting Zoom Call');
  xapi.Command.Call.DTMFSend({ DTMFString: config.zoomString.mute, Feedback: 'Silent' });
}


function zoomUnmute() {
  console.log('Unmuting Zoom Call');
  xapi.Command.Call.DTMFSend({ DTMFString: config.zoomString.unmute, Feedback: 'Silent' });
}

async function pollIncomingMedia(callId) {
  if (!polling) return;
  const channels = await xapi.Status.MediaChannels.Call[callId].Channel.get();
  const incomingChannels = channels.filter(channel => {
    return channel.Type == 'Video' &&
      channel.Direction == 'Incoming' &&
      channel.hasOwnProperty('Netstat')
  })

  if (incomingChannels.length == 0) {
    setTimeout(pollIncomingMedia, 500, callId);
    return
  }

  let total = 0;
  for (let i = 0; i < incomingChannels.length; i++) {
    total = total + parseInt(incomingChannels[i].Netstat.ChannelRate)
  }

  if (total < config.muteMediaTrigger) {
    console.log('Polling Result: Low Incoming Media Rate - ', total)
    setTimeout(pollIncomingMedia, 500, callId);
    return;
  }

  polling = false;
  console.log('Polling Result: Low Incoming Media Rate - ', total)
  zoomMute();
}

function normaliseRemoteURI(number) {
  var regex = /^(sip:|h323:|spark:|h320:|webex:|locus:)/gi;
  number = number.replace(regex, '');
  return number;
}
