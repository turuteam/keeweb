import { FunctionComponent } from 'preact';
import { Locale } from 'util/locale';
import { LocalizedWith } from 'views/components/localized-with';
import { Links } from 'const/links';

export const SettingsAboutView: FunctionComponent<{
    version: string;
    isDesktop: boolean;
    year: number;
}> = ({ version, isDesktop, year }) => {
    return (
        <div class="settings__content">
            <h1>
                <i class="fa fa-info settings__head-icon" /> {Locale.setAboutTitle} KeeWeb v
                {version}
            </h1>
            <p>
                <LocalizedWith str={Locale.setAboutFirst}>
                    <a href="https://antelle.net" target="_blank" rel="noreferrer">
                        Antelle
                    </a>
                </LocalizedWith>
                &nbsp;
                <LocalizedWith str={Locale.setAboutSecond}>
                    <a href={Links.License} target="_blank" rel="noreferrer">
                        MIT
                    </a>
                </LocalizedWith>{' '}
                <LocalizedWith str={Locale.setAboutSource}>
                    <a href={Links.Repo} target="_blank" rel="noreferrer">
                        GitHub <i class="fa fa-github-alt bottom" />
                    </a>
                </LocalizedWith>
            </p>
            <a href={Links.Donation} target="_blank" class="settings__donate-btn" rel="noreferrer">
                <span class="settings__donate-btn-top">Become a</span>
                <span class="settings__donate-btn-bottom">Backer</span>
            </a>
            <p>{Locale.setAboutBuilt}:</p>
            <h3>Libraries</h3>
            <ul>
                {isDesktop ? (
                    <li>
                        <a href="https://electron.atom.io/" target="_blank" rel="noreferrer">
                            electron
                        </a>
                        <span class="muted-color">
                            , cross-platform desktop apps framework, &copy; 2013-2020 GitHub Inc.
                        </span>
                    </li>
                ) : null}
                <li>
                    <a href="https://preactjs.com/" target="_blank" rel="noreferrer">
                        preact
                    </a>
                    <span class="muted-color">
                        , fast 3kB alternative to React with the same modern API, &copy;
                        2015-present Jason Miller
                    </span>
                </li>
                <li>
                    <a href="https://lodash.com/" target="_blank" rel="noreferrer">
                        lodash
                    </a>
                    <span class="muted-color">
                        , a modern JavaScript utility library delivering modularity, performance &
                        extras, &copy; OpenJS Foundation and other contributors
                        &lt;https://openjsf.org/&gt;
                    </span>
                </li>
                <li>
                    <a href="https://nodejs.org/" target="_blank" rel="noreferrer">
                        node.js
                    </a>
                    <span class="muted-color">
                        , JavaScript runtime built on Chrome's V8 JavaScript engine, &copy; Node.js
                        contributors
                    </span>
                </li>
            </ul>

            <h3>Core components</h3>
            <ul>
                <li>
                    <a href="https://github.com/keeweb/kdbxweb" target="_blank" rel="noreferrer">
                        kdbxweb
                    </a>
                    <span class="muted-color">, web kdbx library, &copy; 2016 Antelle</span>
                </li>
                <li>
                    <a href="https://nodeca.github.io/pako/" target="_blank" rel="noreferrer">
                        pako
                    </a>
                    <span class="muted-color">
                        , high speed zlib port to javascript, &copy; 2014-2017 by Vitaly Puzrin and
                        Andrei Tuputcyn
                    </span>
                </li>
                <li>
                    <a href="https://github.com/jindw/xmldom" target="_blank" rel="noreferrer">
                        xmldom
                    </a>
                    <span class="muted-color">
                        , a pure JS W3C Standard based DOMParser and XMLSerializer
                    </span>
                </li>
            </ul>

            <h3>UI components</h3>
            <ul>
                <li>
                    <a href="https://github.com/Diokuz/baron" target="_blank" rel="noreferrer">
                        baron
                    </a>
                    <span class="muted-color">
                        , native scroll with custom scrollbar, &copy; 2018 Kuznetsov Dmitriy
                    </span>
                </li>
                <li>
                    <a href="https://github.com/Pikaday/Pikaday" target="_blank" rel="noreferrer">
                        pikaday
                    </a>
                    <span class="muted-color">
                        , a refreshing JavaScript datepicker, &copy; 2014 David Bushell
                    </span>
                </li>
            </ul>

            {isDesktop ? (
                <>
                    <h3>Desktop modules</h3>
                    <ul>
                        <li>
                            <a
                                href="https://github.com/ranisalt/node-argon2"
                                target="_blank"
                                rel="noreferrer"
                            >
                                node-argon2
                            </a>
                            <span class="muted-color">
                                , node.js bindings for Argon2 hashing algorithm, &copy; 2015 Ranieri
                                Althoff
                            </span>
                        </li>
                        <li>
                            <a
                                href="https://github.com/MadLittleMods/node-usb-detection"
                                target="_blank"
                                rel="noreferrer"
                            >
                                node-usb-detection
                            </a>
                            <span class="muted-color">
                                , list USB devices in system and detect changes on them, &copy; 2013
                                Kaba AG
                            </span>
                        </li>
                        <li>
                            <a
                                href="https://github.com/atom/node-keytar"
                                target="_blank"
                                rel="noreferrer"
                            >
                                node-keytar
                            </a>
                            <span class="muted-color">
                                , native password node module, &copy; 2013 GitHub Inc.
                            </span>
                        </li>
                        <li>
                            <a
                                href="https://github.com/antelle/node-yubikey-chalresp"
                                target="_blank"
                                rel="noreferrer"
                            >
                                node-yubikey-chalresp
                            </a>
                            <span class="muted-color">
                                , YubiKey challenge-response API for node.js, &copy; 2020 Antelle
                            </span>
                        </li>
                        <li>
                            <a
                                href="https://github.com/antelle/node-secure-enclave"
                                target="_blank"
                                rel="noreferrer"
                            >
                                node-secure-enclave
                            </a>
                            <span class="muted-color">
                                , Secure Enclave module for node.js and Electron, &copy; 2020
                                Antelle
                            </span>
                        </li>
                        <li>
                            <a
                                href="https://github.com/antelle/node-keyboard-auto-type"
                                target="_blank"
                                rel="noreferrer"
                            >
                                node-keyboard-auto-type
                            </a>
                            <span class="muted-color">
                                , node.js bindings for keyboard-auto-type, &copy; 2021 Antelle
                            </span>
                        </li>
                    </ul>
                </>
            ) : null}

            <h3>Utils</h3>
            <ul>
                <li>
                    <a href="https://marked.js.org/" target="_blank" rel="noreferrer">
                        marked
                    </a>
                    <span class="muted-color">
                        , a markdown parser and compiler, &copy; 2018+, MarkedJS
                        (https://github.com/markedjs/) &copy; 2011-2018, Christopher Jeffrey
                        (https://github.com/chjj/)
                    </span>
                </li>
                <li>
                    <a href="https://github.com/cure53/DOMPurify" target="_blank" rel="noreferrer">
                        dompurify
                    </a>
                    <span class="muted-color">
                        , a DOM-only, super-fast, uber-tolerant XSS sanitizer, &copy; 2015 Mario
                        Heiderich,{' '}
                    </span>
                    <a
                        href={Links.LicenseApache}
                        class="muted-color"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Apache-2.0 license
                    </a>
                </li>
                <li>
                    <a
                        href="https://github.com/TomFrost/node-phonetic"
                        target="_blank"
                        rel="noreferrer"
                    >
                        node-phonetic
                    </a>
                    <span class="muted-color">
                        , generates unique, pronounceable names, &copy; 2013 Tom Frost
                    </span>
                </li>
                <li>
                    <a
                        href="https://github.com/LazarSoft/jsqrcode"
                        target="_blank"
                        rel="noreferrer"
                    >
                        jsqrcode
                    </a>
                    <span class="muted-color">
                        , javascript QR code scanner,{' '}
                        <a
                            href={Links.LicenseApache}
                            class="muted-color"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Apache-2.0 license
                        </a>
                    </span>
                </li>
                <li>
                    <a href="https://tweetnacl.js.org/" target="_blank" rel="noreferrer">
                        tweetnacl.js
                    </a>
                    <span class="muted-color">
                        , port of TweetNaCl cryptographic library to JavaScript, public domain
                    </span>
                </li>
            </ul>

            <h3>Styles</h3>
            <ul>
                <li>
                    <a href="https://sass-lang.com/" target="_blank" rel="noreferrer">
                        sass
                    </a>
                    <span class="muted-color">
                        , syntactically awesome stylesheets, &copy; 2012-2016 by the Sass Open
                        Source Foundation
                    </span>
                </li>
                <li>
                    <a href="https://bourbon.io/" target="_blank" rel="noreferrer">
                        bourbon
                    </a>
                    <span class="muted-color">
                        , a lightweight Sass tool set, &copy; 2011-2020 thoughtbot, inc.
                        &lt;http://thoughtbot.com/&gt;
                    </span>
                </li>
                <li>
                    <a
                        href="https://github.com/thoughtbot/bitters"
                        target="_blank"
                        rel="noreferrer"
                    >
                        bitters
                    </a>
                    <span class="muted-color">
                        , a dash of pre-defined style to your Bourbon, &copy; 2013–2019 thoughtbot,
                        inc. &lt;http://thoughtbot.com/&gt;
                    </span>
                </li>
                <li>
                    <a
                        href="https://necolas.github.io/normalize.css/"
                        target="_blank"
                        rel="noreferrer"
                    >
                        normalize.css
                    </a>
                    <span class="muted-color">
                        , a modern, HTML5-ready alternative to CSS resets, &copy; Nicolas Gallagher
                        and Jonathan Neal
                    </span>
                </li>
            </ul>

            <h3>Graphics</h3>
            <ul>
                <li>
                    <a href="https://fontawesome.com/" target="_blank" rel="noreferrer">
                        fontawesome
                    </a>
                    <span class="muted-color">, the iconic SVG, font, and CSS toolkit, </span>
                    <a
                        href={Links.LicenseLinkCCBY40}
                        class="muted-color"
                        target="_blank"
                        rel="noreferrer"
                    >
                        CC BY 4.0 License
                    </a>{' '}
                    <span class="muted-color">(icons only)</span>
                </li>
            </ul>

            <h2>{Locale.setAboutLic}</h2>
            <p>{Locale.setAboutLicComment}:</p>
            <p>Copyright &copy; {year} Antelle https://antelle.net</p>
            <p>
                Permission is hereby granted, free of charge, to any person obtaining a copy of this
                software and associated documentation files (the "Software"), to deal in the
                Software without restriction, including without limitation the rights to use, copy,
                modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
                and to permit persons to whom the Software is furnished to do so, subject to the
                following conditions:
            </p>
            <p>
                The above copyright notice and this permission notice shall be included in all
                copies or substantial portions of the Software.
            </p>
            <p>
                THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
                INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
                PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
                HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
                CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
                OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
            </p>
        </div>
    );
};
