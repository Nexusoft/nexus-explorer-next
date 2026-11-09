import axios from 'axios';
import { styles as detailStyles } from 'components/Detail';
import BlockDetail from 'components/Detail/BlockDetail';
import TransactionDetail from 'components/Detail/TransactionDetail';
import AccountDetail from 'components/Detail/AccountDetail';
import OwnerDetail from 'components/Detail/OwnerDetail';
import { useNetwork } from 'hooks/useNetwork/useNetwork';
import { useState } from 'react';
import { useQuery } from 'react-query';
import { isDev } from 'utils/middleware';
import { Log } from 'utils/customLog';
import PageHeader from 'components/Header/PageHeader';
import TYPES from 'types';
import { CARD_TYPES } from 'types/ConstantsTypes';
import { InvoiceWithData } from 'components/Views/Dao/InvoiceModal';
import { useBack } from 'hooks/useBack/useBack';
import Layout from 'components/Layout';
import PromiseLayout from 'components/HOC/PromiseLayout';
import { pathOr } from 'utils';
import { shortHash } from 'utils/format';
import { classifySearch, SEARCH_KINDS } from 'utils/search';
import SearchHelp from 'components/common/NE_SearchHelp';
import NameSearch from 'components/Views/Search/NameSearch';

export const getServerSideProps = async (context) => {
  let address = context.params.addr;
  return {
    props: {
      addr: address,
    },
  };
};

const scanTitles = {
  block: 'Block',
  transaction: 'Transaction',
  user: 'Account',
  trust: 'Trust account',
  token: 'Token',
  asset: 'Register',
  invoice: 'Invoice',
  genesis: 'Signature chain',
};

function Scan({ addr }) {
  const goBack = useBack();
  const [cardType, setCardType] = useState();
  const { network, getScanResults, getIndex } = useNetwork();

  const searchKind = classifySearch(addr);

  //register object type from register/get/any to the endpoint + card that shows it
  const registerTypes = {
    TOKEN: { endpoint: 'finance/get/token', type: CARD_TYPES.TOKEN },
    TRUST: { endpoint: 'finance/get/trust', type: CARD_TYPES.TRUST },
    ACCOUNT: { endpoint: 'finance/get/account', type: CARD_TYPES.USER },
  };

  /**
   * identify the endpoint to use from the scan
   * @param {*} addr pass the address to scan
   * @returns {*} the {endpoint, params, type} to use
   */
  //one lookup tells what the address holds, then ask the matching endpoint
  async function addressAPI(address) {
    const res = await axios.get(`${network.url}/register/get/any`, {
      params: { address },
    });
    const object = res.data?.result || {};
    Log('[RESOLVED]:', object.type);
    const match = registerTypes[object.type] || {
      endpoint: 'register/get/any',
      type: CARD_TYPES.ASSET,
    };
    return { ...match, params: { address } };
  }

  async function getAPI(addr) {
    switch (searchKind) {
      case SEARCH_KINDS.TRUST_NAME:
        return {
          endpoint: 'finance/get/trust',
          params: { name: addr },
          type: CARD_TYPES.TRUST,
        };
      case SEARCH_KINDS.NAME:
        return {
          endpoint: 'finance/get/account',
          params: { name: addr },
          type: CARD_TYPES.USER,
        };
      case SEARCH_KINDS.INVOICE:
        return {
          endpoint: 'invoices/get/invoice',
          params: { address: addr.substring(8) },
          type: CARD_TYPES.INVOICE,
        };
      case SEARCH_KINDS.ADDRESS:
        return addressAPI(addr);
      case SEARCH_KINDS.REGISTER_ID: {
        //the node takes base58 only, the explorer index knows both forms
        const res = await getIndex(`register/${addr.toLowerCase()}`).catch(
          () => null
        );
        if (!res?.result?.address) {
          throw new Error(
            'This is a register address in hex form, which only the explorer index can look up, and it does not know this one'
          );
        }
        return addressAPI(res.result.address);
      }
      case SEARCH_KINDS.GENESIS:
        return {
          endpoint: 'profiles/status/master',
          params: { genesis: addr.toLowerCase() },
          type: CARD_TYPES.GENESIS,
        };
      case SEARCH_KINDS.TRANSACTION:
        return {
          endpoint: 'ledger/get/transaction',
          params: { hash: addr },
          type: CARD_TYPES.TRANSACTION,
        };
      case SEARCH_KINDS.BLOCK_HASH:
        return {
          endpoint: 'ledger/get/block',
          params: { hash: addr, verbose: 'detail' },
          type: CARD_TYPES.BLOCK,
        };
      default:
        return {
          endpoint: 'ledger/get/block',
          params: { height: addr, verbose: 'detail' },
          type: CARD_TYPES.BLOCK,
        };
    }
  }

  const { isLoading, data, error, isError } = useQuery(
    ['scan', addr, network.name],
    async () => {
      const { endpoint, params, type } = await getAPI(addr);
      setCardType(type);
      return getScanResults(endpoint, params);
    },
    {
      staleTime: 60000,
      enabled: !!searchKind,
      retry: false,
    }
  );

  const rawInfo = (
    <details className={detailStyles.raw}>
      <summary>Raw node response</summary>
      <pre>{JSON.stringify(data || error, null, 2)}</pre>
    </details>
  );

  return (
    <Layout>
      <PageHeader
        page={cardType || 'SEARCH'}
        title={
          cardType
            ? `${scanTitles[cardType] || 'Scan'} ${shortHash(
                addr.replace(/^invoice-/, ''),
                6
              )} | ${TYPES.PAGEMETA.SITE}`
            : undefined
        }
      />
      <div>
        {!searchKind && <NameSearch query={addr} />}
        {searchKind && isError && (
          <SearchHelp
            query={addr}
            notFound
            message={
              //the node answers "Block not found" for an unknown genesis
              searchKind === SEARCH_KINDS.GENESIS
                ? 'No signature chain with this genesis'
                : pathOr(
                    error?.message,
                    ['response', 'data', 'error', 'message'],
                    error
                  )
            }
          />
        )}
        <PromiseLayout
          isLoading={!!searchKind && isLoading}
          isError={false}
          error={{}}>
          {data?.result && (
            <>
              {cardType === CARD_TYPES.BLOCK && (
                <BlockDetail block={data.result} />
              )}
              {cardType === CARD_TYPES.TRANSACTION && (
                <TransactionDetail tx={data.result} />
              )}
              {[
                CARD_TYPES.TRUST,
                CARD_TYPES.USER,
                CARD_TYPES.TOKEN,
                CARD_TYPES.ASSET,
              ].includes(cardType) && (
                <AccountDetail type={cardType} data={data.result} />
              )}
              {cardType === CARD_TYPES.GENESIS && (
                <OwnerDetail status={data.result} />
              )}
              {cardType === CARD_TYPES.INVOICE && (
                <InvoiceWithData data={data?.result} onBack={goBack} isPage />
              )}
            </>
          )}
        </PromiseLayout>
        {isDev && rawInfo}
      </div>
    </Layout>
  );
}

export default Scan;
