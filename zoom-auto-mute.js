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
* Version: 1-0-3
* Released: 02/21/24
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
    unmute: '12',           // DTMF String to indicate unmuted
    hideNonVideo: '105'      // DTMF String to hide non-video participants
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

xapi.Event.CallDisconnect.on(() => polling = false)

xapi.Status.Audio.Microphones.Mute.on(async state => {
  const call = await xapi.Status.Call.get();
  if (call.length == 0) return
  if (!call[0].CallbackNumber.endsWith('zoomcrc.com')) return
  console.log('Device Mute was set to:', state, ' while on a Zoom call')
  if (polling && call[0].Duration > 5) {
    console.log('Call is older than 5 seconds, stopping polling and processing mute change')
    polling = false;
    zoomHideNonVideoParticipants();
  }
  else if (polling) {
    console.log('Call is still new, ignoring mute change')
    return
  }
  if (state === 'On') zoomMute();
  if (state === 'Off') zoomUnmute();
})

function zoomMute() {
  console.log('Muting Zoom Call - Sending DTMF String:', config.zoomString.mute);
  xapi.Command.Call.DTMFSend({ DTMFString: config.zoomString.mute, Feedback: 'Silent' });
}


function zoomUnmute() {
  console.log('Unmuting Zoom Call - Sending DTMF String:', config.zoomString.unmute);
  xapi.Command.Call.DTMFSend({ DTMFString: config.zoomString.unmute, Feedback: 'Silent' });
}

function zoomHideNonVideoParticipants() {
  console.log('Hiding Non-Video Participants in Zoom Call - Sending DTMF String:', config.zoomString.hideNonVideo);
  xapi.Command.Call.DTMFSend({ DTMFString: config.zoomString.hideNonVideo, Feedback: 'Silent' });
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
    console.log('Polling Result: Low Incoming Media Rate - ', total, ' threshold not met')
    setTimeout(pollIncomingMedia, 500, callId);
    return;
  }

  if(!polling) return;
  polling = false;
  console.log('Polling Result: Low Incoming Media Rate - ', total, ' threshold reached sending DTMF String')
  const muteState = await xapi.Status.Audio.Microphones.Mute.get()
  if (muteState == 'On') zoomMute();
  if (muteState == 'Off') zoomUnmute();
  zoomHideNonVideoParticipants();
}
