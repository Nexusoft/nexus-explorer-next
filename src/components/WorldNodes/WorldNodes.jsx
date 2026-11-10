/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useRef, useState } from 'react';
import { formatInt } from 'utils/format';
import worldBgSvg from './world-robinson.svg';
import styles from './WorldNodes.module.scss';
import { RobinsonProjector } from './latlongConverter';
import useWindowSize from 'hooks/useWindowSize/useWindowSize';
import TYPES from '../../types';
import { useDarkMode, useDebounce, useNetwork } from 'hooks';
import { useQuery } from 'react-query';

const LATENCY = 1000;
//node reports uint32 max when it never measured the peer
const LATENCY_UNKNOWN = 4294967295;
const COLOR_SLOW = 'rgba(77, 145, 201, 0.383)';
const COLOR_UNKNOWN = 'rgba(150, 150, 150, 0.45)';

function latencyColor(latency) {
  if (latency == null || latency >= LATENCY_UNKNOWN) return COLOR_UNKNOWN;
  return latency < LATENCY ? TYPES.COLORS.NEXUS_BLUE : COLOR_SLOW;
}

function SvgMarkers({ worldRef, mapXYarr }) {
  const mapWidth = worldRef?.current?.width || 800;
  return (
    <svg
      className={styles.mapMarkers}
      style={{
        width: worldRef?.current?.width || 800,
        height: worldRef?.current?.height || 600,
      }}>
      {mapXYarr.map((item, index) => (
        <circle
          key={index}
          cx={item.x}
          cy={item.y}
          data-hover={
            item.latency >= LATENCY_UNKNOWN ? 'not measured' : item.latency
          }
          className={styles.marker}
          opacity={item.opacity}
          style={{ fill: latencyColor(item.latency) }}
          r={(5 / 1180) * mapWidth}></circle>
      ))}
    </svg>
  );
}

function LegendCirle({ color, size }) {
  return (
    <svg width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        className={styles.marker}
        opacity={1}
        style={{
          fill: color,
        }}
        r={4}></circle>
    </svg>
  );
}

export default function WorldNodes() {
  const worldRef = React.useRef(null);
  const [mapXYarr, setMapXYarr] = React.useState([]);
  const windowSize = useWindowSize();
  const [, , isGlobalDarkMode] = useDarkMode();
  const opacityControlRef = useRef();
  const [hours, setHours] = useState(24);
  const [limit, setLimit] = useState('none');
  const [mapLoaded, setMapLoaded] = useState(false);

  const debouncedHours = useDebounce(hours, 500);

  const { network, getNetworkListNodes, getNetworkCountNodes } = useNetwork();

  const networkListNodesRQ = useQuery(
    ['networkListNodes', network.name, limit, debouncedHours],
    () =>
      getNetworkListNodes('/api/static/geoloc', limit, debouncedHours, {
        network: network.name,
      })
  );

  const networkCountNodesRQ = useQuery(
    ['networkCountNodes', network.name],
    getNetworkCountNodes
  );

  //  * effect that updates the plot points when window size changes
  useEffect(() => {
    const { width, height } = worldRef.current;
    //image not laid out yet, plotting now would stack every point at 0,0
    if (!width || !height) return;

    // * reference from edge explorer
    const robinsonProjector = new RobinsonProjector();
    // * radius of the marker - set at 5px when map at full width (at 1180px width)
    // * const markerRadius = (5 / 1180) * width;
    // * topOffset is number of pixels cropped from top of map when map, calculated as being 5 pixels when map at full height of 515
    const topOffset = (5 / 515) * height;

    const _mapXYarr = (networkListNodesRQ.data?.data || [])
      .map(({ latitude, longitude, latency }) => {
        const xy = robinsonProjector.convertLatLngToXy(
          latitude,
          longitude,
          width,
          topOffset
        );
        return xy ? { ...xy, latency, opacity: 1 } : null;
      })
      .filter(
        (item) => item && Number.isFinite(item.x) && Number.isFinite(item.y)
      );

    setMapXYarr(_mapXYarr);
  }, [windowSize, networkListNodesRQ.data, mapLoaded]);

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <p className={styles.counts}>
          {formatInt(networkCountNodesRQ.data?.data?.result?.count)} nodes
          known, {mapXYarr.filter((item) => item.opacity > 0).length} on the map
          {networkListNodesRQ.isLoading && ' (loading...)'}
        </p>
        <label className={styles.hours}>
          Seen in the last
          <input
            type="number"
            min="1"
            ref={opacityControlRef}
            onChange={(e) => {
              setHours(e.target.value);
            }}
            defaultValue={hours}
          />
          hours
        </label>
        <div className={styles.legend}>
          <span>
            <LegendCirle color={TYPES.COLORS.NEXUS_BLUE} size={8} /> Under{' '}
            {LATENCY} ms
          </span>
          <span>
            <LegendCirle color={COLOR_SLOW} size={8} /> Slower
          </span>
          <span>
            <LegendCirle color={COLOR_UNKNOWN} size={8} /> Not measured
          </span>
        </div>
      </div>
      <div className={styles.worldContainer}>
        <img
          ref={worldRef}
          src={worldBgSvg.src}
          className={styles.worldSvg}
          onLoad={() => setMapLoaded(true)}
          alt="World"
        />
        <SvgMarkers worldRef={worldRef} mapXYarr={mapXYarr} />
      </div>
    </div>
  );
}
