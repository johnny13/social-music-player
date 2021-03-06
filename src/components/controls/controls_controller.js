import Event from 'event-emitter-js';
import BaseController from '../../base/base_controller';
import Config from '../../core/config';
import {SYSTEM_EVENTS, DOM_EVENTS} from '../../constants/events';
import {PLAYER_STATE} from '../../constants/state';
import {PROVIDERS_LIST} from '../../constants/providers';
import DOM from '../../utils/dom';
import _ from '../../utils/__';
import PlayerMarkupHTML from './view/controls_markup.html';
import PlayerButtons from './svg/player_buttons.svg';

import YoutubeLogo from '../../components/provider/providers/youtube/logo/youtube.logo.svg';
import VimeoLogo from '../../components/provider/providers/vimeo/logo/vimeo.logo.svg';
import SoundCloudLogo from '../../components/provider/providers/soundcloud/logo/soundcloud.logo.svg';


/**
 *
 */
class ControlsController extends BaseController {
    static CLASS = 'ControlsController';
    static selectorClass = '.smp_controller';

    song = null;


    /**
     *
     */
    init(params) {
        this.logger.debug('ControlsController INIT fired');
        this.subscribe();
        this._loadShapes();
    }


    /**
     *
     */
    _loadShapes() {
        DOM.append(PlayerButtons, DOM.getBody());
        DOM.append(YoutubeLogo, DOM.getBody());
        DOM.append(VimeoLogo, DOM.getBody());
        DOM.append(SoundCloudLogo, DOM.getBody());

        return this;
    }


    /**
     *
     */
    subscribe() {
        Event.on(SYSTEM_EVENTS.PLAY, () => {
            console.log('CONTROLLER PLAY ARRIVED!!');
        });

        Event.on(SYSTEM_EVENTS.STATE_CHANGED, this.onStateChange.bind(this));
        Event.on(SYSTEM_EVENTS.PLAY_PROGRESS, this.onProgressUpdate.bind(this));
        Event.on(SYSTEM_EVENTS.NEW_SONG_PLAYING, this.onSongChange.bind(this));
        Event.on(SYSTEM_EVENTS.PLAYER_INITIALIZED, this.onInitialize.bind(this));
        Event.on(SYSTEM_EVENTS.VOLUME, this.onVolume.bind(this));
        Event.on(SYSTEM_EVENTS.MUTE, this.onMute.bind(this));
        Event.on(SYSTEM_EVENTS.UNMUTE, this.onUnmute.bind(this));

        window.addEventListener(DOM_EVENTS.ON_RESIZE, this.onResize.bind(this), true);
    }


    /**
     *
     */
    onSongChange(song) {
        this.song = song;
        this.onResize();
        this._updateSong();
    }


    /**
     *
     */
    _updateSong() {
        this.onProgressUpdate({
            percent: 0,
            seconds: 0
        });

        DOM.$$('.controls-list .title').innerHTML = this.song.title;
        DOM.$$('.controls-list .duration').innerHTML = _.formatTime(this.song.duration);

        this.showActiveProvider();
    }


    /**
     *
     */
     showActiveProvider() {
         let activeProviderClass = this.getProviderClassName(this.song.provider),
             providersClassNames = ['youtube', 'vimeo', 'soundcloud'];

        providersClassNames.forEach(className => {
            if (className === activeProviderClass) {
                DOM.$$('.controls-list .providers .'+ className +' a').href = this.song.url;

                return DOM.$$('.controls-list .providers .'+className).classList.remove('hide');
            }

            DOM.$$('.controls-list .providers .'+ className).classList.add('hide');
        });

     }


    /**
     *
     */
    onInitialize() {
        this.onResize();

        DOM.$$('.progress-bar').addEventListener('click', event => {
            this.mouseProgressScrubbar(event);
        });

        DOM.$$('.volume .volume-progress').addEventListener('click', event => {
            this.mouseVolumeControl(event);
        });

        DOM.$$('.play-pause .play').addEventListener('click', event => {
            Event.fire(SYSTEM_EVENTS.PLAY);
        });

        DOM.$$('.play-pause .pause').addEventListener('click', event => {
            Event.fire(SYSTEM_EVENTS.PAUSE);
        });

        DOM.$$('.volume .mute').addEventListener('click', event => {
            Event.fire(SYSTEM_EVENTS.UNMUTE);
        });

        DOM.$$('.volume .unmute').addEventListener('click', event => {
            Event.fire(SYSTEM_EVENTS.MUTE);
        });
    }


