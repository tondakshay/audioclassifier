import './App.css';
import React from 'react';

// atob is deprecated but this function converts base64string to text string
const decodeFileBase64 = (base64String) => {
  // From Bytestream to Percent-encoding to Original string
  return decodeURIComponent(
    atob(base64String).split("").map(function (c) {
      return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
    }).join("")
  );
};


function App() {
  const [inputFileData, setInputFileData] = React.useState(''); // represented as bytes data (string)
  const [outputFileData, setOutputFileData] = React.useState(''); // represented as readable data (text string)
  let [spectrogramData, setSpectrogramData] = React.useState('');
  let [barGraphData, setBarGraphData] = React.useState('');
  const [buttonDisable, setButtonDisable] = React.useState(true);
  const [audioPlayerDisable, setAudioPlayerDisable] = React.useState(true);
  const [buttonText, setButtonText] = React.useState('Submit');

  // convert file to bytes data
  const convertFileToBytes = (inputFile) => {
    console.log('converting file to bytes...');
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(inputFile); // reads file as bytes data

      fileReader.onload = () => {
        resolve(fileReader.result);
      };

      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  }

  // handle file input
  const handleChange = async (event) => {
    // Clear output text.
    setOutputFileData("");
    setSpectrogramData("");
    setBarGraphData("");

    console.log('newly uploaded file');
    const inputFile = event.target.files[0];
    console.log(inputFile);

    //show audio player
    var sound = document.getElementById('audio');
    sound.src = URL.createObjectURL(inputFile);
    sound.onend = function(e) {
      URL.revokeObjectURL(this.src);
    }

    // convert file to bytes data
    const base64Data = await convertFileToBytes(inputFile);
    const base64DataArray = base64Data.split('base64,'); // need to get rid of 'data:image/png;base64,' at the beginning of encoded string
    const encodedString = base64DataArray[1];
    setInputFileData(encodedString);
    console.log('file converted successfully');

    // enable submit button
    setButtonDisable(false);
    setAudioPlayerDisable(false);


  }



  // handle file submission
  const handleSubmit = (event) => {
    event.preventDefault();

    // temporarily disable submit button
    setButtonDisable(true);
    setButtonText('Loading Results.. please wait !');

    // make POST request
    console.log('making POST request...');
    fetch('https://0ineklnq2e.execute-api.us-east-1.amazonaws.com/prod/', {
      method: 'POST',
      headers: { "Content-Type": "application/json", "Accept": "text/plain" },
      body: JSON.stringify({ "image": inputFileData })
    }).then(response => response.json())
    .then(data => {
      console.log('getting response...')
      console.log(data);

      // POST request error
      if (data.statusCode === 400) {
        const outputErrorMessage = JSON.parse(data.errorMessage)['outputResultsData'];
        setOutputFileData(outputErrorMessage);
      }

      // POST request success
      else {
        const outputBytesData = JSON.parse(data.body)['outputResultsData'];
        setOutputFileData(decodeFileBase64(outputBytesData));
        let spectrogramData = JSON.parse(data.body)['spectrogramData'];
        spectrogramData = "data:image/png;base64,".concat(spectrogramData);
        setSpectrogramData(spectrogramData);
        let barGraphData = JSON.parse(data.body)['graphData'];
        barGraphData = "data:image/png;base64,".concat(barGraphData);
        setBarGraphData(barGraphData);
      }

      // re-enable submit button
      setButtonDisable(false);
      setButtonText('Submit');
    })
    .then(() => {
      console.log('POST request success');
    })
  }

  return (
    <div className="App">
      <div className="Input">
        <div class="back">
        <script src="jquery-3.5.1.min.js"></script>
        <h1>Welcome to the Online Audio Classifier !</h1>
        </div>
        <form onSubmit={handleSubmit}>
          <br/>
          <input class="custom-file-input" type="file" accept=".wav" onChange={handleChange} />
          <br/><br/>
          <p disabled={audioPlayerDisable}>Here is your audio :</p>

          <audio disabled={audioPlayerDisable} id="audio" controls>
          </audio><br/><br/>
          <div id="waveform"></div>
          <button class="button" type="submit" disabled={buttonDisable}>{buttonText}</button>
        </form>
        
      </div>
      <div className="Output">
        <h1>Results</h1>
        <div class="multiline">
        <p>{outputFileData}</p> 
        </div>
        <img src={barGraphData}></img>
        <br/>
        <p> Melspectrogram plot of the Audio:</p>
        <img src={spectrogramData}></img>
        
      </div>
    </div>
  );
}

export default App;