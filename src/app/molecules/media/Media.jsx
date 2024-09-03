import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import $ from 'jquery';

import Img from '@src/app/atoms/image/Image';
import initMatrix, { fetchFn } from '@src/client/initMatrix';
import blobUrlManager from '@src/util/libs/blobUrlManager';

import { BlurhashCanvas } from 'react-blurhash';
import imageViewer from '../../../util/imageViewer';
import Tooltip from '../../atoms/tooltip/Tooltip';
import Text from '../../atoms/text/Text';
import IconButton from '../../atoms/button/IconButton';
import Spinner from '../../atoms/spinner/Spinner';

import { getBlobSafeMimeType } from '../../../util/mimetypes';
import tinyFixScrollChat from './mediaFix';

async function getUrl(contentType, fileType, link, type, decryptData, roomId /* , threadId */) {
  try {
    const blobSettings = {
      freeze: true,
    };

    if (contentType === 'image' || contentType === 'sticker' || contentType === 'videoThumb') {
      blobSettings.group = `mxcMedia:${link}`;
    } else {
      blobSettings.group = `roomMedia:${roomId}`;
      // blobSettings.group = `roomMedia:${roomId}${typeof threadId === 'string' ? `:${threadId}` : ''}`,
    }

    blobSettings.id = `${blobSettings.group}:${link}`;
    const resultById = blobUrlManager.getById(blobSettings.id);
    if (fileType !== 'unknown') {
      if (!resultById) {
        const blob = await initMatrix.mxcUrl.focusFetchBlob(link, fileType, type, decryptData);
        const result = await blobUrlManager.insert(blob, blobSettings);
        return result;
      } else {
        return resultById;
      }
    } else {
      const blob = await initMatrix.mxcUrl.focusFetchBlob(link, fileType, type, decryptData);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = function () {
          resolve(reader.result);
        };
        reader.onerror = reject;
      });
    }
  } catch (e) {
    console.error(e);
    return link;
  }
}

function getNativeHeight(width, height, maxWidth = 296) {
  const scale = maxWidth / width;
  const result = scale * height;
  if (typeof result === 'number' && !Number.isNaN(result)) {
    return scale * height;
  }
  return '';
}

function FileHeader({ name, link = null, external = false, file = null, type, roomId, threadId }) {
  const [url, setUrl] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  async function getFile() {
    const myUrl = await getUrl('file', 'unknown', link, type, file, roomId, threadId);
    setUrl(myUrl);
  }

  async function handleDownload(e) {
    if (file !== null && url === null) {
      e.preventDefault();
      setIsDownloading(true);
      await getFile();
      setIsDownloading(false);
      setTimeout(() => {
        e.target.click();
        setUrl(null);
      }, 100);
    }
  }

  return (
    <div className="file-header">
      <Text className="file-name" variant="b3">
        {name}
      </Text>
      {link !== null && (
        <>
          {!__ENV_APP__.ELECTRON_MODE && external && (
            <IconButton
              size="extra-small"
              tooltip="Open in new tab"
              fa="fa-solid fa-arrow-up-right-from-square"
              onClick={() => window.open(url || link)}
            />
          )}
          <a href={url || link} download={name} target="_blank" rel="noreferrer">
            <IconButton
              disabled={isDownloading}
              size="extra-small"
              tooltip="Download"
              fa="fa-solid fa-download"
              onClick={handleDownload}
            />
          </a>
        </>
      )}
    </div>
  );
}

FileHeader.propTypes = {
  name: PropTypes.string.isRequired,
  link: PropTypes.string,
  external: PropTypes.bool,
  file: PropTypes.shape({}),
  type: PropTypes.string.isRequired,
};

function File({ link, file = null, roomId, threadId, content = {} }) {
  const name = content.body;
  const type = content.info?.mimetype || '';
  return (
    <div className="file-container">
      <FileHeader
        roomId={roomId}
        threadId={threadId}
        name={name}
        link={link}
        file={file}
        type={type}
      />
    </div>
  );
}

File.propTypes = {
  link: PropTypes.string.isRequired,
  file: PropTypes.shape({}),
  content: PropTypes.object,
};