    /**
     *
     */
    mouseVolumeControl(e) {
        let mouseX = e.pageX,
			volumeObj = DOM.$$('.volume-progress'),
			volumeObjWidth = DOM.getDimensions('.volume-progress').width,
			volume = 0;

        switch(e.type) {
            case 'click':
                volume = (mouseX - volumeObj.offsetLeft) / volumeObjWidth;

                if (0.9 < volume) {
                    volume = 1;
                } else
                if (0.1 > volume) {
                    volume = 0;
                }

                break;
        }

        Event.fire(SYSTEM_EVENTS.VOLUME, volume);
    }


    /**
     *
     */
    onMute(silentUpdate = false) {
        DOM.$$('.volume .mute').classList.remove('hide');
        DOM.$$('.volume .unmute').classList.add('hide');

        if (true !== silentUpdate)
            Event.fire(SYSTEM_EVENTS.VOLUME, 0);
    }


    /**
     *
     */
    onUnmute(silentUpdate = false) {
        DOM.$$('.volume .mute').classList.add('hide');
        DOM.$$('.volume .unmute').classList.remove('hide');

        if (true !== silentUpdate)
            Event.fire(SYSTEM_EVENTS.VOLUME, 1);
    }


    /**
     *
     */
    onVolume(volume) {
        if (0.9 < volume) {
            this.onUnmute(true);
        } else
        if (0.1 > volume) {
            this.onMute(true);
        } else {
            this.onUnmute(true);
        }

        DOM.$$('.volume-progress .volume-bar-value').style.width = volume * 100 + '%';
    }


    /**
     *
     */
    mouseProgressScrubbar(e) {
        let mouseX = e.pageX,
            scrubber = DOM.$$('.progress-bar'),
            scrubberWidth = DOM.getDimensions('.progress-bar').width;

        switch(e.type) {
           	case 'click':
                let percent = (mouseX - scrubber.offsetLeft) / scrubberWidth;
                percent = Math.round(percent * 100) / 100;

                Event.fire(SYSTEM_EVENTS.SEEK_TO_PERCENT, percent);
                break;

            default:
                break;
        }
    }


    /**
     *
     */
    onProgressUpdate(progress) {
        DOM.$$('.progress-bar .play-bar').style.width = progress.percent + '%';
        DOM.$$('.controls-list .current-time').innerHTML = _.formatTime(progress.seconds);
    }


    /**
     *
     */
    onStateChange(playerState) {
        switch(playerState) {
            case PLAYER_STATE.BUFFERING:
            case PLAYER_STATE.PLAYING:
                this.showPauseButton();
                break;

            case PLAYER_STATE.PAUSED:
            case PLAYER_STATE.ENDED:
                this.showPlayButton();
                break;

            default:
                break;
        }
    }


    /**
     *
     *
     */
    showPlayButton() {
        DOM.$$('.play-pause .play').classList.remove('hide');
        DOM.$$('.play-pause .pause').classList.add('hide');
    }


    /**
     *
     *
     */
    showPauseButton() {
        DOM.$$('.play-pause .play').classList.add('hide');
        DOM.$$('.play-pause .pause').classList.remove('hide');
    }


    /**
     *
     *
     */
    onResize() {
        this.setPlayerWidth();

        return this;
    }


    /**
     *
     *
     */
    setPlayerWidth() {
        let config = Config.create();

        let playerEl = DOM.getDimensions(config.elID).width,
            playPauseEl = DOM.getDimensions(config.elID+' .play-pause').width,
            currentTimeEl = DOM.getDimensions(config.elID+' .current-time').width,
            durationEl = DOM.getDimensions(config.elID+' .duration').width,
            slack = 44;

        DOM.$$(config.elID+' .controls-list').style.width = playerEl - playPauseEl - 20 + 'px';

        DOM.$$(config.elID+' .scrabber .progress-bar').style.width = playerEl - playPauseEl - currentTimeEl - durationEl - slack + 'px';

        return this;
    }



    /**
     *
     */
    getTemplate() {
        return PlayerMarkupHTML;
    }


    /**
     *
     */
    render() {
        let config = Config.create();

        return this.getTemplate();
    }


    /**
     *
     */
    getProviderClassName(provider) {
        switch(provider) {
            case PROVIDERS_LIST.YOUTUBE:
                return 'youtube';

            case PROVIDERS_LIST.VIMEO:
                return 'vimeo';

            case PROVIDERS_LIST.SOUNDCLOUD:
                return 'soundcloud';
        }

        return 'no_provider';
    }

}

export default ControlsController;