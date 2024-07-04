import React, { useState, useEffect } from 'react';

import PropTypes from 'prop-types';
import envAPI from '@src/util/libs/env';
import hsWellKnown from '@src/util/libs/HsWellKnown';

import Text from '../../../atoms/text/Text';
import Spinner from '../../../atoms/spinner/Spinner';

function Homeserver() {
  const [hs, setHs] = useState(null);
  const [process, setProcess] = useState({
    isLoading: true,
    message: 'Loading homeserver list...',
  });

  const setupHsConfig = async (servername) => {
    if (servername !== '') {
      setProcess({ isLoading: true, message: 'Loading local database...' });
      await envAPI.startDB();
      setProcess({ isLoading: true, message: 'Looking for homeserver...' });
      await hsWellKnown.fetch(servername, setProcess);
    } else {
      setProcess({ isLoading: false });
    }
  };

  useEffect(() => {
    hsWellKnown.resetAll();
    if (hs === null) return;
    hsWellKnown.setSearchingHs(hs.selected);
    setupHsConfig(hs.selected);
  }, [hs]);

  useEffect(() => {
    try {
      const ENV = __ENV_APP__.LOGIN ?? {};
      const selectedHs =
        !Number.isNaN(ENV.DEFAULT_HOMESERVER) && Number.isFinite(ENV.DEFAULT_HOMESERVER)
          ? ENV.DEFAULT_HOMESERVER
          : 0;
      const allowCustom = ENV.ALLOW_CUSTOM_HOMESERVERS;
      const hsList = Array.isArray(ENV.HOMESERVER_LIST) ? ENV.HOMESERVER_LIST : [];

      if (!hsList?.length > 0 || selectedHs < 0 || selectedHs >= hsList?.length) {
        throw new Error();
      }

      let selectedServer = hsList[selectedHs];
      if (
        typeof window.location.hash === 'string' &&
        window.location.hash.startsWith('#') &&
        window.location.hash.length > 1
      ) {
        selectedServer = window.location.hash.substring(1);
        if (hsList.indexOf(selectedServer) < 0) hsList.push(selectedServer);
      }

      setHs({ selected: selectedServer, list: hsList, allowCustom });
    } catch {
      setHs({ selected: '', list: [''], allowCustom: true });
    }
  }, []);

  return (
    <>
      {process.error !== undefined && (
        <Text className="homeserver-form__error" variant="b3">
          {process.error}
        </Text>
      )}
      {process.isLoading && (
        <div className="homeserver-form__status flex--center">
          <Spinner size="small" />
          <Text variant="b2">{process.message}</Text>
        </div>
      )}
    </>
  );
}
Homeserver.propTypes = {
  className: PropTypes.string,
};

export default Homeserver;
