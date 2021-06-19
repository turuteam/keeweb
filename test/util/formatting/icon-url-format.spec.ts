import { expect } from 'chai';
import { IconUrlFormat } from 'util/formatting/icon-url-format';

describe('IconUrlFormat', () => {
    it('converts to dataurl', () => {
        expect(IconUrlFormat.toDataUrl(new Uint8Array([1, 2]))).to.eql(
            'data:image/png;base64,AQI='
        );
    });

    it('converts to base64', () => {
        expect(IconUrlFormat.dataUrlToBase64('data:image/png;base64,AQI=')).to.eql('AQI=');
    });
});
