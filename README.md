# Zoom Auto Mute Macro
This example macro detects when you have joined a zoom meeting and automatically mutes the microphone of the Webex Device and also sends the DTMF string to indicate to other Zoom meeting participants that the device is muted.


## Overview

The macro attempts to detect if you are successfully in a Zoom meeting before sending the DTMF string which indicates to other Zoom participants your device is muted.

This in meeting detection is based on media rates of the incoming video from the Zoom meeting. When waiting on the Passcode, Host PIN or Waiting Room screens, the incoming media rate is low and when in a meeting it is high.

## Setup

### Prerequisites & Dependencies: 

- RoomOS/CE 9.6.x or above Webex Device.
- Web admin access to the device to upload the macro.


### Installation Steps:
1. Download the ``zoom-auto-mute.js`` file and upload it to your Webex Room devices Macro editor via the web interface.
2. Configure the Macro by changing the initial values, there are comments explaining each one.
      ```javascript
      const config = {
        zoomString: {
          mute: '1001',           // DTMF String to indicate muted
          unmute: '12'            // DTMF String to indicate unmuted
        },
        muteMediaTrigger: 700000  // Min Media Rate to trigger initial mute
      }
      ```
3. Enable the Macro on the editor.


## Demo

*For more demos & PoCs like this, check out our [Webex Labs site](https://collabtoolbox.cisco.com/webex-labs).


## License

All contents are licensed under the MIT license. Please see [license](LICENSE) for details.


## Disclaimer

Everything included is for demo and Proof of Concept purposes only. Use of the site is solely at your own risk. This site may contain links to third party content, which we do not warrant, endorse, or assume liability for. These demos are for Cisco Webex use cases, but are not Official Cisco Webex Branded demos.


## Questions

Please contact the WXSD team at [wxsd@external.cisco.com](mailto:wxsd@external.cisco.com?subject=zoom-auto-mute-macro) for questions. Or, if you're a Cisco internal employee, reach out to us on the Webex App via our bot (globalexpert@webex.bot). In the "Engagement Type" field, choose the "API/SDK Proof of Concept Integration Development" option to make sure you reach our team. 
