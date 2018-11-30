/*
   Copyright 2016 Aviral Dasgupta
   Copyright 2017 Vector Creations Ltd
   Copyright 2017, 2018 New Vector Ltd

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import React from 'react';
import { _t } from '../languageHandler';
import AutocompleteProvider from './AutocompleteProvider';
import {asciiRegexp, unicodeRegexp} from 'emojione';
import {PillCompletion} from './Components';
import type {Completion, SelectionRange} from './Autocompleter';
import SettingsStore from "../settings/SettingsStore";

import { Emoji, emojiIndex } from 'emoji-mart';

const LIMIT = 20;

// Match for ":wink:" or ascii-style ";-)" provided by emojione
// (^|\s|(emojiUnicode)) to make sure we're either at the start of the string or there's a
// whitespace character or an emoji before the emoji. The reason for unicodeRegexp is
// that we need to support inputting multiple emoji with no space between them.
const EMOJI_REGEX = new RegExp('(?:^|\\s|' + unicodeRegexp + ')(' + asciiRegexp + '|:[+-\\w]*:?)$', 'g');


export default class EmojiProvider extends AutocompleteProvider {
  constructor() {
    super(EMOJI_REGEX);
  }

  async getCompletions(query: string, selection: SelectionRange, force?: boolean): Array<Completion> {
    if (SettingsStore.getValue("MessageComposerInput.dontSuggestEmoji")) {
      return []; // don't give any suggestions if the user doesn't want them
    }

    const {command, range} = this.getCurrentCommand(query, selection);
    if (command) {
      const matchedString = command[0].replace(/:/gi, '');

      return emojiIndex.search(matchedString).map((el) => {
        return {
          completion: el.native,
          component: (
            <PillCompletion title={el.colons} initialComponent={
              <Emoji
                set={'apple'}
                emoji={el}
                size={24}
                fallback={(emoji, props) => {
        return <span>{emoji ? `:${emoji.short_names[0]}:` : props.emoji}</span>
                }} />
            } />
          ),
          range,
        };
      }).slice(0, LIMIT);
    }

    return [];
  }

  getName() {
    return '😃 ' + _t('Emoji');
  }

  renderCompletions(completions: [React.Component]): ?React.Component {
    return <div className="mx_Autocomplete_Completion_container_pill">
      { completions }
    </div>;
  }
}