function Image({
  content = {},
  roomId,
  threadId,
  width = null,
  height = null,
  link,
  file = null,
  blurhash = '',
  className = null,
  classImage = null,
  ignoreContainer = false,
  maxWidth = 296,
}) {
  const [url, setUrl] = useState(null);
  const [blur, setBlur] = useState(true);
  const [lightbox, setLightbox] = useState(false);
  const name = content.body;
  const type = content.info?.mimetype || '';

  useEffect(() => {
    let unmounted = false;
    async function fetchUrl() {
      const myUrl = await getUrl('image', 'image', link, type, file, roomId, threadId);
      if (unmounted) {
        blobUrlManager.delete(myUrl);
        return;
      }
      setUrl(myUrl);
    }
    fetchUrl();
    return () => {
      unmounted = true;
    };
  }, []);

  const toggleLightbox = () => {
    if (!url) return;
    setLightbox(!lightbox);
  };

  const imgHeight = width !== null ? getNativeHeight(width, height, maxWidth) : 200;

  const imgData = url !== null && (
    <div
      style={{
        minHeight: imgHeight,
      }}
    >
      <Img
        className={`${classImage}${ignoreContainer ? ` ${className}` : ''}`}
        draggable="false"
        style={{
          display: blur ? 'none' : 'unset',
          height: imgHeight,
        }}
        onLoadingChange={() => tinyFixScrollChat()}
        onLoad={(event) => {
          tinyFixScrollChat();
          setBlur(false);
          let imageLoaded = false;
          if (!imageLoaded && event.target) {
            imageLoaded = true;
            const img = $(event.target);
            const imgAction = () => {
              imageViewer({ lightbox, imgQuery: img, name });
            };

            img.off('click', imgAction);
            img.on('click', imgAction);
          }
        }}
        src={url || link}
        alt={name}
      />
    </div>
  );

  useEffect(() => tinyFixScrollChat());

  if (!ignoreContainer) {
    return (
      <div className={`file-container${className ? ` ${className}` : ''}`}>
        <div
          style={{ minHeight: imgHeight }}
          className="image-container"
          role="button"
          tabIndex="0"
          onClick={toggleLightbox}
          onKeyDown={toggleLightbox}
        >
          {blurhash && blur && (
            <BlurhashCanvas className="image-container-canvas" hash={blurhash} punch={1} />
          )}
          {imgData}
        </div>
      </div>
    );
  }

  return imgData;
}

Image.propTypes = {
  maxWidth: PropTypes.number,
  ignoreContainer: PropTypes.bool,
  width: PropTypes.number,
  height: PropTypes.number,
  link: PropTypes.string.isRequired,
  linkAnim: PropTypes.string,
  file: PropTypes.shape({}),
  className: PropTypes.string,
  classImage: PropTypes.string,
  blurhash: PropTypes.string,
  content: PropTypes.object,
};

function Sticker({
  content = {},
  height = null,
  width = null,
  link,
  file = null,
  roomId,
  threadId,
}) {
  const [url, setUrl] = useState(null);
  const name = content.body;
  const type = content.info?.mimetype || '';

  useEffect(() => {
    let unmounted = false;
    async function fetchUrl() {
      const myUrl = await getUrl('sticker', 'image', link, type, file, roomId, threadId);
      if (unmounted) {
        blobUrlManager.delete(myUrl);
        return;
      }
      setUrl(myUrl);
    }
    fetchUrl();
    return () => {
      unmounted = true;
    };
  }, []);

  useEffect(() => tinyFixScrollChat());
  const stickerStyle = { height: width !== null ? getNativeHeight(width, height, 170) : 175 };
  if (typeof stickerStyle.height === 'number' && stickerStyle.height > 175)
    stickerStyle.height = 175;

  return (
    <Tooltip placement="top" content={<div className="small">{name}</div>}>
      <div className="sticker-container" style={stickerStyle}>
        {url !== null && (
          <Img
            isSticker
            style={typeof stickerStyle.height === 'number' ? stickerStyle : null}
            height={stickerStyle.height}
            src={url || link}
            alt={name}
            onLoad={() => tinyFixScrollChat()}
            onLoadingChange={() => tinyFixScrollChat()}
          />
        )}
      </div>
    </Tooltip>
  );
}

Sticker.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  link: PropTypes.string.isRequired,
  file: PropTypes.shape({}),
  content: PropTypes.object,
};

