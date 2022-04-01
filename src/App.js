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

function convertURIToBinary(dataURI) {
  let BASE64_MARKER = ';base64,';
  let base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
  let base64 = dataURI.substring(base64Index);
  let raw = window.atob(base64);
  let rawLength = raw.length;
  let arr = new Uint8Array(new ArrayBuffer(rawLength));

  for (let i = 0; i < rawLength; i++) {
    arr[i] = raw.charCodeAt(i);
  }
  return arr;
}
const DROPDOWN_API_ENDPOINT = 'https://qyst0wsnm1.execute-api.us-east-1.amazonaws.com/prod/';



function App() {
  const [inputFileData, setInputFileData] = React.useState(''); // represented as bytes data (string)
  const [outputFileData, setOutputFileData] = React.useState(''); // represented as readable data (text string)
  let [spectrogramData, setSpectrogramData] = React.useState('');
  let [barGraphData, setBarGraphData] = React.useState('');
  const [submitButtonText, setSubmitButtonText] = React.useState('Submit');
  const [buttonDisable, setButtonDisable] = React.useState(true);
  const [audioPlayerDisable, setAudioPlayerDisable] = React.useState(true);
  const [buttonText, setButtonText] = React.useState('Classify');
  const [demoDropdownFiles, setDemoDropdownFiles] = React.useState([]);
  const [selectedDropdownFile, setSelectedDropdownFile] = React.useState('');
  const [inputImage, setInputImage] = React.useState(''); // represented as bytes data (string)

  React.useEffect(() => {
    fetch(DROPDOWN_API_ENDPOINT)
    .then(response => response.json())
    .then(data => {
      // GET request error
      if (data.statusCode === 400) {
        console.log('Sorry! There was an error, the demo files are currently unavailable.');
      }
      
      // GET request success
      else {
        console.log("success");
        const s3BucketFiles = JSON.parse(data.body);
        setDemoDropdownFiles(s3BucketFiles["s3Files"]);
      }
    });
  }, [])

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

//handle demo 
  const handleDemo = async () => {
    setOutputFileData("");
    setSpectrogramData("");
    setBarGraphData("");

    console.log('newly uploaded file');
    const inputFile = await import("./Audio.wav");
    var audio = new Audio(inputFile.default);
    console.log(inputFile);

    //show audio player
   // var sound = document.getElementById('audio');
   // sound.src = URL.createObjectURL("Audio.wav");
   // sound.onend = function(e) {
   //   URL.revokeObjectURL(this.src);
    //}

    // convert file to bytes data
    const base64Data = await convertFileToBytes(inputFile);
    const base64DataArray = base64Data.split('base64,'); // need to get rid of 'data:image/png;base64,' at the beginning of encoded string
    const encodedString = base64DataArray[1];
    setInputFileData(encodedString);
    console.log('file converted successfully');

    // enable submit button
    setButtonDisable(false);
    Show_Audio();

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
    Show_Audio();

    setSelectedDropdownFile('');

  }

  // handle demo dropdown file selection
  const handleDropdown = async (event) => {
    setSelectedDropdownFile(event.target.value);

    // temporarily disable submit button
    setButtonDisable(true);
    setSubmitButtonText('Loading Demo File...');

    // only make POST request on file selection
    if (event.target.value) {
      fetch(DROPDOWN_API_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({ "fileName": event.target.value })
      }).then(response => response.json())
      .then(data => {

        // POST request error
        if (data.statusCode === 400) {
          console.log('Uh oh! There was an error retrieving the dropdown file from the S3 bucket.')
        }

        // POST request success
        else {
          console.log("demo file post req success")
          const dropdownFileBytesData = JSON.parse(data.body)['bytesData'];
          setOutputFileData("");
          setSpectrogramData("");
          setBarGraphData("");
      
          //show audio player
          var sound = document.getElementById('audio');
          sound.src = "data:audio/ogg;base64,".concat(dropdownFileBytesData);
          sound.onend = function(e) {
            URL.revokeObjectURL(this.src);
          }
      
          setInputFileData(dropdownFileBytesData);
      
          // enable submit button
          setButtonDisable(false);
          Show_Audio();
        }
      });
    }
    else {
      setInputFileData('');
    }
  }

  function Show_Results() {
    var x = document.getElementById("Results");
    x.style.display = "block";
  }

  function Show_Audio() {
    var x = document.getElementById("audioplayer");
    x.style.display = "block";
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
      setButtonText('Classify');
    })
    .then(() => {
      console.log('POST request success');
      Show_Results();
    })
  }

  return (
    <div className="App">
      <div className="Input">


        <div class="back">
        <script src="jquery-3.5.1.min.js"></script>
        <h1>Welcome to the Online Audio Classifier !</h1>
        <p>Developed by Akshay Tondak</p>
        <p>(Feedback? Write to akshayt@umich.edu)</p>
        </div>
        <form onSubmit={handleSubmit}>
          <br/>
          <input class="custom-file-input" type="file" accept=".wav" onChange={handleChange} /> OR
          <label htmlFor="demo-dropdown"> </label>
          <select class="custom-file-input" name="Select Audio" id="demo-dropdown" value={selectedDropdownFile} onChange={handleDropdown}>
            <option value="">-- Select Demo File --</option>
            {demoDropdownFiles.map((file) => <option key={file} value={file}>{file}</option>)}
          </select>
          <br/><br/>
          <div id="audioplayer" class="Output">
            Here is your audio :<br/><br/>
          <audio disabled={audioPlayerDisable} id="audio" controls>
          </audio><br/><br/>
          
          <button class="button" type="submit" disabled={buttonDisable}>{buttonText}</button>
          </div>
        </form>
        
      </div>
      <div id="Results" className="Output">
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