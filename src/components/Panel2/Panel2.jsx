import styles from './Panel2.module.scss';

import DetailCard from 'components/common/NE_Card';
import React, { useState, useEffect } from 'react';
import {
  abbreviateNumber,
  intlNum,
  isNum,
  toFixedSafe,
  NO_VALUE,
} from 'utils/converter';
import { GiTwoCoins } from 'react-icons/gi';
import { BsFillCpuFill } from 'react-icons/bs';
import { AiFillBank } from 'react-icons/ai';
import { MdSpeed } from 'react-icons/md';
import { StringsTypes } from 'types/StringsTypes';
import { ConstantsTypes, NETWORKS } from 'types/ConstantsTypes';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import ErrorCard from 'components/common/NE_ErrorCard';

function ErrorFallback({ hasError, children }) {
  if (hasError) {
    return (
      <div>
        <ErrorCard />
      </div>
    );
  }

  return children;
}

function IsMainnet({ network, children }) {
  return network.name === NETWORKS.MAINNET.name ? children : null;
}

const emptyCard = {
  sublabel: null,
  text: null,
  reserve: null,
  reward: null,
  footer: null,
};

//NXS amount with unit, or NO_VALUE when the node does not report it
function nxs(value, maxDigits = 2) {
  return isNum(value)
    ? `${intlNum(value, 'en-US', { maximumFractionDigits: maxDigits })} NXS`
    : NO_VALUE;
}

