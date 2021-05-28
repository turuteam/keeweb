/* eslint-disable import/no-commonjs */

const Libs: Record<string, unknown> = {
    kdbxweb: require('kdbxweb'),
    preact: require('preact'),
    pikaday: require('pikaday'),
    qrcode: require('jsqrcode')
};

const PluginApi = {
    require(module: string): unknown {
        return Libs[module]; // || require('../' + module); // TODO: enable after migration
    }
};

export { PluginApi };
