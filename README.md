# Projet Long : Rapport de Conception

## Table of contents
* [General information](#general-info)
* [Technologies](#technologies)
* [Setup](#setup)
* [Front-End](#front-end)
* [Back-End](#back-end)
* [Improvements](#improvements)
## General info
Screen interface + petite présentation
## Technologies
* docker-compose version : 1.26.0
* vue version : 2.6.10
* Java ...
* Typescript ..
* MaryTTS

[MaryTTS](http://mary.dfki.de/) is a multilingual open source Text-To-Speech Synthesis platform written in Java that is relatively simple to use (a simple speech synthesis interface can be found  [here](http://mary.dfki.de:59125/)).

MaryTTS can be installed using a variety of [methods](https://github.com/marytts/marytts), including adding the MaryTTS dependencies to the [build.gradle](https://github.com/oxymore-tech/baku/blob/TTS/back/build.gradle) file in a Java project that uses Gradle, such as  [Baku](https://github.com/oxymore-tech/baku/tree/TTS):
```
repositories {
    jcenter()
}

dependencies {
    compile group: 'de.dfki.mary', name: 'voice-cmu-slt-hsmm', version: '5.2'
    compile group: 'de.dfki.mary', name: 'voice-upmc-pierre-hsmm', version: '5.2'
    compile group: 'de.dfki.mary', name: 'voice-upmc-jessica-hsmm', version: '5.2'
    compile group: 'de.dfki.mary', name: 'voice-enst-camille-hsmm', version: '5.2'
    compile group: 'de.dfki.mary', name: 'voice-enst-dennys-hsmm', version: '5.2'
}
```
Although only a few voices were imported, there are many more available that can be added later if necessary, and their references can be found [here](https://github.com/marytts/marytts/blob/master/download/marytts-components.xml).

## Setup
Install docker-compose and run the following commands:
```
$ cd ../baku
$ sudo docker-compose build
$ sudo docker-compose up
```
Open [http://localhost/](http://localhost/) in your browser to see the running application.

Once you've arrived at the baku-studio page, you can change the URL as follows: instead of /admin, use {movie share link} + /audio to navigate to the page we worked on. Here is an example of what the URL should look like: https://localhost/movies/3871e730-de32-493e-9975-eaf5c60d2441/audio.

## Front-End
### **[TTSPopup.vue](https://github.com/oxymore-tech/baku/blob/TTS/front/src/components/tts/TTSPopup.vue)**
This is the component that enables the use of the new Text-To-Speech functionality. The [AudioListComponent.vue](https://github.com/oxymore-tech/baku/blob/TTS/front/src/components/audio/AudioListComponent.vue)  component has been updated with a new "*Convertir un texte en son*" button that opens the TTSPopup.

Two functions allow the user to create an audio :
* ``listenAudio()`` : sends a POST request to the back-end, where MaryTTS creates a preview wav file in which the sound is stored (this file is updated each time we call this function), and the audio is played using the Audio Web API:

```
let url = api.getSoundUrl(this.projectId, 'preview') + "?cb=" + new Date().getTime();
let audio = new Audio(url);
await audio.play();
```
* ``generateAudio()`` : sends a POST request to the back-end in order to generate an audio file that will be stored in ``/api/{projectId}/sounds/{soundId}``. The audio is also added to the store once the file is created:
```
let blob = await fetch(api.getSoundUrl(this.projectId, audioId))
    .then(res => res.blob())
    .then(data => new Blob ([data], { type: 'audio/wav' }));
    await this.$store.dispatch('project/createWav', {
        title : "Son " + this.fileName.toString(),
        sound: blob,
        duration: response.duration,
        projectId: this.projectId,
        audioId: audioId
    });
```

### POST request

When a user wants to create an audio file (either to listen to it or to add it to a project), a POST HTTP request is sent to the back using this method, which creates a JSON file with all of the information needed for MaryTTS to create an audio file.
```
generateWav(projectId: string, inputText: string, inputVoice: any, inputFileName: string) {
    return axios.post(`/api/${projectId}/saveWav`, {
        text: inputText,
        voice: inputVoice,
        fileName: inputFileName
    }).then(response => {
        return response.data;
    }).catch(error => {
        console.log(error);
    })
}
```
### Store update

When the audio file is successfully created, a response with a JSON file containing two pieces of information is received:
* the path of the audio that has been created
* the duration of the audio

We can use this information to create a new event in our [store](https://github.com/oxymore-tech/baku/blob/TTS/front/src/store/project.ts): this will keep track of our history.
```
async createWav(context: any, params: {title : string, sound : Blob, duration : number, projectId : string, audioId : string}) {
    const event = makeEvent(context, BakuAction.AUDIO_ADD_WAV, params);
    loadEvents(context, [event]);
    await store.dispatch('user/updateCurrentSeenProject');
}
```
And this event will update our store's audio list in [movie.service.ts](https://github.com/oxymore-tech/baku/blob/TTS/front/src/utils/movie.service.ts):
```
case BakuAction.AUDIO_ADD_WAV: {
    const {title, sound, duration, audioId } = event.value as { title: string, sound: Blob, duration: number, audioId: string };
    audios.push({
        id: audioId,
        title: title,
        sound: sound,
        volume: 100,
        duration: duration,
    });
    break;
}
```
After completing all of these steps, the audio is added to our store and can be viewed in [Audio.vue](https://github.com/oxymore-tech/baku/blob/TTS/front/src/views/AudioView.vue).
### Design update
We have worked with Baku's designer who gave us a visual model and a set of icons.
To modify the previous icons, the set of new icons had to be downloaded from the [IcoMoon app](https://icomoon.io/app/#/select) and put them in the baku/front/src/assets.
Then, depending on what element needs to be modified, AudioListComponenet.vue or AudioView.vue need to be slightly changed with new icons' names


## Back-End
**[TTSController.java](https://github.com/oxymore-tech/baku/blob/TTS/back/src/main/java/com/bakuanimation/rest/TTSController.java)**

This is the class that responds to HTTP requests. It uses a JSON file that contains the parameters needed to generate an audio file (the voice and the text), then calls an instance of TTSServiceImpl that will create the audio file and respond with a JSON file containing the path of the newly created audio file and the duration of the audio.
```
@Post("/api/{projectId}/saveWav")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public TTSResponse saveWav(@PathVariable String projectId, @Body TTSdata data)
```

### [TTSdata.java](https://github.com/oxymore-tech/baku/blob/TTS/back/src/main/java/com/bakuanimation/model/TTSdata.java)

This class represents the data sent in the front-end's POST HTTP request; it is used to collect all of the elements required by MaryTTS to generate a wav file.
```
@JsonCreator
public TTSdata( 
    @JsonProperty("voice") String voice,
    @JsonProperty("text") String text,
    @JsonProperty("fileName") String fileName) {
  
    this.voice = voice;
    this.text = text;
    this.fileName = fileName;
}
```



### [TTSResponse.java](https://github.com/oxymore-tech/baku/blob/TTS/back/src/main/java/com/bakuanimation/model/TTSResponse.java)

This class is used to generate a JSON that will be stored inside the response of the POST request from the front, and it contains the duration of the audio file as well as its path.
```
@JsonCreator
public TTSResponse( 
    @JsonProperty("path") String path,
    @JsonProperty("duration") double duration) {
      
    this.path = path;
    this.duration = duration;
}
```

### [TTSServiceImpl.java](https://github.com/oxymore-tech/baku/blob/TTS/back/src/main/java/com/bakuanimation/service/TTSServiceImpl.java)

TTSServiceImpl.java implements the TTSService.java interface and includes a unique function generateWav. In order to perform TTS functionality, this function makes use of the library MaryTTS. The text spoken is saved as a.wav file.

```
public void generateWav(String inputText, String voice, String projectId, String file)
```

### [HistoryServiceImpl.java](https://github.com/oxymore-tech/baku/blob/TTS/back/src/main/java/com/bakuanimation/service/HistoryServiceImpl.java)

This class has been updated, and it now includes a new TTS Audio in the audio list at the back.
```
case AUDIO_ADD_WAV: {
    String audioId = element.getValue().get("audioId").asText();
    String title = element.getValue().get("title").asText();
    double duration = element.getValue().get("duration").asDouble();
    InputStream sound = IOUtils.toInputStream(element.getValue().get("sound").asText());
    audios.add(new Audio(audioId, title, sound, sound, 100, duration));
    break;
}
```

## Improvements

Even though most of the TTS functionality that was required has been added, there is still some improvements
that can be made, for example :
* most of the design of the audio page was updated but the feature linking and synchronizing an audio with a
movie still needs to be worked on.
* another upgrade could be changing how an audio is stored. We currently cannot tell in our audioList if an
item is either a TTS or a recorded audio file. If we can find a way to tell the difference, having for example two
objects AudioTTS and AudioRecord that extend our actual Audio object; then we can store in our AudioTTS
object the text that was converted, and allow the user change it without having to delete the audio 
and create another one.




