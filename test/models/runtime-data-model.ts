import { expect } from 'chai';
import { RuntimeData } from 'models/runtime-data';

describe('RuntimeData', () => {
    afterEach(() => {
        RuntimeData.reset();
    });

    it('sets an known property', () => {
        RuntimeData.skipFolderRightsWarning = true;
        expect(RuntimeData.skipFolderRightsWarning).to.eql(true);
        expect(RuntimeData.get('skipFolderRightsWarning')).to.eql(true);

        RuntimeData.reset();
        expect(RuntimeData.skipFolderRightsWarning).to.eql(undefined);
        expect(RuntimeData.get('skipFolderRightsWarning')).to.eql(undefined);
    });

    it('sets an unknown property', () => {
        const model = RuntimeData as unknown as Record<string, unknown>;

        model.x = 'xx';
        expect(model.x).to.eql('xx');
        expect(RuntimeData.get('x')).to.eql('xx');
        expect(RuntimeData.toJSON()).to.eql({ x: 'xx' });

        RuntimeData.delete('x');
        expect(RuntimeData.get('x')).to.eql(undefined);
        expect(RuntimeData.toJSON()).to.eql({});

        const isSet = RuntimeData.set('x', 'y');
        expect(isSet).to.eql(true);
        expect(model.x).to.eql('y');
        expect(RuntimeData.get('x')).to.eql('y');
        expect(RuntimeData.toJSON()).to.eql({ x: 'y' });

        RuntimeData.reset();
        expect(model.x).to.eql(undefined);
        expect(RuntimeData.get('x')).to.eql(undefined);
        expect(RuntimeData.toJSON()).to.eql({});
    });

    it('loads values and saves them on change', async () => {
        const model = RuntimeData as unknown as Record<string, unknown>;

        localStorage.setItem('runtimeData', '{ "x": "xx" }');

        expect(model.x).to.eql(undefined);

        await RuntimeData.init();

        expect(model.x).to.eql('xx');
        expect(localStorage.getItem('runtimeData')).to.eql('{ "x": "xx" }');

        model.x = 'xx';
        expect(localStorage.getItem('runtimeData')).to.eql('{ "x": "xx" }');

        model.x = 'y';
        expect(localStorage.getItem('runtimeData')).to.eql('{"x":"y"}');

        RuntimeData.disableSaveOnChange();

        model.x = 'z';
        expect(localStorage.getItem('runtimeData')).to.eql('{"x":"y"}');
    });
});
