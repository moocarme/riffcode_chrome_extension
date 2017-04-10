console.log('startup');

function addScript(scriptURL, onload) {
    var parent_head = document.getElementsByTagName("head")[0];
   var script = document.createElement('script');
   script.setAttribute("type", "application/javascript");
   script.setAttribute("src", scriptURL);
   if (onload) script.onload = onload;
   //parent_head.insertBefore(script, parent_head.firstChild)
   document.documentElement.appendChild(script);
}

function addSecondScript(scriptURL){
    addScript(chrome.extension.getURL(scriptURL), getWeights);
}

addScript(chrome.extension.getURL("js/jquery.min.js"), addSecondScript("js/ramda.min.js"));


function getDifficulty(weights) {
    var $tabContent = $('.js-tab-content').find('span');
    console.log($tabContent[0]);
    var chords = [];
    for(var i in $tabContent){
        var tmp = $tabContent[i].innerText;
        if(typeof tmp != 'undefined'){
            chords.push(tmp);
        }
    }
    var totalChords = chords.length;
    console.log(chords);
    var counts = R.countBy(r => r)(chords);
    var uniqueChords = Object.keys(counts).length;
    console.log(counts);

    //--- Display the results.
    var countReport = '';
    var difficultyScores = {};
    for(var difficulty in weights){
        difficultyScores[difficulty] = weights[difficulty].NumChords * uniqueChords +weights[difficulty].intercept;
        for(var chord in counts){
            if(weights[difficulty].hasOwnProperty(chord)){
                difficultyScores[difficulty] += weights[difficulty][chord] * counts[chord] / totalChords;
            } else{
                difficultyScores[difficulty] += weights[difficulty].other * counts[chord] / totalChords;
            }
        }
    }
    console.log(difficultyScores);
    var prediction = Object.keys(difficultyScores).reduce(function(a, b){ return difficultyScores[a] > difficultyScores[b] ? a : b;});

    var displayText = ('Prediction is ' + prediction);
    console.log(displayText);

    //--- Display results to the user.
    $(document).ready(function(){
        $("#status").text(displayText)
                    .css('color', 'yellow')
                    .css('position', 'fixed')
                    .css('z-index', '999999')
                    .css('background', 'black')
                    .css('width', '100%');
    });
    console.log(displayText);

}

function getWeights(){
  var url = 'https://s3.amazonaws.com/chordml-weights/ukulele_chord_weights.json';
  console.log('fetching ' + url);
  fetchURL(
      url,
      function callback(data) {
        console.log('response:' + data);
      });
}

function fetchURL(url, callback)
{
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function(data)
  {
    if(xhr.readyState == 4)
    {
      if(xhr.status == 200)
      {
        var data = JSON.parse(xhr.responseText);
        console.log(data);
        $(document).ready(function(){
            $('body').prepend('<div id="status">TEXT</div>')
        });

        getDifficulty(data);
        callback(data);
      }
      else
      {
        callback(null);
      }
    }
  }
  // Note that any URL fetched here must be matched by a permission in
  // the manifest.json file!
  xhr.open('GET', url, true);
  xhr.send();
};
