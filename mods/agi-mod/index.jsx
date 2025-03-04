import React from 'react';
import tinyAPI from '@src/util/mods';

import './scss/style.scss';
import startPeopleSelector from './bots/PeopleSelector';

import buttons from './menu/Buttons';
import Welcome from './bots/Welcome';
import startMessage from './bots/Message';

import './openrouter';
import startOpenRouterTabs from './openrouter';

export default function startAgiMod(firstTime) {
  // Normal Loading
  if (!firstTime) {
    // Start Mod
    console.log('[SpaceShip App] Loading mod...');

    // Start Buttons
    startPeopleSelector();
    // buttons();
    // startMessage();

    // Start Page Detector
    // addRoomOptions({}, 'room');
    // tinyAPI.on('selectedRoomModeAfter', addRoomOptions);
    // tinyAPI.on('selectTabAfter', () => addRoomOptions({}, 'room'));
    // tinyAPI.on('emptyTimeline', (data, forceUpdateLimit) => forceUpdateLimit());

    // Mod Loaded
    console.log('[SpaceShip App] Loading complete!');
  }

  // Welcome Page
  /* tinyAPI.on('startWelcomePage', (data, tinyWelcome) => {
    tinyWelcome.html = <Welcome />;
  }); */
  startOpenRouterTabs();
}
