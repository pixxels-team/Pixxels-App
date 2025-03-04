import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import mobileEvents from '@src/util/libs/mobile';

import Modal from 'react-bootstrap/Modal';
import { twemojifyReact } from '../../../util/twemojify';

function Dialog({
  className = null,
  isOpen,
  title,
  onAfterOpen = null,
  onAfterClose = null,
  onRequestClose = null,
  children = null,
  bodyClass = '',
}) {
  useEffect(() => {
    const closeByMobile = () => typeof onRequestClose === 'function' && onRequestClose();

    mobileEvents.on('backButton', closeByMobile);
    return () => {
      mobileEvents.off('backButton', closeByMobile);
    };
  });

  return (
    <Modal
      show={isOpen}
      onEntered={onAfterOpen}
      onHide={onRequestClose}
      onExited={onAfterClose}
      className={__ENV_APP__.ELECTRON_MODE ? 'root-electron-style' : null}
      backdropClassName={__ENV_APP__.ELECTRON_MODE ? 'root-electron-style' : null}
      dialogClassName={
        className === null
          ? 'modal-dialog-centered modal-dialog-scrollable'
          : `${className} modal-dialog-scrollable`
      }
    >
      <Modal.Header className="noselect" closeButton>
        <Modal.Title className="h5 emoji-size-fix">
          {typeof title === 'string' ? twemojifyReact(title) : title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className={bodyClass}>{children}</Modal.Body>
    </Modal>
  );
}

Dialog.propTypes = {
  bodyClass: PropTypes.string,
  className: PropTypes.string,
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.node.isRequired,
  onAfterOpen: PropTypes.func,
  onAfterClose: PropTypes.func,
  onRequestClose: PropTypes.func,
  children: PropTypes.node,
};

export default Dialog;
