import * as kdbxweb from 'kdbxweb';
import { Model } from 'util/model';
import { PasswordGenerator, PasswordGeneratorOptions } from 'util/generators/password-generator';
import { Position } from 'util/types';

class GeneratorState extends Model {
    visible = false;
    pos: Position = {};
    opt?: PasswordGeneratorOptions;
    selectedPreset?: PasswordGeneratorOptions;
    showToggleButton = false;
    showPresetEditor = false;
    copyResult = true;
    password = '';
    derivedPreset?: PasswordGeneratorOptions;

    hide() {
        this.visible = false;
    }

    show(pos: Position) {
        this.batchSet(() => {
            this.reset();
            this.pos = pos;
            this.visible = true;
        });
    }

    showWithPassword(pos: Position, password: kdbxweb.ProtectedValue) {
        this.batchSet(() => {
            this.reset();
            this.pos = pos;
            this.derivedPreset = PasswordGenerator.deriveOpts(password);
            this.opt = this.derivedPreset;
            this.visible = true;
        });
    }
}

const instance = new GeneratorState();

export { instance as GeneratorState };
