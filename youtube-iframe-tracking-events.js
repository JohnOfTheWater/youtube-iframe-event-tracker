/*
Modified version of youtube iframe event tracking originally made by the guys at @lunametrics.
for info http://www.lunametrics.com/blog/2012/10/22/automatically-track-youtube-videos-events-google-analytics/#sr=so&m=r&cp=(sfgfssbm)&ct=/rvftujpot/5832462/zpvuvcf-qmbzfs-usbdljoh-bqj-gps-jgsbnf-fncfe-tmc&ts=1416847286
original github https://github.com/lunametrics/youtube-google-analytics

This is a modified version to make it work properly with my setup.
Also I added a way to track how much (in percantage value) of the video has been watched.






*/
  //----------YOUTUBE IFRAME EVENT TRACKING------------------//

var tag = document.createElement('script');
tag.src = "//www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var videoArray = new Array();
var playerArray = new Array();

var videoTitle = new Array();

var showTitle = 3;

var reloadFrames = 1;

function trackYouTube()
{

  var i = 0;

  jQuery('iframe').each(function() {
    
    if(jQuery(this).attr('src')){
      
      var video = jQuery(this);
      var vidSrc = video.attr('src');
      
      if(reloadFrames){

        var regex1 = /(?:https?:)?\/\/www\.youtube\.com\/embed\/([\w-]{11})(\?)?/;
        var SourceCheckA = vidSrc.match(regex1);
        if(SourceCheckA[2]=="?"){

          var regex2 = /enablejsapi=1/;
          var SourceCheckB = vidSrc.match(regex2);
          if(SourceCheckB){

          }else{

            vidSrc = vidSrc + "&enablejsapi=1";
          }

          var regex2 = /origin=.*/;
          var SourceCheckC = vidSrc.match(regex2);
          if(SourceCheckC){
            for (j=0; j<SourceCheckC.length; j++) {

              newOrigin = "origin=" + window.location.hostname;
              var vidSrc = vidSrc.replace(regex2,newOrigin);
            }
          }else{

            vidSrc = vidSrc + "&origin=" + window.location.hostname;
          }
        }else{

          vidSrc = vidSrc + "?enablejsapi=1&origin=" + window.location.hostname;
        }

        video.attr('src', vidSrc);
      }

      var regex = /(?:https?:)?\/\/www\.youtube\.com\/embed\/([\w-]{11})(?:\?.*)?/;
      var matches = vidSrc.match(regex);

      if(matches && matches.length > 1){

        videoArray[i] = matches[1];

        video.attr('id', matches[1]); 

        getRealTitles(i);

        i++;      
      }
    }
  }); 
}

function getRealTitles(j) {
  if(showTitle==2){
    playerArray[j] = new YT.Player(videoArray[j], {
        videoId: videoArray[j],
        events: {
          'onStateChange': onPlayerStateChange
      }
    }); 
  }else{
    
      var tempJSON = jQuery.getJSON('http://gdata.youtube.com/feeds/api/videos/'+videoArray[j]+'?v=2&alt=json',function(data,status,xhr){

        videoTitle[j] = data.entry.title.$t;
        // var duration = data.entry.media$group.yt$duration.seconds; 
        // console.dir(duration);

      playerArray[j] = new YT.Player(videoArray[j], {
          videoId: videoArray[j],
          events: {
            'onStateChange': onPlayerStateChange
        }
      });
      });
  }
}

jQuery('document').ready(function() {
    trackYouTube();
    // console.log('start');
});

function onPlayerReady(event) {
  //event.target.playVideo();
}

var pauseFlagArray = new Array();

function onPlayerStateChange(event) { 

  var videoURL = event.target.getVideoUrl();

  var regex = /v=(.+)$/;
  var matches = videoURL.match(regex);
  videoID = matches[1];

  thisVideoTitle = "";

  for (j=0; j<videoArray.length; j++) {

      if (videoArray[j]==videoID) {

          thisVideoTitle = videoTitle[j]||"";
      // console.log(thisVideoTitle);

      if(thisVideoTitle.length>0){
        if(showTitle==3){
          thisVideoTitle = thisVideoTitle + " | " + videoID;
        }else if(showTitle==2){
          thisVideoTitle = videoID;
        }
      }else{
        thisVideoTitle = videoID;
      }

      var refreshIntervalId = 0;

      function trackDuration(event, title, stop){
        var duration = parseInt(event.target.getDuration());
        var currentTime = parseInt(event.target.getCurrentTime());
        var oneQuarter = duration/4,
          half = duration/2,
          threeQuarter = oneQuarter*3;

              refreshIntervalId = setInterval(function(){

              currentTime += 1;


              if(currentTime === oneQuarter){
                ga('send', 'event', 'Videos', '25% watched', title);
              }

              if(currentTime === half){
                ga('send', 'event', 'Videos', '50% watched', title);
              }

              if(currentTime === threeQuarter){
                ga('send', 'event', 'Videos', '75% watched', title);
              }

              if(currentTime === duration || stop === 'true'){

              for (var i = 1; i < 500; i++){
                window.clearInterval(i);
              }
              }
              // if(stop === 'true'){
              //  clearInterval(refreshIntervalId);
              // }
            }, 1000);
      }

            if (event.data == YT.PlayerState.PLAYING) {
        // _gaq.push(['_trackEvent', 'Videos', 'Play', thisVideoTitle]);
              ga('send', 'event', 'Videos', 'Play', thisVideoTitle);
            pauseFlagArray[j] = false;
            var stop = 'false';
            trackDuration(event, thisVideoTitle, stop);
          } 

          if (event.data == YT.PlayerState.ENDED){
        // _gaq.push(['_trackEvent', 'Videos', 'Watch to End', thisVideoTitle]); 
            ga('send', 'event', 'Videos', 'Watch to End', thisVideoTitle);
          } 

          if (event.data == YT.PlayerState.PAUSED && pauseFlagArray[j] != true){
        // _gaq.push(['_trackEvent', 'Videos', 'Pause', thisVideoTitle]); 
            ga('send', 'event', 'Videos', 'Pause', thisVideoTitle);

            pauseFlagArray[j] = true;
            var stop = 'true';
            trackDuration(event, thisVideoTitle, stop);
          }

          if (event.data == YT.PlayerState.BUFFERING){
        // _gaq.push(['_trackEvent', 'Videos', 'Buffering', thisVideoTitle]); 
            ga('send', 'event', 'Videos', 'Buffering', thisVideoTitle);
          }

          if (event.data == YT.PlayerState.CUED){
        // _gaq.push(['_trackEvent', 'Videos', 'Cueing', thisVideoTitle]); 
            ga('send', 'event', 'Videos', 'Cueing', thisVideoTitle);
          }

      }
  }
} 
