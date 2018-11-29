/*
Copyright 2015, 2016 OpenMarket Ltd
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
import sdk from '../../../index';
import {_t} from '../../../languageHandler';
import PropTypes from 'prop-types';
import dis from '../../../dispatcher';
import {wantsDateSeparator} from '../../../DateUtils';
import {MatrixEvent, MatrixClient} from 'matrix-js-sdk';
import {makeEventPermalink, makeUserPermalink} from "../../../matrix-to";
import SettingsStore from "../../../settings/SettingsStore";

export default class ThreadContent extends React.Component {

  static contextTypes = {
    matrixClient: PropTypes.instanceOf(MatrixClient).isRequired,
  };

  constructor(props, context) {
    super(props, context);
    this.state = {
      // The loaded events to be rendered as linear-replies
      events: [],

      // The latest loaded event which has not yet been shown
      loadedEv: null,
      // Whether the component is still loading more events
      loading: true,

      // Whether as error was encountered fetching a replied to event.
      err: false,
    }
  }

  componentWillMount() {
    this.unmounted = false;
    this.room = this.context.matrixClient.getRoom(this.props.threadRoom);
    this.initialize();
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  async initialize() {
    if (this.unmounted) return;

    const { threadStart, threadResponses } = this.props;
    const eventIds = [threadStart, ...(threadResponses || [])];

    const events = [];
    for (let i = 0; i < eventIds.length; i++) {
      const ev = await this.getEvent(eventIds[i])

      if (ev) {
        events.push(ev);
      } else {
        this.setState({ err: true });
        break;
      }
    }

    this.setState({
      events,
      loading: false,
    });
  }

  async getEvent(eventId) {
    const event = this.room.findEventById(eventId);
    if (event) return event;

    try {
      // ask the client to fetch the event we want using the context API, only interface to do so is to ask
      // for a timeline with that event, but once it is loaded we can use findEventById to look up the ev map
      await this.context.matrixClient.getEventTimeline(this.room.getUnfilteredTimelineSet(), eventId);
    } catch (e) {
      // if it fails catch the error and return early, there's no point trying to find the event in this case.
      // Return null as it is falsey and thus should be treated as an error (as the event cannot be resolved).
      return null;
    }

    return this.room.findEventById(eventId);
  }

  render() {
    let header = null;

    if (this.state.err) {
      header = <div className="mx_ReplyThread mx_ReplyThread_error">
        {
          _t('Unable to load event that was replied to, ' +
             'it either does not exist or you do not have permission to view it.')
        }
      </div>;
    } else if (this.state.loading) {
      const Spinner = sdk.getComponent("elements.Spinner");
      header = <Spinner w={16} h={16} />;
    }

    const EventTile = sdk.getComponent('views.rooms.EventTile');
    const evTiles = this.state.events.map((ev) => {
      return <EventTile
               mxEvent={ev}
               key={ev.getId()}
               tileShape="reply"
               onWidgetLoad={this.props.onWidgetLoad}
               isTwelveHour={SettingsStore.getValue("showTwelveHourTimestamps")} />;
    });

    return (
      <div className="mx_ThreadContent">
        <div className="mx_ThreadContent_header">Thread</div>
        <div className="mx_ThreadContent_subheader">#{ this.room.name }</div>
        <div>{ header } </div>
        <div>{ evTiles }</div>
      </div>
    );
  }
}