function Panel2(props) {
  const { network } = useNetwork();
  const { metricsRQ, marketRQ, miningRQ } = props;

  const [state, setState] = useState({
    price: emptyCard,
    stake: emptyCard,
    prime: emptyCard,
    hash: emptyCard,
  });

  const [cardRefreshTimeout, setCardRefreshTimeout] = useState(
    ConstantsTypes.REFETCH_INTERVALS.MINING / 1000
  );

  function isInvalid(value) {
    return value == null || value === '';
  }

  const marketData = marketRQ.data?.data?.market_data;
  const miningData = miningRQ.data?.data?.result;
  const metricsData = metricsRQ.data?.data?.result;

  // * initialize state when RQ has data
  //every field is optional, nodes and CoinGecko leave some out (eg fees, 24h change)
  useEffect(() => {
    if (marketRQ.data) {
      const usd = marketData?.current_price?.usd;
      const change = marketData?.price_change_percentage_24h;
      const marketCap = isNum(marketData?.market_cap?.usd)
        ? marketData.market_cap.usd
        : usd * miningData?.supply?.total;
      setState((prev) => ({
        ...prev,
        price: {
          sublabel: marketData?.current_price?.btc,
          text: usd,
          reserve: isNum(change) ? `${change.toFixed(2)} %` : null,
          reward: marketData?.total_volume?.usd,
          footer: isNum(marketCap) ? marketCap : null,
        },
      }));
    }

    if (miningRQ.data) {
      setState((prev) => ({
        ...prev,
        stake: {
          ...prev.stake,
          sublabel: toFixedSafe(miningData?.stake?.difficulty, 4),
          reserve: miningData?.stake?.height,
        },
        prime: {
          sublabel: toFixedSafe(miningData?.prime?.difficulty),
          text: miningData?.prime?.primes,
          reserve: miningData?.prime?.reserve,
          reward: miningData?.prime?.reward,
        },
        hash: {
          sublabel: toFixedSafe(miningData?.hash?.difficulty),
          text: miningData?.hash?.hashes,
          reserve: miningData?.hash?.reserve,
          reward: miningData?.hash?.reward,
        },
      }));
    }

    if (metricsRQ.data) {
      setState((prev) => ({
        ...prev,
        stake: {
          ...prev.stake,
          text: metricsData?.trust?.stake,
          reward: metricsData?.trust?.total,
        },
      }));
    }
  }, [marketRQ.data, miningRQ.data, metricsRQ.data]);

  // * reset card refresh timeout when RQ gets updated
  useEffect(() => {
    if (metricsRQ.data) {
      setCardRefreshTimeout(ConstantsTypes.REFETCH_INTERVALS.MINING / 1000);
    }
  }, [metricsRQ.data]);

  // * decrement the card timeout every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCardRefreshTimeout((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className={styles.panelTwoContainer}>
      <IsMainnet network={network}>
        <ErrorFallback hasError={marketRQ.isError && !state.price?.text}>
          <DetailCard
            type="market"
            icon={<GiTwoCoins color="white" size="2.25rem" />}
            label="Price"
            sublabel={
              isNum(state.price?.sublabel)
                ? `${state.price.sublabel.toFixed(10)} BTC`
                : ''
            }
            text={`${state.price?.text}`}
            unit={'$'}
            reserveLabel="Change 24h"
            reserve={state.price?.reserve}
            rewardLabel="Volume 24h"
            reward={
              isNum(state.price?.reward)
                ? `${intlNum(state.price.reward, 'en-US', {
                    maximumFractionDigits: 0,
                  })} $`
                : NO_VALUE
            }
            footerLabel="Market Cap "
            footerValue={
              isNum(state.price?.footer)
                ? `${intlNum(state.price.footer, 'en-US', {
                    maximumFractionDigits: 0,
                  })} $`
                : NO_VALUE
            }
            delayTime={`${cardRefreshTimeout}s`}
            isLoading={isInvalid(state.price?.text)}
          />
        </ErrorFallback>
      </IsMainnet>
      <ErrorFallback hasError={miningRQ.isError}>
        <DetailCard
          type="basic"
          icon={<AiFillBank color="white" size="2.25rem" />}
          label={StringsTypes.CHANNELS[0]}
          sublabel={`Difficulty : ${state.stake?.sublabel}`}
          text={`${intlNum(state.stake?.text, 'en-US', {
            maximumFractionDigits: 0,
          })}`}
          unit="NXS"
          reserveLabel="Height"
          reserve={`${intlNum(state.stake?.reserve)}`}
          reward={`${intlNum(state.stake?.reward, 'en-US', {
            maximumFractionDigits: 0,
          })}`}
          rewardLabel="Total"
          delayTime={`${cardRefreshTimeout}s`}
          isLoading={miningRQ.isLoading || isInvalid(state.stake?.text)}
        />
      </ErrorFallback>
      <ErrorFallback hasError={miningRQ.isError}>
        <DetailCard
          type="basic"
          icon={<BsFillCpuFill color="white" size="2.25rem" />}
          label={StringsTypes.CHANNELS[1]}
          sublabel={`Difficulty : ${state.prime?.sublabel}`}
          text={`${abbreviateNumber(state.prime?.text)}`}
          unit="P/s"
          reserveLabel="Reserve"
          reserve={nxs(state.prime?.reserve)}
          rewardLabel="Reward"
          reward={nxs(state.prime?.reward, 4)}
          delayTime={`${cardRefreshTimeout}s`}
          isLoading={isInvalid(state.prime?.text)}
        />
      </ErrorFallback>
      <ErrorFallback hasError={miningRQ.isError}>
        <DetailCard
          type="basic"
          icon={<MdSpeed color="white" size="2.5rem" />}
          label={StringsTypes.CHANNELS[2]}
          sublabel={`Difficulty : ${state.hash?.sublabel}`}
          text={`${abbreviateNumber(state.hash?.text)}`}
          unit="H/s"
          reserveLabel="Reserve"
          reserve={nxs(state.hash?.reserve)}
          rewardLabel="Reward"
          reward={nxs(state.hash?.reward, 4)}
          delayTime={`${cardRefreshTimeout}s`}
          isLoading={isInvalid(state.hash?.text)}
        />
      </ErrorFallback>
    </section>
  );
}

export default Panel2;