function Audio({ content = {}, link, file = null, roomId, threadId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [url, setUrl] = useState(null);
  const name = content.body;
  const type = content.info?.mimetype || '';

  async function loadAudio() {
    const myUrl = await getUrl('audio', 'audio', link, type, file, roomId, threadId);
    setUrl(myUrl);
    setIsLoading(false);
    setIsLoaded(true);
  }
  function handlePlayAudio() {
    setIsLoading(true);
    loadAudio();
  }

  useEffect(() => tinyFixScrollChat());
  return (
    <div className="file-container">
      <FileHeader
        threadId={threadId}
        roomId={roomId}
        name={name}
        link={file !== null ? url : url || link}
        type={type}
        external
      />
      <div className="audio-container">
        {url === null && isLoading && <Spinner size="small" />}
        {url === null && !isLoading && (
          <IconButton onClick={handlePlayAudio} tooltip="Play audio" fa="fa-solid fa-circle-play" />
        )}
        {url !== null && (
          <audio autoPlay controls>
            <source src={url} type={getBlobSafeMimeType(type)} />
          </audio>
        )}
      </div>
    </div>
  );
}

Audio.propTypes = {
  link: PropTypes.string.isRequired,
  file: PropTypes.shape({}),
  content: PropTypes.object,
};

function Video({
  content = {},
  roomId,
  threadId,
  link,
  thumbnail = null,
  thumbnailFile = null,
  thumbnailType = null,
  width = null,
  height = null,
  file = null,
  blurhash = null,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [url, setUrl] = useState(null);
  const [thumbUrl, setThumbUrl] = useState(null);
  const [blur, setBlur] = useState(true);
  const name = content.body;
  const type = content.info?.mimetype || '';

  useEffect(() => {
    let unmounted = false;
    async function fetchUrl() {
      const myThumbUrl = await getUrl(
        'videoThumb',
        'image',
        thumbnail,
        thumbnailType,
        thumbnailFile,
        roomId,
        threadId,
      );
      if (unmounted) {
        blobUrlManager.delete(myThumbUrl);
        return;
      }
      setThumbUrl(myThumbUrl);
    }

    if (thumbnail !== null) fetchUrl();
    return () => {
      unmounted = true;
    };
  }, []);

  useEffect(() => tinyFixScrollChat());
  const loadVideo = async () => {
    const myUrl = await getUrl('video', 'video', link, type, file, roomId, threadId);
    setUrl(myUrl);
    setIsLoading(false);
    setIsLoaded(true);
  };

  const handlePlayVideo = () => {
    setIsLoading(true);
    loadVideo();
  };

  return (
    <div className={`file-container${url !== null ? ' file-open' : ''}`}>
      <FileHeader
        threadId={threadId}
        roomId={roomId}
        name={name}
        link={file !== null ? url : url || link}
        type={type}
        external
      />
      {url === null ? (
        <div className="video-container">
          {!isLoading && (
            <IconButton
              onClick={handlePlayVideo}
              tooltip="Play video"
              fa="fa-solid fa-circle-play"
            />
          )}
          {blurhash && blur && <BlurhashCanvas hash={blurhash} punch={1} />}
          {thumbUrl !== null && (
            <Img
              style={{ display: blur ? 'none' : 'unset' }}
              src={thumbUrl}
              onLoadingChange={() => tinyFixScrollChat()}
              onLoad={() => {
                setBlur(false);
                tinyFixScrollChat();
              }}
              alt={name}
            />
          )}
          {isLoading && <Spinner size="small" />}
        </div>
      ) : (
        <div className="ratio ratio-16x9 video-base">
          <video srcwidth={width} srcheight={height} autoPlay controls poster={thumbUrl}>
            <source src={url} type={getBlobSafeMimeType(type)} />
          </video>
        </div>
      )}
    </div>
  );
}

Video.propTypes = {
  link: PropTypes.string.isRequired,
  thumbnail: PropTypes.string,
  thumbnailFile: PropTypes.shape({}),
  thumbnailType: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  file: PropTypes.shape({}),
  blurhash: PropTypes.string,
  content: PropTypes.object,
};

export { File, Image, Sticker, Audio, Video };
