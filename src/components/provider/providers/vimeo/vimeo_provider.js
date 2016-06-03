import BaseProvider from '../base_provider';
import VimeoModel from './vimeo_model';
import {PROVIDERS_LIST} from '../../../../constants/providers';

/**
 * @see: https://developer.vimeo.com/player/embedding
 * @see: https://player.vimeo.com/playground
 */
class VimeoProvider extends BaseProvider {
    static CLASS = 'VimeoProvider';
    PROVIDER = PROVIDERS_LIST.VIMEO;


    el = null;
    player = null;
    vimeoPath = '//player.vimeo.com/video/{{VIDEO_ID}}?api=1&player_id=VimeoProvider';


    init() {
        this.scriptLoad();
    }


    /**
     *
     */
    scriptLoad() {
        let tag = document.createElement('script'),
            firstScriptTag = document.getElementsByTagName('script')[0];

        tag.src = 'https://f.vimeocdn.com/js/froogaloop2.min.js';
        tag.onload = this._initPlayer.bind(this);

        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        return this;
    }


    getPlayerContainer() {
        if (null !== this.el) return this.el;

        this.el = document.createElement('iframe');
        this.el.id = VimeoProvider.CLASS;
        this.el.src = this.vimeoPath;
        this.el.width = this.config.width;
        this.el.height = this.config.height;
        this.hide();

        return this.el;
    }


    _initPlayer() {
        this.player = window.$f(VimeoProvider.CLASS);
    }


    onReady() {
        this.player.api('play');

        this.player.addEvent('loadProgress', this.onLoadProgress.bind(this));
        this.player.addEvent('playProgress', this.onPlayProgress.bind(this));
        this.player.addEvent('pause', this.onPause.bind(this));
        this.player.addEvent('finish', this.onFinish.bind(this));
    }


    onPause() {
        console.log('paused event');
    }


    onFinish() {
        console.log('finished event');
    }


    onPlayProgress(data) {
        console.log('playProgress event : ' + data.seconds + ' : ' + data.percent + ' : ' + data.duration);
    }


    onLoadProgress(data) {
        console.log('loadProgress event : ' + data.percent + ' : ' + data.bytesLoaded + ' : ' + data.bytesTotal + ' : ' + data.duration);
    }


    render() {
        return this.getPlayerContainer();
    }


    setModel(song) {
        this.model = VimeoModel.create(song);

        return this;
    }


    /**
     *
     */
    pause() {
        this.player.api('pause');
    }


    /**
     *
     */
    load(song) {
        this.setModel(song);

        this.player.addEvent('ready', this.onReady.bind(this));

        this.el.src = this.vimeoPath.replace('{{VIDEO_ID}}', this.model.id);
    }
}

export default VimeoProvider;