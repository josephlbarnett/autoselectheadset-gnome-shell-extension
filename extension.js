/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import GLib from "gi://GLib";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

const AutoSelectHeadsetAsync = function(params, invocation) {
    let [deviceNames] = params;
    let deviceName = 'headset';
    if (deviceNames.indexOf('headset') < 0) {
        deviceName = 'headphones';
    }
    if (deviceNames.indexOf('headphones') < 0) {
        deviceName = 'microphone';
    }
    if (deviceNames.indexOf('microphone') < 0) {
        invocation.return_value(null);
        return;
    }
    let connection = Main.shellAudioSelectionDBusService._dbusImpl.get_connection();
    let info = Main.shellAudioSelectionDBusService._dbusImpl.get_info();
    connection.emit_signal(invocation.get_sender(),
                           Main.shellAudioSelectionDBusService._dbusImpl.get_object_path(),
                           info ? info.name : null,
                           'DeviceSelected',
                           GLib.Variant.new('(s)', [deviceName]));
    invocation.return_value(null);
}

export default class AutoSelectHeadset extends Extension {
    #originalOpenAsync = null;
    #sourceId = null;

    constructor(metadata) {
        super(metadata);
    }

    #replace() {
        this.#originalOpenAsync = Main.shellAudioSelectionDBusService.OpenAsync;
        Main.shellAudioSelectionDBusService.OpenAsync = AutoSelectHeadsetAsync
    }

    enable() {
        this.#sourceId = GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
            if (Main.shellAudioSelectionDBusService) {
                this.#replace();
            } else {
                this.enable();
            }
        });
    }

    disable() {
        if (this.#sourceId) {
            GLib.Source.remove(this.#sourceId);
            this.#sourceId = null;
        }
        if (this.#originalOpenAsync) {
            Main.shellAudioSelectionDBusService.OpenAsync = this.#originalOpenAsync;
            this.#originalOpenAsync = null;
        }
    }
}
