import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import recognizeMicrophone from 'watson-speech/speech-to-text/recognize-microphone';
import { Icon, Tabs, Pane, Alert } from 'watson-react-components';


class App extends Component {
  constructor(){
    super();
    this.state = {
      audioSource: null,
      token:null,
      rawMessages: [],
      formattedMessages: [],
      error: null,
    };

    
    this.handleStream=this.handleStream.bind(this)
    this.handleRawMessage=this.handleRawMessage.bind(this)
    this.handleFormattedMessage=this.handleFormattedMessage.bind(this)
    this.handleTranscriptEnd=this.handleTranscriptEnd.bind(this)
    this.stopTranscription=this.stopTranscription.bind(this)        
    this.reset=this.reset.bind(this)
  }
  

  handleMicClick() {
    if (this.state.audioSource === 'mic') {
      this.stopTranscription();
      return;
    }
    this.reset();
    this.setState({ audioSource: 'mic' });

    // The recognizeMicrophone() method is a helper method provided by the watson-speech package
    // It sets up the microphone, converts and downsamples the audio, and then transcribes it
    // over a WebSocket connection
    // It also provides a number of optional features, some of which are enabled by default:
    //  * enables object mode by default (options.objectMode)
    //  * formats results (Capitals, periods, etc.) (options.format)
    //  * outputs the text to a DOM element - not used in this demo because it doesn't play nice
    // with react (options.outputElement)
    //  * a few other things for backwards compatibility and sane defaults
    // In addition to this, it passes other service-level options along to the RecognizeStream that
    // manages the actual WebSocket connection.

    fetch('http://localhost:3002/api/speech-to-text/token')
    .then((response) =>{
        return response.text();
    }).then((token) => {
      this.setState({ token })
      console.log(token)

      this.handleStream(recognizeMicrophone({
        token: this.state.token,
        objectMode: true, // send objects instead of text
        extractResults: true, // convert {results: [{alternatives:[...]}], result_index: 0} to {alternatives: [...], index: 0}
        format: false // optional - performs basic formatting on the results such as capitals an periods
      }));
    })    
  }

  handleStream(stream) {
    console.log(stream);
    // cleanup old stream if appropriate
    if (this.stream) {
      this.stream.stop();
      this.stream.removeAllListeners();
      this.stream.recognizeStream.removeAllListeners();
    }
    this.stream = stream;

    stream.on('data',(data) => {
      this.setState({
        text: data.alternatives[0].transcript          

      })
      

      // console.log(data.alternatives[0].transcript)
    });
    stream.on('error', function(err) {
        console.log(err);
    });
  }

  handleRawMessage(msg) {
    this.setState({ rawMessages: this.state.rawMessages.concat(msg) });
  }

  handleFormattedMessage(msg) {
    this.setState({ formattedMessages: this.state.formattedMessages.concat(msg) });
  }

  handleTranscriptEnd() {
    // note: this function will be called twice on a clean end,
    // but may only be called once in the event of an error
    this.setState({ audioSource: null });
  }

  stopTranscription() {
    if (this.stream) {
      this.stream.stop();
      // this.stream.removeAllListeners();
      // this.stream.recognizeStream.removeAllListeners();
    }
    this.setState({ audioSource: null });
  }


  reset() {
    if (this.state.audioSource) {
      this.stopTranscription();
    }
    this.setState({ rawMessages: [], formattedMessages: [], error: null });
  }


  render() {

    const buttonsEnabled = !!this.state.token;
    const buttonClass = buttonsEnabled
    ? 'base--button'
    : 'base--button base--button_black';

    let micIconFill = '#000000';
    let micButtonClass = buttonClass;
    if (this.state.audioSource === 'mic') {
      micButtonClass += ' mic-active';
      micIconFill = '#FFFFFF';
    } else if (!recognizeMicrophone.isSupported) {
      micButtonClass += ' base--button_black';
    }


    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <div className="flex buttons">
          <button className={micButtonClass} onClick={this.handleMicClick.bind(this)}>
            <Icon type={this.state.audioSource === 'mic' ? 'stop' : 'microphone'} fill={micIconFill} /> Record Audio
          </button>
        </div>
        <Tabs selected={0}>
          <Pane label="Text">
            {this.state.text}
          </Pane>
        </Tabs>
      </div>
    );
  }
}

export default App;
